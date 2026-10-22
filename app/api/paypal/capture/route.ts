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

  const order = orders.get(orderId);
  if (!order) return NextResponse.json({ error: "This order is unavailable or has already expired. Start again." }, { status: 409 });
  if (order.capture) return NextResponse.json(order.capture);
  if (!order.capturePromise) {
    order.capturePromise = (async () => {
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
