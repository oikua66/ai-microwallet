"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AIRecommendationDemo from "@/app/components/ai-recommendation-demo";

type Wallet = { role: "buyer" | "seller"; currency: string; balanceMinor: number };
type Receipt = { reference: string; amountMinor: number; currency: string; buyerBalanceMinor: number; sellerBalanceMinor: number; duplicate: boolean };
type State = { wallets: Wallet[]; ledger: Array<{ reference: string; amountMinor: number; currency: string; buyerBalanceAfter: number; sellerBalanceAfter: number; createdAt: string }>; summary: { micro_purchase_count: number; real_paypal_payment_count: number; internal_volume: number; average_micro_purchase: number; seller_pending_balance: number } };
const money = (minor: number, currency = "USD") => `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")} ${currency}`;

export default function MicroWalletDemo() {
  const [state, setState] = useState<State | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/micro-wallet", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load wallet history.");
    setState(result);
  }, []);

  useEffect(() => { refresh().catch(reason => setError(reason instanceof Error ? reason.message : "Could not load wallet history.")); }, [refresh]);

  async function pay() {
    setBusy(true); setError(""); setReceipt(null);
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/micro-wallet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMinor: 25, currency: "USD", idempotencyKey: key.current }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Settlement failed.");
      setReceipt(result); key.current = "";
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Settlement failed.");
    } finally { setBusy(false); }
  }

  const buyer = state?.wallets.find(wallet => wallet.role === "buyer");
  const seller = state?.wallets.find(wallet => wallet.role === "seller");
  return <section className="funding">
    <h2>Internal MicroWallet demo</h2>
    <p>Demo seed only; this balance is not represented as PayPal-funded.</p>
    <p>Buyer balance: <strong>{buyer ? money(buyer.balanceMinor, buyer.currency) : "—"}</strong></p>
    <p>Seller pending balance: <strong>{seller ? money(seller.balanceMinor, seller.currency) : "—"}</strong></p>
    {state?.summary && <div className="settlement-summary" aria-label="Settlement summary">
      <h3>Settlement summary</h3>
      <p>Internal micro-purchases: {state.summary.micro_purchase_count}</p>
      <p>Real PayPal funding transactions: {state.summary.real_paypal_payment_count}</p>
      <p>Internal volume: {state.summary.internal_volume.toFixed(2)} USD</p>
      <p>Average micro-purchase: {state.summary.average_micro_purchase.toFixed(2)} USD</p>
      <p>Seller pending balance: {state.summary.seller_pending_balance.toFixed(2)} USD</p>
    </div>}
    <p>Micro-purchase: <strong>0.25 USD</strong></p>
    <AIRecommendationDemo />
    <button type="button" onClick={pay} disabled={busy || !buyer || !seller}>{busy ? "Settling…" : "Pay with MicroWallet"}</button>
    {error && <p className="notice" role="alert">{error}</p>}
    {receipt && <div className="receipt" role="status">
      <h3>Internal settlement complete</h3>
      <p>Reference: {receipt.reference}{receipt.duplicate ? " (idempotent retry)" : ""}</p>
      <p>Amount: {money(receipt.amountMinor, receipt.currency)}</p>
      <p>Buyer balance after: {money(receipt.buyerBalanceMinor, receipt.currency)}</p>
      <p>Seller balance after: {money(receipt.sellerBalanceMinor, receipt.currency)}</p>
      <p><strong>Internal MicroWallet transaction — no PayPal transaction created</strong></p>
    </div>}
    <h3>Ledger history</h3>
    {state?.ledger.length ? <ol>{state.ledger.map(entry => <li key={entry.reference}>
      {entry.reference} — {money(entry.amountMinor, entry.currency)}; buyer {money(entry.buyerBalanceAfter)}, seller {money(entry.sellerBalanceAfter)}
    </li>)}</ol> : <p>No internal settlements recorded.</p>}
  </section>;
}
