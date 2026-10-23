# AI MicroWallet

AI MicroWallet is a PayPal AI Hackathon 2026 project exploring AI-managed micro-wallets for buyers and sellers. The product hypothesis is that many very small commercial events can be represented by fewer real payment transactions: micro-purchases are settled internally, PayPal is used for aggregated real money movement, and AI identifies where aggregation makes sense.

## Status

Hackathon prototype. The supplied implementation includes an OpenAI-backed recommendation API and a PayPal Sandbox flow for a fixed USD 5.00 order, buyer approval, and server-side capture verification. A verified capture is recorded through a Supabase RPC; this does not establish a general-purpose wallet balance, seller payout, or production payment flow. The browser-facing demo path and complete end-to-end setup have not been verified here.

## Intended stack

- Next.js
- TypeScript
- Node.js
- Vercel
- Supabase / PostgreSQL
- OpenAI API
- PayPal Developer Sandbox

## Core model

**AI finds where aggregation makes sense. MicroWallet settles the micro-purchases. PayPal moves the real money.**

This is the product direction, not a claim that every part is implemented. The supplied AI endpoint asks OpenAI to assess transaction history for an optional aggregation recommendation and validates the response; it does not execute financial actions. The supplied PayPal routes create and capture a fixed USD 5.00 Sandbox order and verify its status and amount. Verified funding is sent to a Supabase RPC. The supplied code does not demonstrate internal purchase settlement, seller payouts, or production PayPal payments. This project does not claim banking or EMI status, or that MicroWallet replaces PayPal.

## Local development

Requirements:

- Node.js 20.9 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production build check:

```bash
npm run build
npm start
```

Health endpoint:

```text
GET /api/health
```

Expected response:

```json
{
  "ok": true,
  "service": "ai-microwallet",
  "status": "healthy"
}
```

## Environment setup

Copy `.env.example` to `.env.local` and add credentials locally or through the deployment platform.

```bash
cp .env.example .env.local
```

Never commit real secrets.

For PayPal Sandbox, set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_ENV=sandbox` using Sandbox credentials. The OAuth exchange and Orders API calls run server-side; never expose the client secret in browser code or a `NEXT_PUBLIC_` variable. The order amount is fixed at USD 5.00. Capture recording also requires the configured Supabase endpoint and server-only `SUPABASE_SERVICE_ROLE_KEY` expected by the capture route. The recommendation endpoint requires server-only `OPENAI_API_KEY`. Keep real credentials in `.env.local` or a trusted secret manager, never commit them, and do not put secrets in screenshots or video. The supplied PayPal integration targets Sandbox, not production.

## Architecture

The supplied implementation has these server-side paths:

```text
Next.js API routes
  ├─ /api/ai/recommendation → OpenAI chat completions; validates recommendation output
  ├─ /api/paypal/orders → PayPal Sandbox order creation (fixed USD 5.00)
  └─ /api/paypal/capture → PayPal order/capture verification → Supabase funding-record RPC
```

The PayPal OAuth token exchange and API calls use server-side credentials. The recommendation endpoint validates submitted transaction history and the model response; it does not cause a payment or balance change. The supplied routes do not establish an implemented internal purchase ledger or external seller payout flow.

## Demo flow

### Local API demo

1. Configure the environment above, including a Supabase RPC setup that supports the capture route, then run `npm install` and `npm run dev`.
2. Request a recommendation using synthetic history (the endpoint accepts 1–30 valid USD transactions):

   ```bash
   curl -s http://localhost:3000/api/ai/recommendation \\
     -H 'Content-Type: application/json' \\
     -d '{"transactions":[{"amount":1.50,"currency":"USD"},{"amount":1.25,"currency":"USD"},{"amount":2.00,"currency":"USD"}]}'
   ```

3. Create a Sandbox order and open the returned `approvalUrl` in a browser signed in with a PayPal Sandbox buyer:

   ```bash
   curl -s http://localhost:3000/api/paypal/orders \\
     -H 'Content-Type: application/json' \\
     -d '{"idempotencyKey":"00000000-0000-4000-8000-000000000001"}'
   ```

4. After buyer approval, use the returned `orderId` to request server-side capture and verification:

   ```bash
   curl -s http://localhost:3000/api/paypal/capture \\
     -H 'Content-Type: application/json' \\
     -d '{"orderId":"REPLACE_WITH_RETURNED_ORDER_ID"}'
   ```

This demonstrates an AI recommendation and a separately approved, fixed-value PayPal Sandbox payment. It does not demonstrate that the recommendation initiated the payment, that multiple internal purchases settled, or that a seller received a payout. Label synthetic history and any simulated product or merchant content as demo data. For submission materials and the timed video outline, see [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md) and [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md).

## Scope and verification notes

The supplied files show recommendation and PayPal Sandbox API routes, but do not establish completion of the broader H-008 acceptance criteria or verify the public demo path. No banking/EMI status, PayPal replacement, internal micro-purchase settlement, or external seller payout is claimed. Before submission, confirm the complete demo setup, public URL, production build, and assets using the checklist.

## License

MIT
