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
      /(execute|payment completed|pay now|transfer funds|send money|guaranteed savings|\b(?:i|we|microwallet|the system)\s+(?:have\s+)?(?:paid|sent|transferred|initiated|executed)\b|\b(?:payment|transfer|payout)\s+(?:has been|was|is)\s+(?:made|sent|completed|executed)\b|\b(?:save|saves|saving|savings|reduce|reduces|lower|lowers|avoid|avoids)\b.{0,40}\b(?:fee|fees|cost|costs|charge|charges)\b|\b(?:fee|fees|cost|costs|charge|charges)\b.{0,40}\b(?:save|saves|saving|savings|reduced|lowered|avoided)\b)/i.test(result.reason)) {
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

const OPPORTUNITY_TOPUP_MIN_MINOR = 500;
const OPPORTUNITY_TOPUP_MAX_MINOR = 2_000;
const MICRO_PURCHASE_MAX_MINOR = 200;

export function deriveOpportunityEvidence(historyValue: unknown) {
  const history = validateHistory(historyValue);
  const purchases = history.filter(item => item.type === "purchase");
  const matching = purchases.filter(item => item.amountMinor <= MICRO_PURCHASE_MAX_MINOR);
  const matchingSpendMinor = matching.reduce((sum, item) => sum + item.amountMinor, 0);
  return {
    history,
    matchingTransactions: matching.length,
    matchingSpendMinor,
    hasOpportunity: matching.length >= 3,
  };
}

function formatMinorAmount(amountMinor: number) {
  return `${Math.floor(amountMinor / 100)}.${String(amountMinor % 100).padStart(2, "0")}`;
}

export function validateOpportunityRecommendation(historyValue: unknown, output: unknown) {
  const evidence = deriveOpportunityEvidence(historyValue);
  if (!output || typeof output !== "object" || Array.isArray(output)) throw new Error("Invalid opportunity recommendation.");
  const result = output as Record<string, unknown>;
  const keys = ["recommend_microwallet", "matching_transactions", "recommended_topup_minor", "reason"];
  if (Object.keys(result).length !== keys.length || !keys.every(key => key in result) ||
      typeof result.recommend_microwallet !== "boolean" ||
      !Number.isSafeInteger(result.matching_transactions) ||
      !Number.isSafeInteger(result.recommended_topup_minor) ||
      typeof result.reason !== "string" || result.reason.trim().length < 1 || result.reason.length > 240 ||
      /(execute|payment completed|pay now|transfer funds|send money|guaranteed savings|\b(?:i|we|microwallet|the system)\s+(?:have\s+)?(?:paid|sent|transferred|initiated|executed)\b)/i.test(result.reason)) {
    throw new Error("Invalid opportunity recommendation.");
  }
  if (result.matching_transactions !== evidence.matchingTransactions) {
    throw new Error("AI matching count is not grounded in supplied history.");
  }
  const recommend = result.recommend_microwallet as boolean;
  const requestedTopup = result.recommended_topup_minor as number;
  if (recommend !== evidence.hasOpportunity) throw new Error("AI recommendation is not grounded in supplied history.");
  if (!recommend && requestedTopup !== 0) throw new Error("Top-up must be zero when MicroWallet is not recommended.");
  if (recommend && (requestedTopup < OPPORTUNITY_TOPUP_MIN_MINOR || requestedTopup > OPPORTUNITY_TOPUP_MAX_MINOR)) {
    throw new Error("Suggested top-up is outside deterministic bounds.");
  }
  return {
    recommend_microwallet: recommend,
    matching_transactions: evidence.matchingTransactions,
    recommended_topup: recommend ? OPPORTUNITY_TOPUP_MIN_MINOR / 100 : 0,
    recommended_topup_minor: recommend ? OPPORTUNITY_TOPUP_MIN_MINOR : 0,
    reason: evidence.hasOpportunity
      ? `${evidence.matchingTransactions} low-value transactions totaling ${formatMinorAmount(evidence.matchingSpendMinor)} support a MicroWallet opportunity.`
      : `${evidence.matchingTransactions} low-value transactions totaling ${formatMinorAmount(evidence.matchingSpendMinor)}; at least 3 are needed to identify an opportunity.`,
    evidence: {
      matching_spend: evidence.matchingSpendMinor / 100,
      matching_spend_minor: evidence.matchingSpendMinor,
      micro_purchase_limit: MICRO_PURCHASE_MAX_MINOR / 100,
      topup_bounds: recommend ? { min: OPPORTUNITY_TOPUP_MIN_MINOR / 100, max: OPPORTUNITY_TOPUP_MAX_MINOR / 100 } : null,
    },
    advice_only: true as const,
  };
}
