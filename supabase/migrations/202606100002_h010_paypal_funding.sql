create table if not exists public.micro_wallet_paypal_fundings (
  order_id text primary key,
  capture_id text not null unique,
  amount_minor bigint not null check (amount_minor = 500),
  currency text not null check (currency = 'USD'),
  buyer_balance_after bigint not null check (buyer_balance_after >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.record_paypal_funding(
  p_order_id text,
  p_capture_id text,
  p_amount_minor bigint,
  p_currency text
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  prior public.micro_wallet_paypal_fundings%rowtype;
  buyer public.micro_wallets%rowtype;
  new_balance bigint;
  stamp timestamptz;
begin
  if p_order_id is null or length(p_order_id) < 1 or length(p_order_id) > 64
     or p_capture_id is null or length(p_capture_id) < 1 or length(p_capture_id) > 64 then
    raise exception 'Invalid PayPal funding identifiers';
  end if;
  if p_amount_minor is distinct from 500 or p_currency is distinct from 'USD' then
    raise exception 'Funding amount and currency do not match expected PayPal funding';
  end if;

  -- Serialize funding operations against the buyer wallet before checking idempotency.
  select * into buyer
    from public.micro_wallets
   where id = '00000000-0000-4000-8000-000000000001'
   for update;
  if buyer.id is null or buyer.owner_role <> 'buyer' or buyer.currency <> 'USD' then
    raise exception 'Buyer wallet is unavailable';
  end if;

  select * into prior from public.micro_wallet_paypal_fundings where order_id = p_order_id;
  if found then
    if prior.capture_id <> p_capture_id or prior.amount_minor <> p_amount_minor or prior.currency <> p_currency then
      raise exception 'PayPal order was already recorded with different funding details';
    end if;
    return jsonb_build_object(
      'orderId', prior.order_id, 'captureId', prior.capture_id,
      'amountMinor', prior.amount_minor, 'currency', prior.currency,
      'buyerBalanceAfter', prior.buyer_balance_after, 'duplicate', true
    );
  end if;
  if exists (select 1 from public.micro_wallet_paypal_fundings where capture_id = p_capture_id) then
    raise exception 'PayPal capture was already recorded for a different order';
  end if;
  if buyer.balance_minor > 9007199254740491 then
    raise exception 'Buyer balance limit exceeded';
  end if;

  new_balance := buyer.balance_minor + p_amount_minor;
  stamp := now();
  update public.micro_wallets
     set balance_minor = new_balance, updated_at = stamp
   where id = buyer.id;
  insert into public.micro_wallet_paypal_fundings
    (order_id, capture_id, amount_minor, currency, buyer_balance_after, created_at)
  values (p_order_id, p_capture_id, p_amount_minor, p_currency, new_balance, stamp);

  return jsonb_build_object(
    'orderId', p_order_id, 'captureId', p_capture_id,
    'amountMinor', p_amount_minor, 'currency', p_currency,
    'buyerBalanceAfter', new_balance, 'duplicate', false
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
         or t.seller_wallet_id = '00000000-0000-4000-8000-000000000002'),
    'fundings', (select coalesce(jsonb_agg(jsonb_build_object(
      'orderId', f.order_id, 'captureId', f.capture_id, 'amountMinor', f.amount_minor,
      'currency', f.currency, 'buyerBalanceAfter', f.buyer_balance_after, 'createdAt', f.created_at
    ) order by f.created_at desc), '[]'::jsonb) from public.micro_wallet_paypal_fundings f)
  );
$$;

alter table public.micro_wallet_paypal_fundings enable row level security;
revoke all on public.micro_wallet_paypal_fundings from public, anon, authenticated;
revoke all on function public.record_paypal_funding(text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.record_paypal_funding(text, text, bigint, text) to service_role;
grant execute on function public.micro_wallet_demo_state() to service_role;
