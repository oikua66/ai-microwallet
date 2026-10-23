create table if not exists public.micro_wallets (
  id uuid primary key,
  owner_role text not null check (owner_role in ('buyer', 'seller')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  balance_minor bigint not null check (balance_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_role, currency)
);

create table if not exists public.micro_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type = 'internal_micro_purchase'),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  buyer_wallet_id uuid not null references public.micro_wallets(id),
  seller_wallet_id uuid not null references public.micro_wallets(id),
  idempotency_key text not null unique,
  buyer_balance_after bigint not null check (buyer_balance_after >= 0),
  seller_balance_after bigint not null check (seller_balance_after >= 0),
  created_at timestamptz not null default now(),
  check (buyer_wallet_id <> seller_wallet_id)
);

create table if not exists public.micro_wallet_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.micro_wallet_transactions(id),
  wallet_id uuid not null references public.micro_wallets(id),
  entry_type text not null check (entry_type in ('debit', 'credit')),
  amount_minor bigint not null check (amount_minor > 0),
  created_at timestamptz not null default now(),
  unique (transaction_id, wallet_id, entry_type)
);

create or replace function public.prevent_micro_wallet_ledger_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Ledger evidence is immutable';
end;
$$;

create trigger micro_wallet_transactions_immutable
before update or delete on public.micro_wallet_transactions
for each row execute function public.prevent_micro_wallet_ledger_mutation();

create trigger micro_wallet_entries_immutable
before update or delete on public.micro_wallet_ledger_entries
for each row execute function public.prevent_micro_wallet_ledger_mutation();

-- Demo seed only; these balances are not represented as PayPal-funded.
insert into public.micro_wallets (id, owner_role, currency, balance_minor)
values
  ('00000000-0000-4000-8000-000000000001', 'buyer', 'USD', 500),
  ('00000000-0000-4000-8000-000000000002', 'seller', 'USD', 0)
on conflict (owner_role, currency) do nothing;

create or replace function public.settle_micro_purchase(
  p_buyer_wallet_id uuid,
  p_seller_wallet_id uuid,
  p_amount_minor bigint,
  p_currency text,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  buyer public.micro_wallets%rowtype;
  seller public.micro_wallets%rowtype;
  prior public.micro_wallet_transactions%rowtype;
  new_id uuid;
  stamp timestamptz;
begin
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Amount must be a positive integer minor-unit value';
  end if;
  if p_currency is distinct from 'USD' then
    raise exception 'Unsupported currency';
  end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 16 or length(p_idempotency_key) > 128 then
    raise exception 'Invalid idempotency key';
  end if;
  if p_buyer_wallet_id is null or p_seller_wallet_id is null or p_buyer_wallet_id = p_seller_wallet_id then
    raise exception 'Buyer and seller must be distinct wallets';
  end if;

  -- Acquire locks in stable order so concurrent purchases cannot overspend or deadlock.
  perform id from public.micro_wallets
   where id in (p_buyer_wallet_id, p_seller_wallet_id)
   order by id for update;
  select * into buyer from public.micro_wallets where id = p_buyer_wallet_id;
  select * into seller from public.micro_wallets where id = p_seller_wallet_id;
  if buyer.id is null or seller.id is null then raise exception 'Unknown wallet'; end if;
  if buyer.owner_role <> 'buyer' or seller.owner_role <> 'seller' then raise exception 'Invalid wallet roles'; end if;
  if buyer.currency <> p_currency or seller.currency <> p_currency then raise exception 'Wallet currency mismatch'; end if;
  if buyer.balance_minor < p_amount_minor then raise exception 'Insufficient balance'; end if;
  if seller.balance_minor > 9223372036854775807 - p_amount_minor then raise exception 'Balance limit exceeded'; end if;

  stamp := now();
  insert into public.micro_wallet_transactions
    (transaction_type, amount_minor, currency, buyer_wallet_id, seller_wallet_id,
     idempotency_key, buyer_balance_after, seller_balance_after, created_at)
  values
    ('internal_micro_purchase', p_amount_minor, p_currency, p_buyer_wallet_id, p_seller_wallet_id,
     p_idempotency_key, buyer.balance_minor - p_amount_minor, seller.balance_minor + p_amount_minor, stamp)
  on conflict (idempotency_key) do nothing
  returning id into new_id;

  if new_id is null then
    select * into prior from public.micro_wallet_transactions where idempotency_key = p_idempotency_key;
    if prior.buyer_wallet_id <> p_buyer_wallet_id or prior.seller_wallet_id <> p_seller_wallet_id
       or prior.amount_minor <> p_amount_minor or prior.currency <> p_currency then
      raise exception 'Idempotency key was already used for a different settlement';
    end if;
    return jsonb_build_object(
      'reference', prior.id, 'amountMinor', prior.amount_minor, 'currency', prior.currency,
      'buyerBalanceMinor', prior.buyer_balance_after, 'sellerBalanceMinor', prior.seller_balance_after,
      'createdAt', prior.created_at, 'duplicate', true
    );
  end if;

  update public.micro_wallets
     set balance_minor = balance_minor - p_amount_minor, updated_at = stamp
   where id = p_buyer_wallet_id and balance_minor >= p_amount_minor;
  if not found then raise exception 'Insufficient balance'; end if;
  update public.micro_wallets
     set balance_minor = balance_minor + p_amount_minor, updated_at = stamp
   where id = p_seller_wallet_id;
  if not found then raise exception 'Unknown wallet'; end if;

  insert into public.micro_wallet_ledger_entries (transaction_id, wallet_id, entry_type, amount_minor)
  values (new_id, p_buyer_wallet_id, 'debit', p_amount_minor),
         (new_id, p_seller_wallet_id, 'credit', p_amount_minor);

  return jsonb_build_object(
    'reference', new_id, 'amountMinor', p_amount_minor, 'currency', p_currency,
    'buyerBalanceMinor', buyer.balance_minor - p_amount_minor,
    'sellerBalanceMinor', seller.balance_minor + p_amount_minor,
    'createdAt', stamp, 'duplicate', false
  );
end;
$$;

create or replace function public.micro_wallet_demo_state()
returns jsonb
language sql security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'wallets', (select coalesce(jsonb_agg(jsonb_build_object(
      'role', owner_role, 'currency', currency, 'balanceMinor', balance_minor
    ) order by owner_role), '[]'::jsonb) from public.micro_wallets
      where id in ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002')),
    'ledger', (select coalesce(jsonb_agg(jsonb_build_object(
      'reference', t.id, 'amountMinor', t.amount_minor, 'currency', t.currency,
      'buyerBalanceAfter', t.buyer_balance_after, 'sellerBalanceAfter', t.seller_balance_after,
      'createdAt', t.created_at
    ) order by t.created_at desc), '[]'::jsonb) from public.micro_wallet_transactions t
      where t.buyer_wallet_id = '00000000-0000-4000-8000-000000000001'
         or t.seller_wallet_id = '00000000-0000-4000-8000-000000000002')
  );
$$;

alter table public.micro_wallets enable row level security;
alter table public.micro_wallet_transactions enable row level security;
alter table public.micro_wallet_ledger_entries enable row level security;
revoke all on public.micro_wallets, public.micro_wallet_transactions, public.micro_wallet_ledger_entries from public, anon, authenticated;
revoke all on function public.settle_micro_purchase(uuid, uuid, bigint, text, text) from public, anon, authenticated;
revoke all on function public.micro_wallet_demo_state() from public, anon, authenticated;
grant execute on function public.settle_micro_purchase(uuid, uuid, bigint, text, text) to service_role;
grant execute on function public.micro_wallet_demo_state() to service_role;
