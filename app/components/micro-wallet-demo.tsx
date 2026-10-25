"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { userFacingError } from "@/app/lib/demo-errors";

type Wallet = { role: "buyer" | "seller"; currency: string; balanceMinor: number };
type Receipt = { reference: string; amountMinor: number; currency: string; buyerBalanceMinor: number; sellerBalanceMinor: number; duplicate: boolean };
type Funding = { orderId: string; captureId: string; amountMinor: number; currency: string; createdAt: string };
type LedgerEntry = { reference: string; productService: string; buyerWalletId: string; sellerWalletId: string; amountMinor: number; currency: string; buyerBalanceAfter: number; sellerBalanceAfter: number; createdAt: string };
type DemoError = { source: "history" | "purchase" | "demo-purchases" | "paypal-order" | "paypal-capture"; message: string };
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
  const [demoError, setDemoError] = useState<DemoError | null>(null);
  const [paypalRetryOrderId, setPaypalRetryOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paypalBusy, setPaypalBusy] = useState(false);
  const [paypalStatus, setPaypalStatus] = useState("");
  const key = useRef("");
  const paypalOrderKey = useRef("");
  const batchRemaining = useRef(0);
  const batchKey = useRef("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/micro-wallet", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error("Wallet history couldn’t load. Please try again.");
    setState(result);
  }, []);

  useEffect(() => {
    let active = true;
    const clearPaypalQuery = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("paypal");
      url.searchParams.delete("token");
      url.searchParams.delete("PayerID");
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
      setPaypalRetryOrderId(orderId);
      setPaypalStatus("Verifying PayPal Sandbox capture…");
      try {
        const response = await fetch("/api/paypal/capture", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const capture = await response.json();
        if (!response.ok) throw new Error(userFacingError("paypal-capture", capture.error));
        if (active) {
          setPaypalStatus(`PayPal Sandbox funding confirmed: ${capture.amount} ${capture.currency}; capture reference ${capture.captureId}.`);
          setPaypalRetryOrderId(null);
          setDemoError(current => current?.source === "paypal-capture" ? null : current);
        }
        clearPaypalQuery();
        try { await refresh(); } catch { if (active) setDemoError({ source: "history", message: "Funding was confirmed, but wallet history could not be refreshed." }); }
      } catch (reason) {
        if (active) {
          const message = userFacingError("paypal-capture", reason);
          setPaypalStatus(message);
          setDemoError({ source: "paypal-capture", message });
        }
        clearPaypalQuery();
      } finally {
        if (active) setPaypalBusy(false);
      }
    }
    refresh().catch(reason => { if (active) setDemoError({ source: "history", message: reason instanceof Error ? reason.message : "Could not load wallet history." }); });
    void handlePaypalReturn();
    return () => { active = false; };
  }, [refresh]);

  async function pay() {
    setBusy(true);
    setDemoError(current => current?.source === "purchase" ? null : current);
    setReceipt(null);
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/micro-wallet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMinor: 20, currency: "USD", idempotencyKey: key.current }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(userFacingError("purchase", result.error));
      setReceipt(result); key.current = "";
      try { await refresh(); } catch { setDemoError({ source: "history", message: "Purchase completed, but wallet history couldn’t refresh. Please try again." }); }
    } catch (reason) {
      setDemoError({ source: "purchase", message: userFacingError("purchase", reason) });
    } finally { setBusy(false); }
  }

  async function runDemoPurchases() {
    setBusy(true);
    setDemoError(current => current?.source === "demo-purchases" ? null : current);
    setReceipt(null);
    if (batchRemaining.current === 0) batchRemaining.current = 3;
    let latest: Receipt | null = null;
    try {
      while (batchRemaining.current > 0) {
        if (!batchKey.current) batchKey.current = crypto.randomUUID();
        const response = await fetch("/api/micro-wallet", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountMinor: 20, currency: "USD", idempotencyKey: batchKey.current }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error("A purchase couldn’t be completed.");
        latest = result;
        batchKey.current = "";
        batchRemaining.current--;
      }
      if (latest) setReceipt(latest);
      try { await refresh(); } catch { setDemoError({ source: "history", message: "Three purchases completed, but wallet history couldn’t refresh. Please try again." }); }
    } catch {
      const completed = 3 - batchRemaining.current;
      setDemoError({ source: "demo-purchases", message: completed
        ? `${completed} of 3 purchases completed. Retry to finish the remaining purchases, or dismiss this message.`
        : "A purchase couldn’t be completed. Please try again." });
      if (completed) { try { await refresh(); } catch { /* Keep the partial-completion message visible. */ } }
    } finally { setBusy(false); }
  }

  async function retryRefresh() {
    setDemoError(current => current?.source === "history" ? null : current);
    try { await refresh(); } catch { setDemoError({ source: "history", message: "Wallet history couldn’t load. Please try again." }); }
  }

  async function retryPaypalCapture() {
    if (!paypalRetryOrderId) return;
    const orderId = paypalRetryOrderId;
    setPaypalBusy(true);
    setDemoError(current => current?.source === "paypal-capture" ? null : current);
    setPaypalStatus("Verifying PayPal Sandbox capture…");
    try {
      const response = await fetch("/api/paypal/capture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const capture = await response.json();
      if (!response.ok) throw new Error(userFacingError("paypal-capture", capture.error));
      setPaypalStatus(`PayPal Sandbox funding confirmed: ${capture.amount} ${capture.currency}; capture reference ${capture.captureId}.`);
      setPaypalRetryOrderId(null);
      try { await refresh(); } catch { setDemoError({ source: "history", message: "Funding was confirmed, but wallet history could not be refreshed." }); }
    } catch (reason) {
      const message = userFacingError("paypal-capture", reason);
      setPaypalStatus(message);
      setDemoError({ source: "paypal-capture", message });
    } finally { setPaypalBusy(false); }
  }

  async function startPaypalFunding() {
    setPaypalBusy(true);
    setDemoError(current => current?.source === "paypal-order" ? null : current);
    setPaypalStatus("Creating a PayPal Sandbox funding order…");
    try {
      if (!paypalOrderKey.current) paypalOrderKey.current = crypto.randomUUID();
      const response = await fetch("/api/paypal/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: paypalOrderKey.current }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(userFacingError("paypal-order", result.error));
      if (typeof result.approvalUrl !== "string") throw new Error("PayPal did not provide an approval link.");
      setPaypalStatus("Continue to PayPal Sandbox to approve the real funding transaction.");
      window.location.assign(result.approvalUrl);
    } catch (reason) {
      const message = userFacingError("paypal-order", reason);
      setPaypalStatus(message);
      setDemoError({ source: "paypal-order", message });
      setPaypalBusy(false);
    }
  }

  const buyer = state?.wallets.find(wallet => wallet.role === "buyer");
  const seller = state?.wallets.find(wallet => wallet.role === "seller");
  return <section className="stage wallet-stage" aria-label="Buyer and seller MicroWallet">
    <div id="wallet">
      <p className="stage-label">Step 2 · Buyer MicroWallet</p>
      <h2>Buyer MicroWallet</h2>
      <p>A reusable wallet balance makes small digital purchases quick and simple.</p>
    </div>
    {state === null && !demoError && <p role="status">Loading wallet…</p>}
    <p>Available balance: <strong>{buyer ? money(buyer.balanceMinor, buyer.currency) : "—"}</strong></p>

    <div id="seller" className="seller-state">
      <p className="stage-label">Step 3 · Seller MicroWallet</p>
      <h3>Seller MicroWallet</h3>
      <p>Small purchases accumulate in the seller wallet instead of requiring a separate external payment for every purchase.</p>
      <p>Accumulated balance: <strong>{seller ? money(seller.balanceMinor, seller.currency) : "—"}</strong></p>
      <p>Purchases received: <strong>{state ? state.summary.micro_purchase_count : "—"}</strong></p>
      <p>Seller earnings accumulate in the MicroWallet.</p>
    </div>

    <div className="checkout-stage" id="checkout">
      <p className="stage-label">Step 4 · Merchant checkout</p>
      <h3>Buy a digital service</h3>
      <p>Demo purchase: <strong>0.20 USD</strong></p>
      <button type="button" onClick={pay} disabled={busy || !buyer || !seller}>{busy ? "Processing…" : "Pay with MicroWallet"}</button>{" "}
      <button type="button" onClick={runDemoPurchases} disabled={busy || !buyer || !seller}>{busy ? "Processing…" : "Run 3 demo purchases"}</button>{" "}
      <button type="button" onClick={startPaypalFunding} disabled={paypalBusy}>{paypalBusy ? "Processing…" : "Add funds with PayPal Sandbox"}</button>
      <p>Small purchases use the MicroWallet balance. PayPal Sandbox is used to add funds to the wallet, rather than processing every small purchase separately.</p>
      {paypalStatus && <p role="status">{paypalStatus}</p>}
    </div>

    {state?.summary && <div className="settlement-summary" id="aggregation" aria-label="Aggregation summary">
      <p className="stage-label">Step 5 · Aggregation</p>
      <h3>Many small purchases, fewer external payments</h3>
      <p>MicroWallet purchases: <strong>{state.summary.micro_purchase_count}</strong></p>
      <p>PayPal funding transactions: <strong>{state.summary.real_paypal_payment_count}</strong></p>
      <p>{state.summary.micro_purchase_count > state.summary.real_paypal_payment_count ? "Multiple small purchases have been completed using fewer external funding transactions." : "Run several MicroWallet purchases to see the aggregation effect."}</p>
      <p>Total purchase volume: {state.summary.internal_volume.toFixed(2)} USD</p>
      <p>Average purchase: {state.summary.average_micro_purchase.toFixed(2)} USD</p>
      <p>Seller balance: {state.summary.seller_pending_balance.toFixed(2)} USD</p>
    </div>}

    {demoError && <div className="notice" role="alert">
      <p>{demoError.message}</p>
      {demoError.source === "history" && <button type="button" onClick={retryRefresh} disabled={busy || paypalBusy}>Retry</button>}
      {demoError.source === "purchase" && <button type="button" onClick={pay} disabled={busy}>Retry purchase</button>}
      {demoError.source === "demo-purchases" && <button type="button" onClick={runDemoPurchases} disabled={busy}>Retry remaining purchases</button>}
      {demoError.source === "paypal-order" && <button type="button" onClick={startPaypalFunding} disabled={paypalBusy}>Retry PayPal</button>}
      {demoError.source === "paypal-capture" && <button type="button" onClick={retryPaypalCapture} disabled={paypalBusy}>Retry PayPal verification</button>}{" "}
      <button type="button" onClick={() => setDemoError(null)}>Dismiss</button>
    </div>}
    {receipt && <div className="receipt" role="status">
      <h3>Purchase complete</h3>
      <p>Amount: {money(receipt.amountMinor, receipt.currency)}</p>
      <p>Buyer balance: {money(receipt.buyerBalanceMinor, receipt.currency)}</p>
      <p>Seller balance: {money(receipt.sellerBalanceMinor, receipt.currency)}</p>
      <p>Reference: {receipt.reference}</p>
    </div>}

    <h3>Activity</h3>
    <p>Recent MicroWallet purchases are shown here for the demo.</p>
    {state?.ledger.length ? <ol>{state.ledger.map(entry => <li key={entry.reference}>
      <strong>{entry.productService}</strong> — {money(entry.amountMinor, entry.currency)}; {new Date(entry.createdAt).toLocaleString()}; reference {entry.reference}
    </li>)}</ol> : <p>{state ? "No purchases yet. Complete a MicroWallet checkout to create the first activity record." : "Activity is unavailable until the wallet loads."}</p>}

    <h3>PayPal Sandbox funding</h3>
    {state?.fundings?.length ? <ol>{state.fundings.map(funding => <li key={funding.captureId}>
      <strong>{money(funding.amountMinor, funding.currency)}</strong> added to the wallet via PayPal Sandbox; {new Date(funding.createdAt).toLocaleString()}; reference {funding.captureId}
    </li>)}</ol> : <p>{state ? "No PayPal Sandbox funding has been added yet." : "Funding history is unavailable until the wallet loads."}</p>}
  </section>;
}
