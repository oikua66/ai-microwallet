# AI MicroWallet

AI MicroWallet is a PayPal AI Hackathon 2026 prototype for reducing payment friction around very small purchases by combining three separate responsibilities:

**AI finds where aggregation makes sense. MicroWallet settles the micro-purchases. PayPal moves the real money.**

The architecture deliberately keeps those roles separate: AI recommends, deterministic code controls wallet balances and the internal ledger, and PayPal Sandbox handles external funding.

## Verified prototype status

The current product path includes:

- an OpenAI-backed recommendation flow that analyzes synthetic/approved transaction history and returns constrained advice;
- a persistent buyer and seller MicroWallet backed by Supabase/PostgreSQL;
- atomic internal micro-purchase settlement with recorded product/service, wallet references, balances, and timestamps;
- a PayPal Sandbox top-up flow with server-side order creation, approval, capture verification, and recorded funding reference;
- an aggregation view comparing internal micro-purchases (`N`) with real PayPal Sandbox funding transactions (`M`);
- a demo path that can create three internal purchases to make the `N > M` aggregation story visible;
- non-technical browser error handling that does not expose raw API diagnostics.

H-008 passed independent MASTER review on commit `96248fa593421b1ee498b661ce771ca22b51e4c0` after exact-head focused tests, disposable PostgreSQL/SQL verification, a production build, and Vercel verification. That commit is on `main` and has a READY production deployment.

This is still a hackathon prototype. It does **not** claim banking or EMI status, does not replace PayPal, and does not implement an external seller payout rail. PayPal usage is Sandbox, not production payments.

## Stack

- Next.js / TypeScript / Node.js
- Vercel
- Supabase / PostgreSQL
- OpenAI API
- PayPal Developer Sandbox

## Architecture

```text
Synthetic/approved transaction history
        |
        v
OpenAI recommendation API
        |
        | advice only
        v
Buyer MicroWallet ---> internal atomic micro-purchase ---> Seller MicroWallet
        ^                                                  |
        |                                                  v
PayPal Sandbox funding                           aggregation / ledger view
(order -> buyer approval -> capture)
```

### Responsibility boundary

- **AI recommends.** The model identifies repeated low-value-payment opportunities. Its output is validated and cannot move money or mutate balances.
- **Code controls balances.** Internal wallet debits, credits, idempotency, ledger records, and aggregation state are deterministic application/database logic.
- **PayPal moves money.** The prototype uses PayPal Sandbox for external buyer funding. A PayPal transaction is not created for every internal micro-purchase.

## Local development

Requirements:

- Node.js 20.9 or newer
- npm

```bash
npm install
cp .env.example .env.local
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

## Environment setup

`.env.example` contains blank placeholders only. Supply real credentials locally or through a trusted deployment secret manager; never commit them.

Server-side configuration used by the prototype includes:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV=sandbox`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The PayPal client secret, OpenAI key, and Supabase service-role key must remain server-side. Do not place them in screenshots, video, browser output, or `NEXT_PUBLIC_` variables.

## Browser demo journey

The intended judge-facing journey is:

1. Run the AI recommendation on synthetic transaction history.
2. Show the buyer MicroWallet balance and persistent wallet state.
3. Use PayPal Sandbox to top up the buyer wallet and show the verified funding reference.
4. Complete one or more internal micro-purchases.
5. Show the seller MicroWallet balance and internal ledger entries.
6. Run three internal purchases and show the aggregation result so the distinction between internal purchases (`N`) and PayPal funding transactions (`M`) is visible.

The recommendation does not automatically execute a financial action. External seller payout is intentionally not claimed.

## Public demo status

Vercel has a READY production deployment for the H-008 PASS commit and the project alias `https://ai-microwallet.vercel.app/` exists. At the time of the H-009 release audit, Vercel Authentication was enabled for deployments except custom domains and no separate custom domain had been confirmed for this project. Therefore unauthenticated judge access must be verified or enabled before the URL is presented as a public demo.

## Submission materials

- [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) — 2:00–2:30 product-video script.
- [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md) — release, security, demo-access, asset, and submission-field checklist.

## Security / release notes

The H-009 tracked-file audit found no committed real PayPal, OpenAI, Supabase, GitHub, private-key, or similar credential material in the reviewed repository state. `.env.example` contains blank placeholders, and application code reads secrets from environment variables. This audit does not authorize publishing deployment secrets and does not replace provider-side secret rotation if a credential is ever exposed.

## License

MIT
