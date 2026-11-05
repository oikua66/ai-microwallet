import { NextResponse } from "next/server";
import { FUNDING_AMOUNT, FUNDING_CURRENCY, orders, paypalRequest } from "@/app/lib/paypal";
import { BUYER_ID } from "@/app/lib/demo-wallet-fallback";

export const runtime = "nodejs";

async function recordFunding(orderId: string, captureId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  try {
    const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const response = await fetch(`${url}/rest/v1/rpc/record_paypal_funding`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_order_id: orderId, p_capture_id: captureId, p_amount_minor: 500, p_currency: FUNDING_CURRENCY }),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const recorded = await response.json();
    if (recorded?.orderId !== orderId || recorded?.captureId !== captureId ||
        recorded?.amountMinor !== 500 || recorded?.currency !== FUNDING_CURRENCY ||
        !Number.isSafeInteger(recorded?.buyerBalanceAfter) || recorded.buyerBalanceAfter < 500 ||
        typeof recorded?.duplicate !== "boolean") return false;

    const stateResponse = await fetch(`${url}/rest/v1/rpc/micro_wallet_demo_state`, {
      method: "POST",
      headers,
      body: "{}",
      cache: "no-store",
    });
    if (!stateResponse.ok) return false;
    const state = await stateResponse.json();
    return Array.isArray(state?.fundings) && state.fundings.some((funding: Record<string, unknown>) =>
      funding.orderId === orderId && funding.captureId === captureId &&
      funding.amountMinor === 500 && funding.currency === FUNDING_CURRENCY &&
      funding.buyerBalanceAfter === recorded.buyerBalanceAfter
    ) && Array.isArray(state?.wallets) && state.wallets.some((wallet: Record<string, unknown>) =>
      wallet.role === "buyer" && Number.isSafeInteger(wallet.balanceMinor) && wallet.balanceMinor >= 0
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let orderId: string;
  try {
    const body = await request.json();
    orderId = body.orderId;
    if (typeof orderId !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(orderId)) {
      return NextResponse.json({ error: "Invalid PayPal order." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const order = orders.get(orderId) ?? { orderId };
  orders.set(orderId, order);
  if (!order.capturePromise && !order.capture) {
    order.capturePromise = (async () => {
      const orderDetails = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
      const purchaseUnits = orderDetails.purchase_units;
      if (orderDetails.id !== orderId || orderDetails.intent !== "CAPTURE" || !Array.isArray(purchaseUnits) ||
          purchaseUnits.length !== 1 || purchaseUnits[0]?.amount?.value !== FUNDING_AMOUNT ||
          purchaseUnits[0]?.amount?.currency_code !== FUNDING_CURRENCY) {
        throw new Error("PayPal order does not match the expected funding amount.");
      }

      if (orderDetails.status === "COMPLETED") {
        const captures = purchaseUnits[0]?.payments?.captures;
        const completedCapture = Array.isArray(captures)
          ? captures.find((item: { id?: string; status?: string; amount?: { value?: string; currency_code?: string } }) =>
              item.status === "COMPLETED" && item.amount?.value === FUNDING_AMOUNT &&
              item.amount?.currency_code === FUNDING_CURRENCY)
          : undefined;
        if (!completedCapture || typeof completedCapture.id !== "string") {
          throw new Error("PayPal did not confirm a completed capture.");
        }
        order.capture = { orderId, captureId: completedCapture.id, amount: FUNDING_AMOUNT, currency: FUNDING_CURRENCY, status: "COMPLETED" };
        return order.capture;
      }
      if (orderDetails.status !== "APPROVED") throw new Error("PayPal order has not been approved.");

      const result = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: "POST",
        headers: { "PayPal-Request-Id": `capture-${orderId}` },
        body: "{}",
      });
      const capturedUnits = result.purchase_units;
      const capture = Array.isArray(capturedUnits) && capturedUnits.length === 1
        ? capturedUnits[0]?.payments?.captures?.[0]
        : undefined;
      if (result.id !== orderId || result.status !== "COMPLETED" || capture?.status !== "COMPLETED" || !capture.id ||
          capture.amount?.value !== FUNDING_AMOUNT || capture.amount?.currency_code !== FUNDING_CURRENCY) {
        throw new Error("PayPal did not confirm a completed capture.");
      }
      order.capture = { orderId, captureId: capture.id, amount: capture.amount.value, currency: capture.amount.currency_code, status: capture.status };
      return order.capture;
    })();
    order.capturePromise.catch(() => { order.capturePromise = undefined; });
  }

  try {
    const capture = order.capture ?? await order.capturePromise;
    if (!capture) throw new Error("Missing capture");
    if (!(await recordFunding(capture.orderId, capture.captureId))) {
      return NextResponse.json({
        status: "CAPTURED_CREDIT_PENDING",
        orderId: capture.orderId,
        captureId: capture.captureId,
        amount: capture.amount,
        currency: capture.currency,
        message: "PayPal capture completed; wallet credit is not yet verified. Retry this request to reconcile."
      }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(capture, { headers: { "Cache-Control": "no-store" } });
  } catch {
    if (order.capture) {
      return NextResponse.json({
        status: "CAPTURED_CREDIT_PENDING",
        orderId: order.capture.orderId,
        captureId: order.capture.captureId,
        amount: order.capture.amount,
        currency: order.capture.currency,
        message: "PayPal capture completed; wallet credit is not yet verified. Retry this request to reconcile."
      }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: "PayPal has not confirmed a completed capture. No successful funding is reported." }, { status: 502 });
  }
}
