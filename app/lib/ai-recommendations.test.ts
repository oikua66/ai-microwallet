import { deepStrictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { validateRecommendation } from "./ai-recommendations";

const history = [
  { merchant: "Cafe", amountMinor: 200, currency: "USD", type: "purchase" },
  { merchant: "Cafe", amountMinor: 300, currency: "USD", type: "purchase" },
  { merchant: "Seller", amountMinor: 500, currency: "USD", type: "earning" },
];

test("valid advice is returned with evidence derived from history", () => {
  const result = validateRecommendation(history, {
    recommendAggregation: true, reason: "Repeated small purchases could be grouped.", recommendedAmountMinor: 500, confidence: 0.8,
  });
  deepStrictEqual(result.evidence.repeatedMerchants, [{ merchant: "Cafe", transactionCount: 2, totalSpendMinor: 500 }]);
  deepStrictEqual(result.adviceOnly, true);
});

test("malformed output fails closed", () => {
  throws(() => validateRecommendation(history, { recommendAggregation: "yes" }));
});

test("unsafe or unsupported recommendations fail closed", () => {
  throws(() => validateRecommendation(history, {
    recommendAggregation: true, reason: "Payment completed successfully.", recommendedAmountMinor: 500, confidence: 0.9,
  }));
  throws(() => validateRecommendation(history, {
    recommendAggregation: true, reason: "This will save $5 in fees.", recommendedAmountMinor: 500, confidence: 0.9,
  }));
  throws(() => validateRecommendation([{ merchant: "Shop", amountMinor: 100, currency: "USD", type: "purchase" }], {
    recommendAggregation: true, reason: "Group this purchase.", recommendedAmountMinor: 100, confidence: 0.9,
  }));
});
