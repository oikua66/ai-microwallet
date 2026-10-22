"use client";

import { useEffect, useRef, useState } from "react";

type Receipt = { captureId: string; amount: string; currency: string; status: string };

export default function FundingTest() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const requestKey = useRef("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paypal") === "cancel") {
      setMessage("Payment cancelled. No successful funding was recorded.");
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
    }).catch(error => setMessage(error instanceof Error ? error.message : "Capture could not be verified."))
      .finally(() => setBusy(false));
  }, []);

  async function startFunding() {
    setBusy(true);
    setMessage("");
    setReceipt(null);
    if (!requestKey.current) requestKey.current = crypto.randomUUID();
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
        <p>Order ID: {new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("token") || "Verified"}</p>
        <p>Capture ID: {receipt.captureId}</p>
        <p>Amount: {receipt.amount} {receipt.currency}</p>
        <p>Status: {receipt.status}</p>
        <p>Future internal MicroWallet transactions are not part of this test.</p>
      </div>}
    </section>
  );
}
