# AI MicroWallet

AI MicroWallet is a PayPal AI Hackathon 2026 prototype that demonstrates how repeated low-value digital purchases can be handled through a reusable MicroWallet balance while PayPal Sandbox is used for external wallet funding.

**AI identifies suitable payment patterns. Application code controls wallet balances and purchases. PayPal Sandbox demonstrates the external funding step.**

Live demo: https://ai-microwallet.vercel.app/

## What the demo shows

The current public demo includes:

- an OpenAI-backed opportunity scan that evaluates a sample low-value purchase pattern;
- a reusable buyer MicroWallet balance;
- a seller MicroWallet that accumulates proceeds from small purchases;
- deterministic internal purchase settlement;
- PayPal Sandbox wallet funding with server-side order creation and capture verification;
- an aggregation view comparing MicroWallet purchases with PayPal funding transactions;
- an activity history with purchase references;
- Privacy Policy and Terms & Demo Disclaimer pages.

The judge-facing flow has been manually verified in production, including:

1. OpenAI recommendation;
2. three MicroWallet purchases;
3. seller balance accumulation;
4. PayPal Sandbox approval and capture;
5. buyer wallet funding;
6. aggregation showing multiple MicroWallet purchases behind fewer external funding transactions.

The public Vercel deployment has also been verified without authentication in an incognito browser session.

## Core idea

Very small purchases can be inefficient if every purchase requires its own external payment flow.

AI MicroWallet separates three responsibilities:

```text
Sample purchase pattern
        |
        v
OpenAI opportunity analysis
        |
        | recommendation only
        v
Buyer MicroWallet ---> small purchase ---> Seller MicroWallet
        ^
        |
PayPal Sandbox funding
```

### Responsibility boundary

- **AI identifies opportunities.** The model analyzes the sample purchase pattern and recommends whether MicroWallet aggregation is a good fit.
- **Application code controls balances.** Purchases, buyer debits, seller credits, references and aggregation metrics are handled by deterministic application logic.
- **PayPal Sandbox demonstrates funding.** PayPal Sandbox is used to add test funds to the buyer wallet. It is not invoked for every individual MicroWallet purchase.

AI does not authorize payments or directly mutate wallet balances.

## Demo journey

The public interface is organized into five steps:

1. **AI opportunity** — analyze a sample low-value purchase pattern.
2. **Buyer wallet** — show the reusable buyer balance.
3. **Seller wallet** — show accumulated seller balance and purchase count.
4. **Merchant checkout** — complete one or three demo purchases, or add wallet funds through PayPal Sandbox.
5. **Aggregation** — compare MicroWallet purchase count with PayPal funding transaction count.

A typical demonstration is:

- start with the buyer demo balance;
- run three purchases at `0.20 USD` each;
- observe the buyer balance decrease and seller balance increase;
- add `5.00 USD` using PayPal Sandbox;
- return to the application and show the verified funding reference;
- show that several MicroWallet purchases can be supported by fewer external funding transactions.

## Demo status and limitations

AI MicroWallet is a public hackathon prototype.

It is **not**:

- a bank;
- an electronic money institution;
- a payment institution;
- a money transmitter;
- a custodial real-money wallet;
- a replacement for PayPal.

PayPal functionality uses **PayPal Sandbox only**. Sandbox balances, approvals, captures and transaction references are test data and do not represent real customer funds.

Buyer and seller wallet balances shown in the application are demonstration state.

External seller payout is not implemented or claimed.

## Stack

- Next.js
- TypeScript
- Node.js
- Vercel
- OpenAI API
- PayPal Developer Sandbox
- Supabase / PostgreSQL support
- server-side demo-state fallback for the public hackathon walkthrough

## OpenAI integration

The AI opportunity scan calls the OpenAI Responses API from the server.

The production path has been verified successfully with the deployed `OPENAI_API_KEY`.

The model recommendation is advisory only. It cannot move money or modify wallet balances.

## PayPal Sandbox integration

The PayPal flow includes:

1. server-side order creation;
2. buyer approval in PayPal Sandbox;
3. return to AI MicroWallet;
4. server-side capture verification;
5. recording the verified funding reference;
6. updating the demo buyer wallet balance.

The production Sandbox flow has been manually verified end to end.

## Local development

Requirements:

- Node.js 20.9 or newer
- npm

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Health endpoint:

```text
GET /api/health
```

## Environment variables

`.env.example` contains blank placeholders only.

The application may use:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV=sandbox`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Secrets must remain server-side and must not be committed to the repository or shown in screenshots/video.

## Legal

Public legal pages:

- https://ai-microwallet.vercel.app/privacy
- https://ai-microwallet.vercel.app/terms

The demo explicitly states that it is a hackathon prototype, not a real-money financial service, and that PayPal functionality uses Sandbox only.

The Terms page also records that ownership of the original AI MicroWallet intellectual property remains with its developer, subject to the repository's open-source license and the rights granted under the PayPal AI Hackathon Official Rules.

## Submission materials

- [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md)
- [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md)

Remaining submission work is tracked in `SUBMISSION_CHECKLIST.md`.

## License

MIT
