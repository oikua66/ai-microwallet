-- Run after the H-002 migration against a disposable/test database.
-- The outer transaction rolls back the seeded balances and all test ledger rows.
begin;

do $$
declare
  buyer_id constant uuid := '00000000-0000-4000-8000-000000000001';
  seller_id constant uuid := '00000000-0000-4000-8000-000000000002';
  request_key text := 'h002-test-' || gen_random_uuid()::text;
  first_result jsonb;
  retry_result jsonb;
  buyer_balance bigint;
  seller_balance bigint;
  entries_before bigint;
  entries_after bigint;
  entry_count bigint;
  debit_total bigint;
  credit_total bigint;
begin
  update public.micro_wallets set balance_minor = 500 where id = buyer_id;
  update public.micro_wallets set balance_minor = 0 where id = seller_id;
  if (select count(*) from public.micro_wallets where id in (buyer_id, seller_id)) <> 2 then
    raise exception 'H-002 demo wallets are missing';
  end if;
  select count(*) into entries_before from public.micro_wallet_ledger_entries;

  first_result := public.settle_micro_purchase(buyer_id, seller_id, 125, 'USD', request_key);
  if (first_result->>'duplicate')::boolean is distinct from false then
    raise exception 'First settlement was unexpectedly a retry';
  end if;
  retry_result := public.settle_micro_purchase(buyer_id, seller_id, 125, 'USD', request_key);
  if (retry_result->>'duplicate')::boolean is distinct from true
     or retry_result->>'reference' is distinct from first_result->>'reference' then
    raise exception 'Same-key retry did not return the original settlement';
  end if;

  select balance_minor into buyer_balance from public.micro_wallets where id = buyer_id;
  select balance_minor into seller_balance from public.micro_wallets where id = seller_id;
  select count(*), coalesce(sum(amount_minor) filter (where entry_type = 'debit'), 0),
         coalesce(sum(amount_minor) filter (where entry_type = 'credit'), 0)
    into entry_count, debit_total, credit_total
    from public.micro_wallet_ledger_entries
   where transaction_id = (first_result->>'reference')::uuid;
  select count(*) into entries_after from public.micro_wallet_ledger_entries;
  if buyer_balance <> 375 or seller_balance <> 125 or buyer_balance + seller_balance <> 500
     or entry_count <> 2 or debit_total <> 125 or credit_total <> 125
     or entries_after <> entries_before + 2 then
    raise exception 'Successful settlement did not produce the expected atomic double-entry result';
  end if;

  begin
    update public.micro_wallet_ledger_entries
       set amount_minor = 124
     where transaction_id = (first_result->>'reference')::uuid;
    raise exception 'Expected immutable-ledger rejection';
  exception when others then
    if sqlerrm <> 'Ledger evidence is immutable' then raise; end if;
  end;

  begin
    perform public.settle_micro_purchase(buyer_id, seller_id, 124, 'USD', request_key);
    raise exception 'Expected conflicting idempotency-key rejection';
  exception when others then
    if sqlerrm <> 'Idempotency key was already used for a different settlement' then raise; end if;
  end;

  begin
    perform public.settle_micro_purchase(buyer_id, buyer_id, 1, 'USD', 'h002-self-' || gen_random_uuid()::text);
    raise exception 'Expected same-wallet rejection';
  exception when others then
    if sqlerrm <> 'Buyer and seller must be distinct wallets' then raise; end if;
  end;

  begin
    perform public.settle_micro_purchase(buyer_id, seller_id, 376, 'USD', 'h002-insufficient-' || gen_random_uuid()::text);
    raise exception 'Expected insufficient-balance rejection';
  exception when others then
    if sqlerrm <> 'Insufficient balance' then raise; end if;
  end;
  select balance_minor into buyer_balance from public.micro_wallets where id = buyer_id;
  select balance_minor into seller_balance from public.micro_wallets where id = seller_id;
  select count(*) into entries_after from public.micro_wallet_ledger_entries;
  if buyer_balance <> 375 or seller_balance <> 125 or entries_after <> entries_before + 2 then
    raise exception 'Insufficient-balance failure changed balances or ledger';
  end if;
end;
$$;

rollback;
