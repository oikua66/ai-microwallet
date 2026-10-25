# AI MicroWallet — voiceover script

Target voice: warm, clear, confident female English voice. Neutral international or US English. Natural pace, approximately 0.95–1.0x. Avoid an advertising tone.

Target runtime: approximately 2 minutes 20 seconds.

## 0:00–0:15

AI MicroWallet is a hackathon prototype for repeated, low-value digital purchases.

Instead of sending every small purchase through a separate external payment flow, the buyer reuses one wallet balance.

## 0:15–0:38

First, AI looks at a sample purchase pattern and decides whether a MicroWallet is a good fit.

The recommendation is advisory only.

AI cannot move money or change wallet balances.

## 0:38–0:55

The buyer keeps a reusable balance.

On the other side, small purchases accumulate in the seller MicroWallet.

Balance changes are controlled by application logic, not by the AI model.

## 0:55–1:18

Here, one digital service costs twenty cents.

I can run three demo purchases.

The buyer balance decreases, the seller balance increases, and each purchase remains individually recorded.

## 1:18–1:38

When the wallet needs more funds, PayPal Sandbox handles the external funding step.

This is Sandbox test activity, not a production payment.

After the buyer approves the funding, the application returns to AI MicroWallet.

## 1:38–1:55

The server verifies the PayPal capture before the demo wallet balance is updated.

The five-dollar funding amount and its capture reference are then recorded in the application.

## 1:55–2:10

This is the main idea.

Several small purchases can be completed from the MicroWallet while fewer external funding transactions are needed.

Here, three purchases are supported by one PayPal funding event.

## 2:10–2:28

In this hackathon demo, PayPal Sandbox approval is intentionally visible so the funding step is easy to verify.

A production MicroWallet would use a smoother everyday flow.

The user would authorize the device once and choose spending limits.

Purchases inside those limits could then be completed automatically by the trusted device, without repeated login or payment approval.

Re-authentication would happen only when a limit is exceeded, the device changes, or risk controls trigger.

## 2:28–2:38

AI identifies the opportunity.

Code controls balances.

PayPal Sandbox funds the wallet.

That is AI MicroWallet.

## Voice-generation notes

- Read “AI” as “A I”.
- Read “MicroWallet” naturally as “micro wallet”.
- Read “PayPal” normally.
- Read “twenty cents”, not “zero point two dollars”.
- Read “five dollars”, not “five point zero zero U S D”.
- Insert a short pause between paragraphs.
- Keep the production-model section slightly slower so the distinction between the demo and intended production flow is clear.
- Do not add music under the narration until the spoken track is approved.
