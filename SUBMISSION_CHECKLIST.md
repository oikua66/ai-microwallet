# Hackathon submission checklist

Evidence state as of 2026-10-23. Do not mark a remaining item complete without evidence.

## Repository and release
- [x] Public repository confirmed: `oikua66/ai-microwallet`.
- [x] Tracked-file release/security audit completed for the H-009 repository state. No committed real PayPal, OpenAI, Supabase, GitHub, private-key, or similar credential material was found in the reviewed tracked files. `.env.example` contains blank placeholders only; server code reads secrets from environment variables.
- [x] Exact-head independent verification for H-009 completed: SQL/database verification and production build passed on the task HEAD through the separate Orchestrator verifier; Vercel preview is READY.
- [x] H-008 integrated product implementation passed MASTER and is on `main` at `96248fa593421b1ee498b661ce771ca22b51e4c0`; the corresponding Vercel production deployment is READY.
- [ ] Verify unauthenticated judge access to the public demo. Vercel production alias discovered: `https://ai-microwallet.vercel.app/`. Current project configuration has Vercel Authentication enabled for deployments except custom domains, and no separate custom domain has been confirmed. Do not advertise this as a public demo until access is opened or a public custom domain is verified.
- [x] Product claims aligned with the shipped prototype: AI provides constrained advice, deterministic code controls internal wallet/ledger state, and PayPal Sandbox provides external funding. No banking/EMI status, PayPal replacement, production PayPal payments, or external seller payout is claimed.

## Security evidence reviewed
- [x] `.env.example` uses blank credential placeholders.
- [x] PayPal integration reads client ID/secret from server environment variables; no hardcoded PayPal credential found in the reviewed source.
- [x] OpenAI integration reads `OPENAI_API_KEY` from the server environment; no hardcoded OpenAI key found in the reviewed source.
- [x] Supabase privileged access reads `SUPABASE_SERVICE_ROLE_KEY` from the server environment; no hardcoded service-role credential found in the reviewed source.
- [x] GitHub verifier uses the runtime-provided `GITHUB_TOKEN` secret reference rather than a committed token.
- [x] No tracked private-key file or private-key block was found in the reviewed repository tree/pattern audit.

## Demo assets
- [ ] Record screenshots of the recommendation, buyer wallet, PayPal Sandbox funding confirmation, internal ledger, seller wallet, and N-versus-M aggregation result. Label synthetic/demo content.
- [ ] Record and review the product video against [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md); finished runtime must be 2:00–2:30.
- [ ] Add final screenshot/video asset links and verify that judges can open them.

## Hackathon submission fields
- [ ] Project title and concise description.
- [ ] Team/member names and contact details required by the submission form.
- [x] Public repository URL: `https://github.com/oikua66/ai-microwallet`.
- [ ] Live demo URL: use `https://ai-microwallet.vercel.app/` only after unauthenticated access is verified, or replace it with a verified public custom domain.
- [ ] Product video URL and screenshots/assets.
- [x] Technology stack and accurate AI/PayPal integration description prepared in README.
- [ ] Any required track, category, challenge, or sponsor fields.
- [ ] Confirm submission deadline and submitter-owned form requirements.

## Final MASTER gate

The code/build/security-documentation portion is ready for another exact-head verification after these H-009 documentation updates. The remaining genuine owner-controlled release blocker is public judge access: either allow unauthenticated access to the Vercel production demo for the hackathon or provide/attach a public custom domain. This checklist does not authorize changing deployment access controls.
