-- Run after the H-010 migration against a disposable/test database.
-- The outer transaction rolls back the test wallet changes and funding rows.
begin;

do $$
declare
  buyer_id constant uuid := '00000000-0000-4000-8000-000000000001';
  order_key text := 'h010-order-' || gen_random_uuid()::text;
  capture_key text := 'h010-capture-' || gen_random_uuid()::text;
  result_first jsonb;
  result_retry jsonb;
  buyer_balance bigint;
  funding_count bigint;
begin
  update public.micro_wallets set balance_minor = 420 where id = buyer_id;

  result_first := public.record_paypal_funding(order_key, capture_key, 500, 'USD');
  result_retry := public.record_paypal_funding(order_key, capture_key, 500, 'USD');
  select balance_minor into buyer_balance from public.micro_wallets where id = buyer_id;
  select count(*) into funding_count from public.micro_wallet_paypal_fundings where order_id = order_key;
  if result_first->>'buyerBalanceAfter' <> '920'
     or (result_first->>'duplicate')::boolean is distinct from false
     or result_retry->>'buyerBalanceAfter' <> '920'
     or (result_retry->>'duplicate')::boolean is distinct from true
     or buyer_balance <> 920 or funding_count <> 1 then
    raise exception 'Funding or its duplicate retry did not preserve the single expected credit';
  end if;

  begin
    perform public.record_paypal_funding(order_key || '-invalid', capture_key || '-invalid', 499, 'USD');
    raise exception 'Expected invalid funding amount rejection';
  exception when others then
    if sqlerrm <> 'Funding amount and currency do not match expected PayPal funding' then raise; end if;
  end;
  select balance_minor into buyer_balance from public.micro_wallets where id = buyer_id;
  select count(*) into funding_count from public.micro_wallet_paypal_fundings where order_id = order_key;
  if buyer_balance <> 920 or funding_count <> 1 then
    raise exception 'Rejected funding changed the durable balance or funding history';
  end if;
end;
$$;

rollback;
