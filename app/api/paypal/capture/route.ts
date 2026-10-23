import { NextResponse } from "next/server";
import { FUNDING_AMOUNT, FUNDING_CURRENCY, orders, paypalRequest } from "@/app/lib/paypal";

export const runtime = "nodejs";

async function recordFunding(orderId: string, captureId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("MicroWallet storage is not configured.");
  const response = await fetch(`${url}/rest/v1/rpc/record_paypal_funding`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_order_id: orderId, p_capture_id: captureId, p_amount_minor: 500, p_currency: FUNDING_CURRENCY }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Verified funding could not be recorded.");
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

  // PayPal's order ID and request idempotency key are authoritative across server instances.
  // Keep this map only as a per-instance cache, not as a prerequisite for capture.
  const order = orders.get(orderId) ?? { orderId };
  orders.set(orderId, order);
  if (order.capture) return NextResponse.json(order.capture);
  if (!order.capturePromise) {
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
        order.capture = {
          orderId,
          captureId: completedCapture.id,
          amount: FUNDING_AMOUNT,
          currency: FUNDING_CURRENCY,
          status: "COMPLETED",
        };
        await recordFunding(orderId, completedCapture.id);
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
      if (result.id !== orderId || result.status !== "COMPLETED" ||
          capture?.status !== "COMPLETED" || !capture.id ||
          capture.amount?.value !== FUNDING_AMOUNT || capture.amount?.currency_code !== FUNDING_CURRENCY) {
        throw new Error("PayPal did not confirm a completed capture.");
      }
      order.capture = {
        orderId,
        captureId: capture.id,
        amount: capture.amount.value,
        currency: capture.amount.currency_code,
        status: capture.status,
      };
      await recordFunding(orderId, capture.id);
      return order.capture;
    })();
    order.capturePromise.catch(() => { order.capturePromise = undefined; order.capture = undefined; });
  }

  try {
    return NextResponse.json(await order.capturePromise);
  } catch {
    return NextResponse.json({ error: "PayPal has not confirmed a completed capture. No successful funding is reported." }, { status: 502 });
  }
}
