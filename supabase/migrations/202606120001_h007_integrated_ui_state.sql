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
      'orderId', f.order_id,
      'captureId', f.capture_id,
      'amountMinor', f.amount_minor,
      'currency', f.currency,
      'createdAt', f.created_at
    ) order by f.created_at desc), '[]'::jsonb)
      from public.micro_wallet_paypal_fundings f
      where f.wallet_id = '00000000-0000-4000-8000-000000000001'),
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

revoke all on function public.micro_wallet_demo_state() from public, anon, authenticated;
grant execute on function public.micro_wallet_demo_state() to service_role;
