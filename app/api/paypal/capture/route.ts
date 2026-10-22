import { NextResponse } from "next/server";
import { FUNDING_AMOUNT, FUNDING_CURRENCY, orders, paypalRequest } from "@/app/lib/paypal";

export const runtime = "nodejs";

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
        return order.capture;
      }
      if (orderDetails.status !== "APPROVED") throw new Error("PayPal order has not been approved.");

      const result = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: "POST",
        headers: { "PayPal-Request-Id": `capture-${orderId}` },
        body: "{}",
      });
      const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
      if (result.status !== "COMPLETED" || capture?.status !== "COMPLETED" || !capture.id ||
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
      return order.capture;
    })();
    order.capturePromise.catch(() => { order.capturePromise = undefined; });
  }

  try {
    return NextResponse.json(await order.capturePromise);
  } catch {
    return NextResponse.json({ error: "PayPal has not confirmed a completed capture. No successful funding is reported." }, { status: 502 });
  }
}
