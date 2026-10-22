export const FUNDING_AMOUNT = "5.00";
export const FUNDING_CURRENCY = "USD";

export type FundingOrder = {
  orderId: string;
  capture?: { captureId: string; amount: string; currency: string; status: string };
  capturePromise?: Promise<FundingOrder["capture"]>;
};

export const createRequests = new Map<string, Promise<{ orderId: string; approvalUrl: string }>>();
export const orders = new Map<string, FundingOrder>();

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

export async function paypalRequest(path: string, init: RequestInit = {}) {
  if (process.env.PAYPAL_ENV !== "sandbox" || !process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal Sandbox is not configured.");
  }

  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error("PayPal Sandbox authentication failed.");
  const token = (await tokenResponse.json()).access_token as string | undefined;
  if (!token) throw new Error("PayPal Sandbox authentication failed.");

  const response = await fetch(`${PAYPAL_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const payload = await response.json();
  if (!response.ok) throw new Error("PayPal Sandbox request failed.");
  return payload as Record<string, any>;
}
