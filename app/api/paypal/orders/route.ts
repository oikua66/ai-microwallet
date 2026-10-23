import { NextRequest, NextResponse } from "next/server";
import { createRequests, FUNDING_AMOUNT, FUNDING_CURRENCY, orders, paypalRequest } from "@/app/lib/paypal";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let idempotencyKey: string;
  try {
    const body = await request.json();
    idempotencyKey = body.idempotencyKey;
    if (typeof idempotencyKey !== "string" || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
      return NextResponse.json({ error: "A valid request key is required." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let operation = createRequests.get(idempotencyKey);
  if (!operation) {
    operation = (async () => {
      const origin = request.nextUrl.origin;
      const result = await paypalRequest("/v2/checkout/orders", {
        method: "POST",
        headers: { "PayPal-Request-Id": idempotencyKey },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{ amount: { currency_code: FUNDING_CURRENCY, value: FUNDING_AMOUNT } }],
          application_context: {
            return_url: `${origin}/?paypal=return`,
            cancel_url: `${origin}/?paypal=cancel`,
          },
        }),
      });
      const approvalUrl = result.links?.find((link: { rel: string }) => link.rel === "approve")?.href;
      if (typeof result.id !== "string" || typeof approvalUrl !== "string") throw new Error("PayPal did not return an approval link.");
      orders.set(result.id, { orderId: result.id });
      return { orderId: result.id, approvalUrl };
    })();
    createRequests.set(idempotencyKey, operation);
    operation.catch(() => createRequests.delete(idempotencyKey));
  }

  try {
    return NextResponse.json(await operation);
  } catch (error) {
    return NextResponse.json({ error: "Could not start PayPal Sandbox funding. Please try again." }, { status: 502 });
  }
}
