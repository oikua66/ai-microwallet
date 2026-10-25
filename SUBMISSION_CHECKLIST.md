# PayPal AI Hackathon 2026 — Submission Checklist

## FINAL STATUS: SUBMITTED

Submitted to Devpost on **2026-10-25**.

The public demo, repository, license, screenshots, product video, YouTube access, Devpost fields, and submission flow were completed and verified before submission.

## 1. Repository and licensing
- [x] Public repository: `https://github.com/oikua66/ai-microwallet`.
- [x] `LICENSE` file exists in the repository root.
- [x] Repository license is MIT.
- [x] GitHub recognizes the repository license as MIT (`license.key = mit`, SPDX `MIT`).
- [x] `.env.example` contains placeholders only; secrets are read from environment variables.
- [x] README and submission documentation are present.

## 2. Public working demo
- [x] Production URL: `https://ai-microwallet.vercel.app/`.
- [x] Unauthenticated access verified in an incognito browser.
- [x] Production Next.js build passes.
- [x] Main demo page loads successfully.
- [x] `/privacy` loads successfully.
- [x] `/terms` loads successfully.

## 3. OpenAI integration
- [x] OpenAI production path verified with the deployed API key.
- [x] AI opportunity analysis works from the public demo.
- [x] AI output is advisory only and cannot directly mutate wallet balances.
- [x] Temporary AI health probe removed from the current repository state.

## 4. MicroWallet purchase flow
- [x] Buyer demo wallet loads.
- [x] Seller demo wallet loads.
- [x] Single MicroWallet purchase works.
- [x] Three-purchase demo works.
- [x] Buyer balance decreases correctly.
- [x] Seller balance increases correctly.
- [x] Purchase activity records are displayed.
- [x] Aggregation metrics update correctly.

## 5. PayPal Sandbox
- [x] PayPal Sandbox order creation works.
- [x] Buyer Sandbox approval works.
- [x] Return to AI MicroWallet works.
- [x] Server-side capture verification works.
- [x] Verified funding reference is displayed.
- [x] Buyer wallet balance increases after Sandbox funding.
- [x] PayPal return query parameters are cleaned from the URL.
- [x] End-to-end proof observed: multiple MicroWallet purchases with fewer PayPal funding transactions.

## 6. Public legal and product positioning
- [x] Footer identifies the site as a hackathon demo.
- [x] Footer states `No real-money service`.
- [x] Footer states `PayPal Sandbox only`.
- [x] Privacy Policy published.
- [x] Terms & Demo Disclaimer published.
- [x] Terms clarify that the demo is not a bank, EMI, payment institution, money transmitter, or custodial wallet.
- [x] Terms clarify that PayPal activity is Sandbox test activity.
- [x] Intellectual Property section added.
- [x] Original project ownership is described subject to the repository license and Hackathon Official Rules.

## 7. Judge-facing UX
- [x] Step 1 — AI opportunity scan uses judge-friendly wording.
- [x] Step 2 — Buyer wallet is presented separately.
- [x] Step 3 — Seller wallet is presented separately.
- [x] Step 4 — Merchant checkout wording is simplified.
- [x] Step 5 — Aggregation wording is simplified.
- [x] Internal engineering IDs are removed from normal wallet UI where unnecessary.
- [x] Hero/navigation wording is simplified.
- [x] PayPal Sandbox is presented as wallet funding rather than one external payment per micro-purchase.
- [x] Production model is explicitly separated from the Sandbox demo.
- [x] Production model explains one-time device authorization, configurable spending limits, automatic micro-purchases inside those limits, and step-up re-authentication only for exceptions.

## 8. Screenshots
- [x] Final Devpost gallery prepared in 3:2 format.
- [x] Hero / Step 1 screenshot.
- [x] Buyer + seller wallet screenshot.
- [x] Merchant checkout screenshot.
- [x] Aggregation screenshot.
- [x] Activity + PayPal Sandbox funding screenshot.
- [x] Screenshots reviewed for accidental secrets and irrelevant browser UI.
- [x] Final images uploaded to Devpost.

## 9. Product video
- [x] Voiceover script prepared and recorded with NOVALEX Voice.
- [x] Video rebuilt with static frames and no zoom/pan camera movement.
- [x] Final end card added.
- [x] Final runtime verified below 3 minutes (approximately 2:56).
- [x] Video includes the problem, product idea, AI role, buyer/seller wallets, small purchases, aggregation, PayPal Sandbox funding, production model, and final summary.
- [x] Video uploaded to YouTube.
- [x] YouTube visibility set to unlisted / access by link.
- [x] Anonymous access to the YouTube video verified.
- [x] YouTube demo attached to the Devpost submission.

## 10. Devpost submission fields
- [x] Project title: `AI MicroWallet`.
- [x] Short product description completed.
- [x] Full Inspiration / What it does / How we built it / Challenges / Accomplishments / What we learned / What's next description completed.
- [x] OpenAI usage explained accurately.
- [x] PayPal Sandbox usage explained accurately.
- [x] Intended production authorization model explained without claiming it is implemented in the hackathon prototype.
- [x] Public GitHub repository URL supplied.
- [x] Public live demo URL supplied.
- [x] YouTube demo supplied.
- [x] Final screenshots uploaded.
- [x] Technology stack supplied.
- [x] AI tools used during development disclosed: ChatGPT, OpenAI API, and the project's own AI project orchestrator workflow.
- [x] PayPal integration feedback completed.
- [x] Learning / AI-career-value questions completed.
- [x] Submitter information and required declarations completed.

## 11. Final verification and submission
- [x] Public demo verified without authentication.
- [x] AI opportunity analysis verified.
- [x] Buyer and seller MicroWallet behavior verified.
- [x] Three-purchase aggregation scenario verified.
- [x] PayPal Sandbox funding flow verified.
- [x] Activity and funding references verified.
- [x] Production model clearly labeled as intended future production flow.
- [x] Privacy Policy and Terms published.
- [x] Repository public.
- [x] MIT license recognized by GitHub.
- [x] YouTube demo accessible anonymously.
- [x] Devpost accepted the final submission.

## Submission record

- Project: **AI MicroWallet**
- Hackathon: **PayPal AI Hackathon 2026**
- Submission platform: **Devpost**
- Submission date: **2026-10-25**
- Live demo: `https://ai-microwallet.vercel.app/`
- Source: `https://github.com/oikua66/ai-microwallet`
- Status: **SUBMITTED — awaiting judging/results**
