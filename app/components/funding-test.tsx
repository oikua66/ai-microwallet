"use client";

import { useEffect, useRef, useState } from "react";

type Receipt = { orderId: string; captureId: string; amount: string; currency: string; status: string };

const FUNDING_REQUEST_STORAGE_KEY = "paypal-funding-idempotency-key";

function clearStoredRequestKey() {
  try {
    window.sessionStorage.removeItem(FUNDING_REQUEST_STORAGE_KEY);
  } catch {
    // Storage may be unavailable; the server still applies PayPal request idempotency.
  }
}

export default function FundingTest() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const requestKey = useRef("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paypal") === "cancel") {
      setMessage("Payment cancelled. No successful funding was recorded.");
      requestKey.current = "";
      clearStoredRequestKey();
      window.history.replaceState({}, "", "/");
      return;
    }
    if (params.get("paypal") !== "return") return;
    const orderId = params.get("token");
    window.history.replaceState({}, "", "/");
    if (!orderId) {
      setMessage("PayPal did not return an order ID. No successful funding was recorded.");
      return;
    }
    setBusy(true);
    fetch("/api/paypal/capture", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }),
    }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Capture could not be verified.");
      setReceipt(result);
      requestKey.current = "";
      clearStoredRequestKey();
    }).catch(error => setMessage(error instanceof Error ? error.message : "Capture could not be verified."))
      .finally(() => setBusy(false));
  }, []);

  async function startFunding() {
    setBusy(true);
    setMessage("");
    setReceipt(null);
    if (!requestKey.current) {
      try {
        const savedKey = window.sessionStorage.getItem(FUNDING_REQUEST_STORAGE_KEY);
        requestKey.current = savedKey && /^[0-9a-f-]{36}$/i.test(savedKey) ? savedKey : crypto.randomUUID();
        window.sessionStorage.setItem(FUNDING_REQUEST_STORAGE_KEY, requestKey.current);
      } catch {
        requestKey.current = crypto.randomUUID();
      }
    }
    try {
      const response = await fetch("/api/paypal/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: requestKey.current }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create a PayPal Sandbox order.");
      window.location.assign(result.approvalUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start payment.");
      setBusy(false);
    }
  }

  return (
    <section className="funding">
      <h2>PayPal Sandbox funding test</h2>
      <p><strong>Funding amount: $5.00 USD</strong></p>
      <p>This flow creates a real PayPal Sandbox transaction. It does not credit an internal MicroWallet balance.</p>
      <button type="button" onClick={startFunding} disabled={busy || !!receipt}>
        {busy ? "Processing…" : "Add funds with PayPal"}
      </button>
      {busy && new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("paypal") === "return" &&
        <p role="status">Verifying the PayPal capture…</p>}
      {message && <p className="notice" role="alert">{message}</p>}
      {receipt && <div className="receipt" role="status">
        <h3>Sandbox payment completed</h3>
        <p>Real PayPal Sandbox transaction</p>
        <p>Order ID: {receipt.orderId}</p>
        <p>Capture ID: {receipt.captureId}</p>
        <p>Amount: {receipt.amount} {receipt.currency}</p>
        <p>Status: {receipt.status}</p>
        <p>Future internal MicroWallet transactions are not part of this test.</p>
      </div>}
    </section>
  );
}
