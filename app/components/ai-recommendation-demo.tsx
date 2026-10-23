"use client";

import { useState } from "react";

const transactions = [
  { merchant: "Digital service A", amountMinor: 35, currency: "USD", type: "purchase" },
  { merchant: "Digital service B", amountMinor: 20, currency: "USD", type: "purchase" },
  { merchant: "Translation", amountMinor: 45, currency: "USD", type: "purchase" },
  { merchant: "API call", amountMinor: 30, currency: "USD", type: "purchase" },
  { merchant: "Content", amountMinor: 15, currency: "USD", type: "purchase" },
] as const;

type Result = {
  recommend_microwallet: boolean;
  matching_transactions: number;
  recommended_topup: number;
  recommended_topup_minor: number;
  reason: string;
  evidence: {
    matching_spend: number;
    matching_spend_minor: number;
    micro_purchase_limit: number;
    topup_bounds: { min: number; max: number } | null;
  };
  advice_only: true;
};

const money = (amount: number) => `${amount.toFixed(2)} USD`;
const minorMoney = (minor: number) => money(minor / 100);

export default function AIRecommendationDemo() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function analyze() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/ai/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Analysis could not be completed.");
      setResult(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Analysis could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return <section aria-label="AI MicroWallet opportunity">
    <h3>AI MicroWallet opportunity — recommendation only</h3>
    <p>Canonical demo history:</p>
    <ul>{transactions.map((item, index) => <li key={index}>{item.merchant} — {minorMoney(item.amountMinor)}</li>)}</ul>
    <button type="button" onClick={analyze} disabled={busy}>{busy ? "Analyzing…" : "Analyze with AI"}</button>
    <p>AI can recommend only. Deterministic code validates counts and top-up bounds. No balance or PayPal action is performed here.</p>
    {error && <p className="notice" role="alert">{error}</p>}
    {result && <div className="receipt" role="status">
      <h4>{result.recommend_microwallet ? "MicroWallet opportunity detected" : "No MicroWallet opportunity detected"}</h4>
      <p>{result.reason}</p>
      <p>Matching low-value transactions: {result.matching_transactions}</p>
      <p>Matching spend: {money(result.evidence.matching_spend)}</p>
      <p>Recommended top-up: {money(result.recommended_topup)} (suggestion only)</p>
      {result.evidence.topup_bounds && <p>Deterministic allowed range: {money(result.evidence.topup_bounds.min)}–{money(result.evidence.topup_bounds.max)}</p>}
      <strong>Advice only — no payment, top-up, transfer, ledger entry, or balance change was executed.</strong>
    </div>}
  </section>;
}
