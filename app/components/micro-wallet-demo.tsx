"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Wallet = { role: "buyer" | "seller"; currency: string; balanceMinor: number };
type Receipt = { reference: string; amountMinor: number; currency: string; buyerBalanceMinor: number; sellerBalanceMinor: number; duplicate: boolean };
type Funding = { orderId: string; captureId: string; amountMinor: number; currency: string; createdAt: string };
type LedgerEntry = { reference: string; productService: string; buyerWalletId: string; sellerWalletId: string; amountMinor: number; currency: string; buyerBalanceAfter: number; sellerBalanceAfter: number; createdAt: string };
type State = {
  wallets: Wallet[];
  ledger: LedgerEntry[];
  fundings: Funding[];
  summary: { micro_purchase_count: number; real_paypal_payment_count: number; internal_volume: number; average_micro_purchase: number; seller_pending_balance: number };
};
const money = (minor: number, currency = "USD") => `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")} ${currency}`;

export default function MicroWalletDemo() {
  const [state, setState] = useState<State | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paypalBusy, setPaypalBusy] = useState(false);
  const [paypalStatus, setPaypalStatus] = useState("");
  const key = useRef("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/micro-wallet", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load wallet history.");
    setState(result);
  }, []);

  useEffect(() => {
    let active = true;
    const clearPaypalQuery = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("paypal");
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url);
    };
    async function handlePaypalReturn() {
      const url = new URL(window.location.href);
      const result = url.searchParams.get("paypal");
      if (result === "cancel") {
        setPaypalStatus("PayPal Sandbox funding was cancelled; no funding is reported.");
        clearPaypalQuery();
        return;
      }
      if (result !== "return") return;
      const orderId = url.searchParams.get("token");
      if (!orderId) {
        setPaypalStatus("PayPal returned without an order reference. Funding was not confirmed.");
        clearPaypalQuery();
        return;
      }
      setPaypalBusy(true);
      setPaypalStatus("Verifying PayPal Sandbox capture…");
      try {
        const response = await fetch("/api/paypal/capture", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const capture = await response.json();
        if (!response.ok) throw new Error(capture.error || "PayPal capture could not be verified.");
        if (active) setPaypalStatus(`PayPal Sandbox funding confirmed: ${capture.amount} ${capture.currency}; capture reference ${capture.captureId}.`);
        clearPaypalQuery();
        try { await refresh(); } catch { if (active) setError("Funding was confirmed, but wallet history could not be refreshed."); }
      } catch (reason) {
        if (active) setPaypalStatus(reason instanceof Error ? reason.message : "PayPal capture could not be verified.");
        clearPaypalQuery();
      } finally {
        if (active) setPaypalBusy(false);
      }
    }
    refresh().catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Could not load wallet history."); });
    void handlePaypalReturn();
    return () => { active = false; };
  }, [refresh]);

  async function pay() {
    setBusy(true); setError(""); setReceipt(null);
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/micro-wallet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMinor: 20, currency: "USD", idempotencyKey: key.current }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Settlement failed.");
      setReceipt(result); key.current = "";
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Settlement failed.");
    } finally { setBusy(false); }
  }

  async function startPaypalFunding() {
    setPaypalBusy(true); setError(""); setPaypalStatus("Creating a PayPal Sandbox funding order…");
    try {
      const response = await fetch("/api/paypal/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start PayPal Sandbox funding.");
      if (typeof result.approvalUrl !== "string") throw new Error("PayPal did not provide an approval link.");
      setPaypalStatus("Continue to PayPal Sandbox to approve the real funding transaction.");
      window.location.assign(result.approvalUrl);
    } catch (reason) {
      setPaypalStatus(reason instanceof Error ? reason.message : "Could not start PayPal Sandbox funding.");
      setPaypalBusy(false);
    }
  }

  const buyer = state?.wallets.find(wallet => wallet.role === "buyer");
  const seller = state?.wallets.find(wallet => wallet.role === "seller");
  return <section className="stage wallet-stage" aria-label="Buyer and seller MicroWallet">
    <div id="wallet">
      <p className="stage-label">Step 2 · Persistent buyer wallet</p>
      <h2>Buyer MicroWallet</h2>
      <p>Balances and history load from backend state. Demo seed funds are not represented as PayPal-funded.</p>
    </div>
    {state === null && !error && <p role="status">Loading persistent wallet balances and ledger…</p>}
    <p>Buyer balance: <strong>{buyer ? money(buyer.balanceMinor, buyer.currency) : "—"}</strong></p>
    <p>Seller accumulated balance: <strong>{seller ? money(seller.balanceMinor, seller.currency) : "—"}</strong></p>
    <p>Seller purchase count: <strong>{state ? state.summary.micro_purchase_count : "—"}</strong></p>
    <div id="seller" className="seller-state">
      <p className="stage-label">Step 4 · Seller MicroWallet</p>
      <h3>Seller accumulation &amp; withdrawal state</h3>
      <p>Settlement state: accumulating internal credits. Withdrawal request: not requested. No external payout is executed or claimed.</p>
    </div>

    <div className="checkout-stage" id="checkout">
      <p className="stage-label">Step 3 · Merchant checkout</p>
      <h3>Buy a demo digital service</h3>
      <p>Demo micro-purchase: <strong>0.20 USD</strong></p>
      <button type="button" onClick={pay} disabled={busy || !buyer || !seller}>{busy ? "Settling…" : "Pay with MicroWallet"}</button>{" "}
      <button type="button" onClick={startPaypalFunding} disabled={paypalBusy}>{paypalBusy ? "Processing…" : "PayPal — top up wallet first"}</button>
      <p>AI recommendations are advice only. Deterministic policy settles this 0.20 USD purchase internally. PayPal Sandbox is the external funding alternative: it funds the buyer wallet first and does not create a PayPal transaction for this individual micro-purchase.</p>
      {paypalStatus && <p role="status">{paypalStatus}</p>}
    </div>

    {state?.summary && <div className="settlement-summary" id="aggregation" aria-label="Aggregation summary">
      <p className="stage-label">Step 5 · Recorded aggregation</p>
      <h3>Internal purchases vs. PayPal funding</h3>
      <p>Internal micro-purchases (N): {state.summary.micro_purchase_count}</p>
      <p>Real PayPal funding transactions (M): {state.summary.real_paypal_payment_count}</p>
      <p>{state.summary.micro_purchase_count > state.summary.real_paypal_payment_count ? "N > M: multiple internal purchases are aggregated without a PayPal transaction per purchase." : "Each internal purchase avoids a separate PayPal transaction. Complete multiple MicroWallet purchases to see N exceed M."}</p>
      <p>Internal volume: {state.summary.internal_volume.toFixed(2)} USD</p>
      <p>Average micro-purchase: {state.summary.average_micro_purchase.toFixed(2)} USD</p>
      <p>Seller pending balance: {state.summary.seller_pending_balance.toFixed(2)} USD</p>
    </div>}

    {error && <p className="notice" role="alert">{error}</p>}
    {receipt && <div className="receipt" role="status">
      <h3>Internal settlement complete</h3>
      <p>Reference: {receipt.reference}{receipt.duplicate ? " (idempotent retry)" : ""}</p>
      <p>Amount: {money(receipt.amountMinor, receipt.currency)}</p>
      <p>Buyer balance after: {money(receipt.buyerBalanceMinor, receipt.currency)}</p>
      <p>Seller balance after: {money(receipt.sellerBalanceMinor, receipt.currency)}</p>
      <p><strong>Internal MicroWallet transaction — no PayPal transaction created</strong></p>
    </div>}

    <h3>Internal ledger</h3>
    <p>Each entry records the service, internal purchase and wallet references, buyer debit, seller credit, and timestamp. PayPal funding references are listed separately because funding is recorded at wallet level, not linked to an individual purchase.</p>
    {state?.ledger.length ? <ol>{state.ledger.map(entry => <li key={entry.reference}>
      <strong>{entry.productService}</strong> — internal purchase reference {entry.reference}; buyer wallet {entry.buyerWalletId}; seller wallet {entry.sellerWalletId}; buyer debit {money(entry.amountMinor, entry.currency)}; seller credit {money(entry.amountMinor, entry.currency)}; buyer balance after {money(entry.buyerBalanceAfter, entry.currency)}, seller balance after {money(entry.sellerBalanceAfter, entry.currency)}; {new Date(entry.createdAt).toLocaleString()}. PayPal funding references are shown separately below when recorded.
    </li>)}</ol> : <p>{state ? "No internal settlements recorded yet. Complete a MicroWallet checkout to create the first ledger entry." : "Ledger is unavailable until wallet history loads."}</p>}

    <h3>PayPal funding references</h3>
    {state?.fundings?.length ? <ol>{state.fundings.map(funding => <li key={funding.captureId}>
      <strong>External PayPal Sandbox funding</strong> — {money(funding.amountMinor, funding.currency)}; order {funding.orderId}; capture {funding.captureId}; {new Date(funding.createdAt).toLocaleString()}
    </li>)}</ol> : <p>{state ? "No verified PayPal funding has been recorded yet." : "Funding history is unavailable until wallet history loads."}</p>}
  </section>;
}
