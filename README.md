# AI MicroWallet

AI MicroWallet is a PayPal AI Hackathon 2026 project exploring AI-managed micro-wallets for buyers and sellers. The product hypothesis is that many very small commercial events can be represented by fewer real payment transactions: micro-purchases are settled internally, PayPal is used for aggregated real money movement, and AI identifies where aggregation makes sense.

## Status

Hackathon MVP under active development. The current repository state is the H-001 application scaffold only.

## Intended stack

- Next.js
- TypeScript
- Node.js
- Vercel
- Supabase / PostgreSQL
- OpenAI API
- PayPal Developer Sandbox

## Core model

- **Micro-purchases are settled internally.**
- **PayPal is used for aggregated real money movement.**
- **AI identifies where aggregation makes sense.**

The hackathon prototype will use application-level buyer and seller MicroWallet balances backed by an auditable ledger. It does not claim to be a bank, EMI, licensed wallet provider, or replacement for PayPal.

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

The project is designed to use **PayPal Sandbox** during the hackathon. Production PayPal money movement is explicitly outside the MVP scope.

## Architecture

Planned MVP layers:

```text
Browser
  ↓
Next.js application / API
  ├─ PayPal adapter
  ├─ AI recommendation engine
  ├─ deterministic wallet controls
  └─ ledger / aggregation logic
  ↓
Supabase / PostgreSQL
```

Detailed implementation begins only after the H-001 scaffold and the H-003 PayPal Sandbox funding vertical slice pass MASTER review.

## Demo flow

Target demo story:

```text
AI detects repeated low-value payment pattern
  ↓
AI recommends MicroWallet
  ↓
Buyer funds MicroWallet through PayPal Sandbox
  ↓
Multiple internal micro-purchases
  ↓
Seller MicroWallet accumulates proceeds
  ↓
Ledger demonstrates aggregation
```

Deterministic demo digital services, merchants, products or transaction histories may be used where appropriate. They must be clearly identified as demo/simulated data and must never be presented as real external merchants or real PayPal payments unless the corresponding PayPal transaction actually occurred.

## H-001 scope

This scaffold intentionally does **not** implement:

- PayPal API calls
- OpenAI API calls
- Supabase schema
- wallet balance logic
- authentication
- user accounts
- subscriptions
- production payments
- marketplace onboarding

## License

MIT
