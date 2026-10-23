import { deepStrictEqual, equal, throws } from "node:assert/strict";
import { test } from "node:test";
import { validateOpportunityRecommendation, validateRecommendation } from "./ai-recommendations";

const history = [
  { merchant: "Cafe", amountMinor: 200, currency: "USD", type: "purchase" },
  { merchant: "Cafe", amountMinor: 300, currency: "USD", type: "purchase" },
  { merchant: "Seller", amountMinor: 500, currency: "USD", type: "earning" },
];

const opportunityHistory = [
  { merchant: "Digital service A", amountMinor: 35, currency: "USD", type: "purchase" },
  { merchant: "Digital service B", amountMinor: 20, currency: "USD", type: "purchase" },
  { merchant: "Translation", amountMinor: 45, currency: "USD", type: "purchase" },
  { merchant: "API call", amountMinor: 30, currency: "USD", type: "purchase" },
  { merchant: "Content", amountMinor: 15, currency: "USD", type: "purchase" },
];

test("H-004 valid advice is returned with evidence derived from history", () => {
  const result = validateRecommendation(history, {
    recommendAggregation: true, reason: "Repeated small purchases could be grouped.", recommendedAmountMinor: 500, confidence: 0.8,
  });
  deepStrictEqual(result.evidence.repeatedMerchants, [{ merchant: "Cafe", transactionCount: 2, totalSpendMinor: 500 }]);
  deepStrictEqual(result.adviceOnly, true);
});

test("H-004 malformed and unsafe output fails closed", () => {
  throws(() => validateRecommendation(history, { recommendAggregation: "yes" }));
  throws(() => validateRecommendation(history, {
    recommendAggregation: true, reason: "Payment completed successfully.", recommendedAmountMinor: 500, confidence: 0.9,
  }));
  throws(() => validateRecommendation(history, {
    recommendAggregation: true, reason: "This will save $5 in fees.", recommendedAmountMinor: 500, confidence: 0.9,
  }));
});

test("H-005 canonical opportunity is grounded and exposes bounded top-up", () => {
  const result = validateOpportunityRecommendation(opportunityHistory, {
    recommend_microwallet: true,
    matching_transactions: 5,
    recommended_topup_minor: 500,
    reason: "Repeated low-value payments detected.",
  });
  equal(result.recommend_microwallet, true);
  equal(result.matching_transactions, 5);
  equal(result.recommended_topup, 5);
  deepStrictEqual(result.evidence.topup_bounds, { min: 5, max: 20 });
  equal(result.advice_only, true);
});

test("H-005 unsupported AI claims are never returned as explanations", () => {
  const result = validateOpportunityRecommendation(opportunityHistory, {
    recommend_microwallet: true,
    matching_transactions: 5,
    recommended_topup_minor: 500,
    reason: "Your account has $1,000 available and the provider approved a transfer.",
  });
  equal(result.reason, "5 low-value transactions totaling $1.45 support a MicroWallet opportunity.");
});

test("H-005 malformed, ungrounded, and out-of-bounds AI output fails closed", () => {
  throws(() => validateOpportunityRecommendation(opportunityHistory, {
    recommend_microwallet: "yes",
    matching_transactions: 5,
    recommended_topup_minor: 500,
    reason: "Repeated low-value payments detected.",
  }));
  throws(() => validateOpportunityRecommendation(opportunityHistory, {
    recommend_microwallet: true,
    matching_transactions: 4,
    recommended_topup_minor: 500,
    reason: "Repeated low-value payments detected.",
  }));
  throws(() => validateOpportunityRecommendation(opportunityHistory, {
    recommend_microwallet: true,
    matching_transactions: 5,
    recommended_topup_minor: 5000,
    reason: "Repeated low-value payments detected.",
  }));
});

test("H-005 cannot recommend an opportunity when transaction evidence is insufficient", () => {
  const insufficient = opportunityHistory.slice(0, 2);
  throws(() => validateOpportunityRecommendation(insufficient, {
    recommend_microwallet: true,
    matching_transactions: 2,
    recommended_topup_minor: 500,
    reason: "Use MicroWallet.",
  }));
  const result = validateOpportunityRecommendation(insufficient, {
    recommend_microwallet: false,
    matching_transactions: 2,
    recommended_topup_minor: 0,
    reason: "Not enough repeated low-value activity yet.",
  });
  equal(result.recommended_topup, 0);
});
