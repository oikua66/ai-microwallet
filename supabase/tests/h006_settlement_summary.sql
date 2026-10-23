-- Run after the H-006 migration against a disposable/test database.
-- The outer transaction rolls back the funding and settlement test data.
begin;

do $$
declare
  buyer_id constant uuid := '00000000-0000-4000-8000-000000000001';
  seller_id constant uuid := '00000000-0000-4000-8000-000000000002';
  order_ref text := 'h006-order-' || gen_random_uuid()::text;
  capture_ref text := 'h006-capture-' || gen_random_uuid()::text;
  first_funding jsonb;
  retry_funding jsonb;
  state_before jsonb;
  state_after jsonb;
  balance_before bigint;
  balance_after bigint;
  tx_count_before bigint;
  volume_before bigint;
  expected_average numeric;
  i integer;
begin
  update public.micro_wallets set balance_minor = 10000 where id = buyer_id;
  update public.micro_wallets set balance_minor = 0 where id = seller_id;
  if (select count(*) from public.micro_wallets where id in (buyer_id, seller_id)) <> 2 then
    raise exception 'H-006 demo wallets are missing';
  end if;

  state_before := public.micro_wallet_demo_state();
  select balance_minor into balance_before from public.micro_wallets where id = buyer_id;
  select count(*), coalesce(sum(amount_minor), 0)
    into tx_count_before, volume_before
    from public.micro_wallet_transactions
   where buyer_wallet_id = buyer_id and seller_wallet_id = seller_id;

  first_funding := public.record_paypal_funding(order_ref, capture_ref, 500, 'USD');
  retry_funding := public.record_paypal_funding(order_ref, capture_ref, 500, 'USD');
  select balance_minor into balance_after from public.micro_wallets where id = buyer_id;
  if (first_funding->>'duplicate')::boolean is distinct from false
     or (retry_funding->>'duplicate')::boolean is distinct from true
     or balance_after <> balance_before + 500 then
    raise exception 'PayPal funding was not persistently credited exactly once';
  end if;

  for i in 1..3 loop
    perform public.settle_micro_purchase(
      buyer_id, seller_id, 20, 'USD', 'h006-test-' || i || '-' || gen_random_uuid()::text
    );
  end loop;

  state_after := public.micro_wallet_demo_state();
  if (state_after#>>'{summary,micro_purchase_count}')::bigint < tx_count_before + 3
     or (state_after#>>'{summary,real_paypal_payment_count}')::bigint <
        (state_before#>>'{summary,real_paypal_payment_count}')::bigint + 1
     or (state_after#>>'{summary,internal_volume}')::numeric <
        (state_before#>>'{summary,internal_volume}')::numeric + 0.60 then
    raise exception 'Settlement metrics did not include the recorded funding and three internal purchases';
  end if;

  select round((coalesce(sum(amount_minor), 0)::numeric + 60) / 100 /
               (count(*) + 3), 2)
    into expected_average
    from public.micro_wallet_transactions
   where buyer_wallet_id = buyer_id and seller_wallet_id = seller_id;
  if (state_after#>>'{summary,average_micro_purchase}')::numeric <> expected_average then
    raise exception 'Average micro-purchase was not derived from ledger transactions';
  end if;
  if (state_after#>>'{summary,seller_pending_balance}')::numeric < 0.60
     or (state_after#>>'{summary,seller_pending_balance}')::numeric <>
        (select balance_minor::numeric / 100 from public.micro_wallets where id = seller_id) then
    raise exception 'Seller pending balance does not match persistent wallet balance';
  end if;
end;
$$;

rollback;
