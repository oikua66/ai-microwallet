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
  source?: "openai" | "deterministic_fallback";
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

  return <section className="stage advice-stage" id="opportunity" aria-label="AI MicroWallet opportunity">
    <p className="stage-label">Step 1 · AI opportunity scan</p>
    <h2>Spot the low-value payment pattern</h2>
    <p>Five small digital purchases total 1.45 USD. Ask AI whether this pattern is a good fit for a MicroWallet.</p>
    <details><summary>Show the sample transaction history</summary>
    <ul>{transactions.map((item, index) => <li key={index}>{item.merchant} — {minorMoney(item.amountMinor)}</li>)}</ul>
    </details>
    <button type="button" className="action-button" onClick={analyze} disabled={busy}>{busy ? "Analyzing…" : "Analyze payment pattern"}</button>
    {error && <p className="notice" role="alert">{error}</p>}
    {result && <div className="receipt" role="status">
      <h4>{result.recommend_microwallet ? "MicroWallet is a good fit" : "MicroWallet is not needed for this pattern"}</h4>
      <p>{result.reason}</p>
      <p><strong>{result.matching_transactions} low-value purchases</strong> were detected, totaling <strong>{money(result.evidence.matching_spend)}</strong>.</p>
      {result.recommend_microwallet && <p>A prefunded wallet can let these small purchases settle internally instead of creating a separate external payment for each one.</p>}
      {result.source === "deterministic_fallback" && <p className="fallback-note">AI analysis is temporarily unavailable. A rule-based continuity result is shown instead.</p>}
      <p><strong>No money moved in this step.</strong> This is an analysis only.</p>
    </div>}
  </section>;
}
