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
  new_balance bigint;
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
      'amountMinor', prior.amount_minor, 'currency', prior.currency,
      'buyerBalanceAfter', prior.buyer_balance_after, 'duplicate', true);
  end if;

  select * into buyer from public.micro_wallets
   where id = '00000000-0000-4000-8000-000000000001' for update;
  if buyer.id is null or buyer.owner_role <> 'buyer' or buyer.currency <> p_currency then
    raise exception 'Unknown or invalid buyer wallet';
  end if;
  if buyer.balance_minor > 9223372036854775807 - p_amount_minor then
    raise exception 'Balance limit exceeded';
  end if;

  new_balance := buyer.balance_minor + p_amount_minor;
  stamp := now();
  insert into public.micro_wallet_paypal_fundings
    (order_id, capture_id, wallet_id, amount_minor, currency, buyer_balance_after, created_at)
  values (p_order_id, p_capture_id, buyer.id, p_amount_minor, p_currency, new_balance, stamp);
  update public.micro_wallets
     set balance_minor = new_balance, updated_at = stamp
   where id = buyer.id;

  return jsonb_build_object('orderId', p_order_id, 'captureId', p_capture_id,
    'amountMinor', p_amount_minor, 'currency', p_currency,
    'buyerBalanceAfter', new_balance, 'duplicate', false);
end;
$$;

revoke all on function public.record_paypal_funding(text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.record_paypal_funding(text, text, bigint, text) to service_role;
