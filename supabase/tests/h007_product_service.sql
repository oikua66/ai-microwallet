-- Run after the H-007 migration against a disposable/test database.
-- The outer transaction rolls back the test purchase and balances.
begin;

do $$
declare
  buyer_id constant uuid := '00000000-0000-4000-8000-000000000001';
  seller_id constant uuid := '00000000-0000-4000-8000-000000000002';
  purchase jsonb;
  state jsonb;
  recorded_product text;
  returned_product text;
begin
  update public.micro_wallets set balance_minor = 500 where id = buyer_id;
  update public.micro_wallets set balance_minor = 0 where id = seller_id;

  purchase := public.settle_micro_purchase(
    buyer_id, seller_id, 25, 'USD', 'h007-product-' || gen_random_uuid()::text
  );
  select product_service into recorded_product
    from public.micro_wallet_transactions
   where id = (purchase->>'reference')::uuid;
  state := public.micro_wallet_demo_state();
  select entry->>'productService' into returned_product
    from jsonb_array_elements(state->'ledger') entry
   where entry->>'reference' = purchase->>'reference';

  if recorded_product is null or returned_product is distinct from recorded_product then
    raise exception 'Ledger did not return the product/service value recorded for the purchase';
  end if;
end;
$$;

rollback;
