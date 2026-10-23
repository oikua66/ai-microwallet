create table public.micro_wallet_paypal_fundings (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  capture_id text not null unique,
  wallet_id uuid not null references public.micro_wallets(id),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency = 'USD'),
  created_at timestamptz not null default now()
);

create trigger micro_wallet_paypal_fundings_immutable
before update or delete on public.micro_wallet_paypal_fundings
for each row execute function public.prevent_micro_wallet_ledger_mutation();

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
  buyer public.micro_wallets%rowtype;
  prior public.micro_wallet_paypal_fundings%rowtype;
  stamp timestamptz;
begin
  if p_order_id is null or length(p_order_id) not between 1 and 64
     or p_capture_id is null or length(p_capture_id) not between 1 and 64 then
    raise exception 'Invalid PayPal funding reference';
  end if;
  if p_amount_minor is distinct from 500 or p_currency is distinct from 'USD' then
    raise exception 'Unexpected PayPal funding amount';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('paypal:' || p_order_id, 0));
  select * into prior from public.micro_wallet_paypal_fundings
   where order_id = p_order_id or capture_id = p_capture_id;
  if found then
    if prior.order_id <> p_order_id or prior.capture_id <> p_capture_id
       or prior.amount_minor <> p_amount_minor or prior.currency <> p_currency then
      raise exception 'PayPal funding reference was already used';
    end if;
    return jsonb_build_object('orderId', prior.order_id, 'captureId', prior.capture_id,
      'amountMinor', prior.amount_minor, 'currency', prior.currency, 'duplicate', true);
  end if;

  select * into buyer from public.micro_wallets
   where id = '00000000-0000-4000-8000-000000000001' for update;
  if buyer.id is null or buyer.owner_role <> 'buyer' or buyer.currency <> p_currency then
    raise exception 'Unknown or invalid buyer wallet';
  end if;
  if buyer.balance_minor > 9223372036854775807 - p_amount_minor then
    raise exception 'Balance limit exceeded';
  end if;

  stamp := now();
  insert into public.micro_wallet_paypal_fundings
    (order_id, capture_id, wallet_id, amount_minor, currency, created_at)
  values (p_order_id, p_capture_id, buyer.id, p_amount_minor, p_currency, stamp);
  update public.micro_wallets
     set balance_minor = balance_minor + p_amount_minor, updated_at = stamp
   where id = buyer.id;
  return jsonb_build_object('orderId', p_order_id, 'captureId', p_capture_id,
    'amountMinor', p_amount_minor, 'currency', p_currency, 'duplicate', false);
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
    'summary', jsonb_build_object(
      'micro_purchase_count', (select count(*) from public.micro_wallet_transactions t
        where t.buyer_wallet_id = '00000000-0000-4000-8000-000000000001'
          and t.seller_wallet_id = '00000000-0000-4000-8000-000000000002'),
      'real_paypal_payment_count', (select count(*) from public.micro_wallet_paypal_fundings
        where wallet_id = '00000000-0000-4000-8000-000000000001'),
      'internal_volume', (select round(coalesce(sum(t.amount_minor), 0)::numeric / 100, 2)
        from public.micro_wallet_transactions t
        where t.buyer_wallet_id = '00000000-0000-4000-8000-000000000001'
          and t.seller_wallet_id = '00000000-0000-4000-8000-000000000002'),
      'average_micro_purchase', (select round(coalesce(avg(t.amount_minor), 0)::numeric / 100, 2)
        from public.micro_wallet_transactions t
        where t.buyer_wallet_id = '00000000-0000-4000-8000-000000000001'
          and t.seller_wallet_id = '00000000-0000-4000-8000-000000000002'),
      'seller_pending_balance', (select round(coalesce(w.balance_minor, 0)::numeric / 100, 2)
        from public.micro_wallets w
        where w.id = '00000000-0000-4000-8000-000000000002')
    )
  );
$$;

alter table public.micro_wallet_paypal_fundings enable row level security;
revoke all on public.micro_wallet_paypal_fundings from public, anon, authenticated;
revoke all on function public.record_paypal_funding(text, text, bigint, text) from public, anon, authenticated;
revoke all on function public.micro_wallet_demo_state() from public, anon, authenticated;
grant execute on function public.record_paypal_funding(text, text, bigint, text) to service_role;
grant execute on function public.micro_wallet_demo_state() to service_role;
