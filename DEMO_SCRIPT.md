# Product video script — target 2:20

Use synthetic transaction history and PayPal Sandbox. Keep the responsibility boundary explicit: AI recommends; deterministic code controls balances; PayPal handles external funding. Do not imply banking/EMI status or an implemented external seller payout.

| Time | Visual and narration |
|---|---|
| 0:00–0:15 | **Visual:** Title and several small purchase examples. **Narration:** “Small purchases can create repeated payment friction. AI MicroWallet asks a simple question: when can we aggregate the real payment activity without losing transaction-level control?” |
| 0:15–0:40 | **Visual:** Run the synthetic history through the recommendation UI. **Narration:** “AI reviews transaction history and identifies where aggregation makes sense. The recommendation is advice only. It cannot move money or change a balance.” |
| 0:40–0:55 | **Visual:** Show the three-role architecture. **Narration:** “AI finds where aggregation makes sense. MicroWallet settles the micro-purchases. PayPal moves the real money.” |
| 0:55–1:15 | **Visual:** Show the persistent buyer wallet, then start the PayPal Sandbox top-up. **Narration:** “The buyer wallet keeps deterministic balance and ledger state. External funding starts through PayPal Sandbox, where the buyer approves the real funding transaction.” |
| 1:15–1:35 | **Visual:** Return from PayPal and show the confirmed funding reference. **Narration:** “The server verifies the PayPal order, amount, currency, and capture before recording funding. A failed or unverified capture is never reported as successful.” |
| 1:35–1:55 | **Visual:** Complete an internal 0.20 USD purchase and show buyer debit, seller credit, product/service and ledger reference. **Narration:** “Now the micro-purchase is settled internally by deterministic code. This purchase does not create another PayPal transaction.” |
| 1:55–2:10 | **Visual:** Use the three-purchase demo and show the aggregation panel with internal purchase count N and PayPal funding count M. **Narration:** “Multiple internal purchases can accumulate behind fewer external funding transactions. The demo makes the N-versus-M relationship visible while keeping every internal purchase auditable.” |
| 2:10–2:20 | **Visual:** End card with repository and demo URL only after unauthenticated access is verified. **Narration:** “AI recommends. Code controls balances. PayPal moves money. That is AI MicroWallet.” |

**Runtime target:** 2:20. Keep the finished video between 2:00 and 2:30. Label synthetic/demo data clearly. Do not put credentials, private transaction identifiers, or deployment secrets on screen.
