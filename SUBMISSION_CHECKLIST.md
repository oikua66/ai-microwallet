# PayPal AI Hackathon 2026 — Submission Checklist

Evidence state as of **2026-10-25**. Only mark an item complete when it has been verified.

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

## 8. Screenshots
- [x] Hero / Step 1 screenshot.
- [x] Buyer wallet screenshot.
- [x] Seller wallet after purchases screenshot.
- [x] Merchant checkout screenshot.
- [x] Aggregation screenshot showing multiple MicroWallet purchases and fewer PayPal funding transactions.
- [x] PayPal Sandbox funding confirmation screenshot.
- [x] Activity / funding reference screenshot.
- [x] Screenshots reviewed for accidental secrets, unwanted query parameters, browser identifiers, and irrelevant UI.
- [x] Final Devpost screenshot set selected: hero; buyer + seller wallets; merchant checkout; aggregation; activity + PayPal Sandbox funding.

## 9. Product video
Current target runtime: approximately **2:20**, with the final video kept below the official maximum.

- [ ] Update `DEMO_SCRIPT.md` to match the current public UX and terminology.
- [ ] Record the final product walkthrough.
- [ ] Show AI opportunity analysis.
- [ ] Show buyer and seller wallet behavior.
- [ ] Show three MicroWallet purchases.
- [ ] Show PayPal Sandbox funding.
- [ ] Show aggregation result.
- [ ] Show live demo URL and repository.
- [ ] Ensure no secrets or real credentials appear.
- [ ] Confirm final runtime is below 3:00.
- [ ] Upload the video publicly to YouTube.
- [ ] Verify that the YouTube link works without authentication.

## 10. Devpost submission fields
- [ ] Final project title.
- [ ] Short project description.
- [ ] Full project description / problem / solution / build story.
- [ ] Explain how OpenAI is used.
- [ ] Explain how PayPal Sandbox is used.
- [x] Public GitHub repository URL prepared.
- [x] Public live demo URL prepared and unauthenticated access verified.
- [ ] Public YouTube demo URL.
- [x] Final screenshots/assets selected.
- [ ] Team/member name(s).
- [ ] Required contact information.
- [ ] Technology stack.
- [ ] Required challenge / track / category selections.
- [ ] Any sponsor-specific fields.
- [ ] Review all submission claims against the actually shipped functionality.
- [ ] Confirm the official deadline and any final form-specific requirements.

## 11. Final MASTER walkthrough
Before submission:

- [ ] Open the public demo in a fresh incognito session.
- [ ] Run AI opportunity analysis.
- [ ] Confirm buyer wallet loads.
- [ ] Run three demo purchases.
- [ ] Confirm seller balance and purchase count.
- [ ] Complete one PayPal Sandbox funding flow.
- [ ] Confirm buyer balance increases.
- [ ] Confirm aggregation shows multiple MicroWallet purchases against fewer funding transactions.
- [ ] Confirm Activity and PayPal funding reference are visible.
- [ ] Open Privacy Policy.
- [ ] Open Terms & Demo Disclaimer.
- [ ] Verify repository is public.
- [x] Verify MIT license is visibly recognized by GitHub.
- [ ] Verify YouTube video is public.
- [ ] Verify all Devpost links from a logged-out/incognito browser.
- [ ] Submit before the official deadline.

## Current blockers

The public application, main technical demo flow, licensing check, and final screenshot set have passed verification.

Remaining submission work:

1. update and record the demo video;
2. upload the video to YouTube;
3. complete Devpost submission fields;
4. perform the final MASTER walkthrough.
