import { NextResponse } from "next/server";
import { BUYER_ID, SELLER_ID, readFallbackState, settleFallback, writeFallbackState } from "@/app/lib/demo-wallet-fallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: Request) {
  try {
    const state = await rpc("micro_wallet_demo_state", {});
    if (state && typeof state === "object" && Array.isArray(state.ledger)) {
      const ledger = state.ledger.map((entry: Record<string, unknown>) => ({
        productService: "Demo digital service",
        ...entry,
        buyerWalletId: BUYER_ID,
        sellerWalletId: SELLER_ID,
      }));
      return NextResponse.json({ ...state, ledger }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch {
    const state = readFallbackState(request);
    const response = NextResponse.json(state, { headers: { "Cache-Control": "no-store", "X-MicroWallet-Storage": "browser-fallback" } });
    writeFallbackState(response, state);
    return response;
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
      p_buyer_wallet_id: BUYER_ID,
      p_seller_wallet_id: SELLER_ID,
      p_amount_minor: amountMinor,
      p_currency: currency,
      p_idempotency_key: idempotencyKey,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const businessErrors = ["Insufficient balance", "Unsupported currency", "Idempotency key was already used for a different settlement",
      "Amount must be a positive integer minor-unit value", "Balance limit exceeded", "Invalid idempotency key"];
    if (businessErrors.some(item => message.includes(item))) {
      return NextResponse.json({ error: businessErrors.find(item => message.includes(item)) }, { status: 409 });
    }
  }

  try {
    const current = readFallbackState(request);
    const { state, receipt } = settleFallback(current, amountMinor as number, idempotencyKey as string);
    const response = NextResponse.json(receipt, { headers: { "Cache-Control": "no-store", "X-MicroWallet-Storage": "browser-fallback" } });
    writeFallbackState(response, state);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Settlement could not be completed.";
    return NextResponse.json({ error: message.includes("Insufficient balance") ? "Insufficient balance" : "Settlement could not be completed. No balance or ledger change was committed." }, { status: message.includes("Insufficient balance") ? 409 : 503 });
  }
}
