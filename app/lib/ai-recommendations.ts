export type Transaction = {
  merchant: string;
  amountMinor: number;
  currency: "USD";
  type: "purchase" | "earning";
};

export type Evidence = {
  transactionCount: number;
  totalSpendMinor: number;
  totalEarningsMinor: number;
  repeatedMerchants: Array<{ merchant: string; transactionCount: number; totalSpendMinor: number }>;
  frictionRationale: string;
};

export function validateHistory(value: unknown): Transaction[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 30) throw new Error("Invalid transaction history.");
  return value.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Invalid transaction.");
    const row = item as Record<string, unknown>;
    if (Object.keys(row).some(key => !["merchant", "amountMinor", "currency", "type"].includes(key)) ||
        typeof row.merchant !== "string" || row.merchant.trim().length < 1 || row.merchant.length > 80 ||
        !Number.isSafeInteger(row.amountMinor) || (row.amountMinor as number) <= 0 || (row.amountMinor as number) > 100_000_000 ||
        row.currency !== "USD" || (row.type !== "purchase" && row.type !== "earning")) {
      throw new Error("Invalid transaction.");
    }
    return { merchant: row.merchant.trim(), amountMinor: row.amountMinor as number, currency: "USD", type: row.type };
  });
}

export function deriveEvidence(history: Transaction[]): Evidence {
  const purchases = history.filter(item => item.type === "purchase");
  const totals = new Map<string, { transactionCount: number; totalSpendMinor: number }>();
  for (const item of purchases) {
    const current = totals.get(item.merchant) ?? { transactionCount: 0, totalSpendMinor: 0 };
    current.transactionCount += 1;
    current.totalSpendMinor += item.amountMinor;
    totals.set(item.merchant, current);
  }
  const repeatedMerchants = [...totals.entries()]
    .filter(([, value]) => value.transactionCount >= 2)
    .map(([merchant, value]) => ({ merchant, ...value }));
  return {
    transactionCount: history.length,
    totalSpendMinor: purchases.reduce((sum, item) => sum + item.amountMinor, 0),
    totalEarningsMinor: history.filter(item => item.type === "earning").reduce((sum, item) => sum + item.amountMinor, 0),
    repeatedMerchants,
    frictionRationale: repeatedMerchants.length
      ? "Repeated purchases may add checkout friction; no fee savings are assumed."
      : "No repeated merchant pattern was found in this history.",
  };
}

export function validateRecommendation(historyValue: unknown, output: unknown) {
  const history = validateHistory(historyValue);
  if (!output || typeof output !== "object" || Array.isArray(output)) throw new Error("Invalid recommendation.");
  const result = output as Record<string, unknown>;
  if (Object.keys(result).length !== 4 || !["recommendAggregation", "reason", "recommendedAmountMinor", "confidence"].every(key => key in result) ||
      typeof result.recommendAggregation !== "boolean" || typeof result.reason !== "string" || result.reason.trim().length < 1 || result.reason.length > 240 ||
      !Number.isSafeInteger(result.recommendedAmountMinor) || (result.recommendedAmountMinor as number) < 0 ||
      typeof result.confidence !== "number" || !Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 1 ||
      /(execute|payment completed|pay now|transfer funds|send money|guaranteed savings)/i.test(result.reason)) {
    throw new Error("Invalid recommendation.");
  }
  const evidence = deriveEvidence(history);
  const repeatedSpend = evidence.repeatedMerchants.reduce((sum, item) => sum + item.totalSpendMinor, 0);
  const amount = result.recommendedAmountMinor as number;
  if ((result.recommendAggregation && (!evidence.repeatedMerchants.length || amount < 1 || amount > repeatedSpend)) ||
      (!result.recommendAggregation && amount !== 0)) throw new Error("Recommendation is unsupported by the supplied history.");
  const confidence = result.confidence as number;
  return {
    recommendAggregation: result.recommendAggregation,
    reason: result.reason.trim(),
    recommendedAmountMinor: amount,
    confidence,
    strength: confidence >= 0.75 ? "high" : confidence >= 0.45 ? "moderate" : "low",
    evidence,
    adviceOnly: true as const,
  };
}
