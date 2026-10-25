# Product video script — target 2:30

Use the public demo, demo wallet balances, synthetic transaction examples, and PayPal Sandbox only. Keep the responsibility boundary clear: AI identifies a suitable pattern; application code controls wallet balances and purchases; PayPal Sandbox is used for external wallet funding. Do not imply banking/EMI status, production payments, or an implemented seller payout rail.

| Time | Visual and narration |
|---|---|
| 0:00–0:15 | **Visual:** Open the public AI MicroWallet page and show the hero with the five numbered steps. **Narration:** “AI MicroWallet is a hackathon prototype for repeated low-value digital purchases. Instead of sending every small purchase through a separate external payment flow, the buyer reuses one wallet balance.” |
| 0:15–0:38 | **Visual:** Stay on **Step 1 — AI opportunity scan**, show the sample transaction history, then click **Analyze payment pattern**. **Narration:** “First, AI looks at a sample purchase pattern and decides whether a MicroWallet is a good fit. The recommendation is advisory only. AI cannot move money or change wallet balances.” |
| 0:38–0:55 | **Visual:** Scroll to **Step 2 — Buyer MicroWallet** and **Step 3 — Seller MicroWallet**. **Narration:** “The buyer keeps a reusable balance. On the other side, small purchases accumulate in the seller MicroWallet. Balance changes are controlled by application logic, not by the AI model.” |
| 0:55–1:18 | **Visual:** Go to **Step 4 — Merchant checkout**. Click **Run 3 demo purchases** and then show the updated buyer and seller balances. **Narration:** “Here one digital service costs twenty cents. I can run three demo purchases. The buyer balance decreases, the seller balance increases, and each purchase remains individually recorded.” |
| 1:18–1:38 | **Visual:** In Step 4 click **Add funds with PayPal Sandbox**. Briefly show the PayPal Sandbox approval screen, approve the funding, and return to AI MicroWallet. **Narration:** “When the wallet needs more funds, PayPal Sandbox handles the external funding step. This is Sandbox test activity, not a production payment.” |
| 1:38–1:55 | **Visual:** Show the buyer balance after the return, then scroll to the PayPal Sandbox funding record with the 5.00 USD amount and capture reference. **Narration:** “After the return, the server verifies the capture before the demo wallet balance is updated, and the funding reference is recorded.” |
| 1:55–2:10 | **Visual:** Show **Step 5 — Aggregation** with `3` MicroWallet purchases and `1` PayPal funding transaction. **Narration:** “This is the main idea: several small purchases can be completed from the MicroWallet while fewer external funding transactions are needed. Here, three purchases are supported by one PayPal funding event.” |
| 2:10–2:25 | **Visual:** Scroll to **Production model**. **Narration:** “The visible PayPal approval is part of the demo, not the intended everyday experience. In production, the user would authorize a device once and set spending limits. Purchases inside those limits could then be signed by the trusted device without repeated login or payment approval. Re-authentication is reserved for exceptions such as a higher amount, a new device, or a risk trigger.” |
| 2:25–2:30 | **Visual:** End on the hero or a simple end card showing the live demo and GitHub repository. **Narration:** “AI identifies the opportunity. Code controls balances. PayPal Sandbox funds the wallet. That is AI MicroWallet.” |

## Recording notes

- Keep the final runtime close to **2:30** and below **3:00**.
- Show the actual public demo at `https://ai-microwallet.vercel.app/`.
- Use the public repository `https://github.com/oikua66/ai-microwallet` on the end card.
- Keep the PayPal Sandbox segment short; the product UI is the main story.
- The **Production model** section describes intended product architecture, not functionality already implemented in the hackathon prototype.
- Do not show credentials, environment variables, private browser data, or personal PayPal account information.
- Sandbox capture references and demo purchase references may appear in the product UI.
- Avoid engineering shorthand such as `N`, `M`, internal task IDs, commit SHAs, or implementation-history terminology in the narration.
- Do not say “real money”, “bank”, “payment institution”, or suggest that the prototype provides a production custodial wallet.
