import { NextResponse } from "next/server";

export const BUYER_ID = "00000000-0000-4000-8000-000000000001";
export const SELLER_ID = "00000000-0000-4000-8000-000000000002";
const COOKIE = "mw_demo_v1";

type Wallet = { role: "buyer" | "seller"; currency: "USD"; balanceMinor: number };
export type Funding = { orderId: string; captureId: string; amountMinor: number; currency: "USD"; createdAt: string };
export type LedgerEntry = {
  reference: string;
  idempotencyKey: string;
  productService: string;
  buyerWalletId: string;
  sellerWalletId: string;
  amountMinor: number;
  currency: "USD";
  buyerBalanceAfter: number;
  sellerBalanceAfter: number;
  createdAt: string;
};
export type DemoState = {
  wallets: Wallet[];
  ledger: LedgerEntry[];
  fundings: Funding[];
  summary: {
    micro_purchase_count: number;
    real_paypal_payment_count: number;
    internal_volume: number;
    average_micro_purchase: number;
    seller_pending_balance: number;
  };
};

function seed(): DemoState {
  return summarize({
    wallets: [
      { role: "buyer", currency: "USD", balanceMinor: 500 },
      { role: "seller", currency: "USD", balanceMinor: 0 },
    ],
    ledger: [],
    fundings: [],
    summary: { micro_purchase_count: 0, real_paypal_payment_count: 0, internal_volume: 0, average_micro_purchase: 0, seller_pending_balance: 0 },
  });
}

function summarize(state: DemoState): DemoState {
  const buyer = state.wallets.find(w => w.role === "buyer") ?? { role: "buyer" as const, currency: "USD" as const, balanceMinor: 500 };
  const seller = state.wallets.find(w => w.role === "seller") ?? { role: "seller" as const, currency: "USD" as const, balanceMinor: 0 };
  const volumeMinor = state.ledger.reduce((sum, entry) => sum + entry.amountMinor, 0);
  return {
    ...state,
    wallets: [buyer, seller],
    ledger: state.ledger.slice(0, 12),
    fundings: state.fundings.slice(0, 8),
    summary: {
      micro_purchase_count: state.ledger.length,
      real_paypal_payment_count: state.fundings.length,
      internal_volume: Number((volumeMinor / 100).toFixed(2)),
      average_micro_purchase: state.ledger.length ? Number((volumeMinor / state.ledger.length / 100).toFixed(2)) : 0,
      seller_pending_balance: Number((seller.balanceMinor / 100).toFixed(2)),
    },
  };
}

export function readFallbackState(request: Request): DemoState {
  const raw = request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return seed();
  try {
    const parsed = JSON.parse(Buffer.from(decodeURIComponent(raw), "base64url").toString("utf8")) as DemoState;
    if (!Array.isArray(parsed.wallets) || !Array.isArray(parsed.ledger) || !Array.isArray(parsed.fundings)) return seed();
    return summarize(parsed);
  } catch {
    return seed();
  }
}

export function writeFallbackState(response: NextResponse, state: DemoState) {
  const value = Buffer.from(JSON.stringify(summarize(state)), "utf8").toString("base64url");
  response.cookies.set(COOKIE, value, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 });
}

export function settleFallback(state: DemoState, amountMinor: number, idempotencyKey: string) {
  const prior = state.ledger.find(entry => entry.idempotencyKey === idempotencyKey);
  if (prior) return {
    state,
    receipt: { reference: prior.reference, amountMinor: prior.amountMinor, currency: prior.currency, buyerBalanceMinor: prior.buyerBalanceAfter, sellerBalanceMinor: prior.sellerBalanceAfter, duplicate: true },
  };
  const buyer = state.wallets.find(w => w.role === "buyer")!;
  const seller = state.wallets.find(w => w.role === "seller")!;
  if (buyer.balanceMinor < amountMinor) throw new Error("Insufficient balance");
  buyer.balanceMinor -= amountMinor;
  seller.balanceMinor += amountMinor;
  const reference = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  state.ledger.unshift({ reference, idempotencyKey, productService: "Demo digital service", buyerWalletId: BUYER_ID, sellerWalletId: SELLER_ID, amountMinor, currency: "USD", buyerBalanceAfter: buyer.balanceMinor, sellerBalanceAfter: seller.balanceMinor, createdAt });
  const next = summarize(state);
  return { state: next, receipt: { reference, amountMinor, currency: "USD", buyerBalanceMinor: buyer.balanceMinor, sellerBalanceMinor: seller.balanceMinor, duplicate: false } };
}

export function recordFallbackFunding(state: DemoState, orderId: string, captureId: string) {
  if (state.fundings.some(f => f.orderId === orderId || f.captureId === captureId)) return summarize(state);
  const buyer = state.wallets.find(w => w.role === "buyer")!;
  buyer.balanceMinor += 500;
  state.fundings.unshift({ orderId, captureId, amountMinor: 500, currency: "USD", createdAt: new Date().toISOString() });
  return summarize(state);
}
