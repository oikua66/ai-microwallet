import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUYER = "00000000-0000-4000-8000-000000000001";
const SELLER = "00000000-0000-4000-8000-000000000002";

async function rpc(name: string, body: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("MicroWallet storage is not configured.");
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof result?.message === "string" ? result.message : "Storage request failed";
    throw new Error(message);
  }
  return result;
}

export async function GET() {
  try {
    return NextResponse.json(await rpc("micro_wallet_demo_state", {}), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "MicroWallet history is unavailable. Check server-side Supabase configuration and migration." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { amountMinor, currency, idempotencyKey } = body;
  if (!Number.isSafeInteger(amountMinor) || (amountMinor as number) <= 0 || currency !== "USD" ||
      typeof idempotencyKey !== "string" || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
    return NextResponse.json({ error: "Enter a positive whole-cent USD amount and a valid request key." }, { status: 400 });
  }
  try {
    const result = await rpc("settle_micro_purchase", {
      p_buyer_wallet_id: BUYER,
      p_seller_wallet_id: SELLER,
      p_amount_minor: amountMinor,
      p_currency: currency,
      p_idempotency_key: idempotencyKey,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const known = ["Insufficient balance", "Unknown wallet", "Unsupported currency", "Wallet currency mismatch",
      "Invalid wallet roles", "Buyer and seller must be distinct wallets", "Idempotency key was already used for a different settlement",
      "Amount must be a positive integer minor-unit value", "Balance limit exceeded", "Invalid idempotency key"];
    if (known.some(item => message.includes(item))) {
      return NextResponse.json({ error: known.find(item => message.includes(item)) }, { status: 409 });
    }
    return NextResponse.json({ error: "Settlement could not be completed. No balance or ledger change was committed." }, { status: 503 });
  }
}
