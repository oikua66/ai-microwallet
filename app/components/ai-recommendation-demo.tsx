"use client";

import { useState } from "react";

const transactions = [
  { merchant: "Cloud storage", amountMinor: 99, currency: "USD", type: "purchase" },
  { merchant: "Cloud storage", amountMinor: 99, currency: "USD", type: "purchase" },
  { merchant: "Cloud storage", amountMinor: 99, currency: "USD", type: "purchase" },
  { merchant: "Seller earnings", amountMinor: 500, currency: "USD", type: "earning" },
] as const;

type Result = {
  recommendAggregation: boolean;
  reason: string;
  recommendedAmountMinor: number;
  confidence: number;
  strength: string;
  evidence: {
    transactionCount: number;
    totalSpendMinor: number;
    totalEarningsMinor: number;
    repeatedMerchants: Array<{ merchant: string; transactionCount: number; totalSpendMinor: number }>;
    frictionRationale: string;
  };
  adviceOnly: true;
};
const money = (minor: number) => `${(minor / 100).toFixed(2)} USD`;

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

  return <section aria-label="AI aggregation advice">
    <h3>AI aggregation advice — recommendation only</h3>
    <p>Sample transaction history (USD):</p>
    <ul>{transactions.map((item, index) => <li key={index}>{item.type}: {item.merchant} — {money(item.amountMinor)}</li>)}</ul>
    <button type="button" onClick={analyze} disabled={busy}>{busy ? "Analyzing…" : "Analyze with AI"}</button>
    <p>This is advice only. It does not change balances, write a ledger entry, or initiate a payment.</p>
    {error && <p className="notice" role="alert">{error}</p>}
    {result && <div className="receipt" role="status">
      <h4>{result.recommendAggregation ? "Aggregation may make sense" : "Aggregation is not recommended"}</h4>
      <p>{result.reason}</p>
      <p>Suggested aggregation amount: {money(result.recommendedAmountMinor)} (suggestion only)</p>
      <p>Confidence: {result.strength} ({Math.round(result.confidence * 100)}%)</p>
      <p>Evidence: {result.evidence.transactionCount} transactions; {money(result.evidence.totalSpendMinor)} purchase spend; {money(result.evidence.totalEarningsMinor)} seller earnings.</p>
      {result.evidence.repeatedMerchants.map(item => <p key={item.merchant}>Repeated merchant: {item.merchant}, {item.transactionCount} purchases, {money(item.totalSpendMinor)} total.</p>)}
      <p>{result.evidence.frictionRationale}</p>
      <strong>Advice only — no payment was executed.</strong>
    </div>}
  </section>;
}
