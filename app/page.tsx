import MicroWalletDemo from "@/app/components/micro-wallet-demo";
import AIRecommendationDemo from "@/app/components/ai-recommendation-demo";

export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">PayPal AI Hackathon 2026 · Product demo</p>
        <h1>AI MicroWallet</h1>
        <p className="lead">Turn repeated low-value purchases into a clear, auditable wallet journey.</p>
        <p>Follow the numbered steps to see how AI identifies a good MicroWallet use case, how small purchases settle from a reusable balance, and how PayPal Sandbox can fund the wallet externally.</p>
        <nav className="journey-nav" aria-label="Demo journey">
          <a href="#opportunity">1. AI opportunity</a>
          <a href="#wallet">2. Buyer wallet</a>
          <a href="#seller">3. Seller wallet</a>
          <a href="#checkout">4. Merchant checkout</a>
          <a href="#aggregation">5. Aggregation</a>
        </nav>
        <div className="journey-key" aria-label="Action types">
          <span><strong>AI</strong> — identifies suitable payment patterns</span>
          <span><strong>MicroWallet</strong> — handles repeated small purchases from one balance</span>
          <span><strong>PayPal Sandbox</strong> — adds funds to the wallet for the demo</span>
        </div>
        <AIRecommendationDemo />
        <MicroWalletDemo />

        <section className="production-model" aria-labelledby="production-model-title">
          <p className="stage-label">Production model</p>
          <h2 id="production-model-title">Authorize once. Then let small purchases stay small.</h2>
          <p>
            PayPal Sandbox approval is intentionally visible in this hackathon demo so external wallet funding can be verified. A production MicroWallet would use a different everyday flow.
          </p>
          <div className="production-flow">
            <div>
              <strong>One-time setup</strong>
              <p>Authorize the device, establish a device-bound credential in secure storage, and choose spending limits.</p>
            </div>
            <div>
              <strong>Everyday micro-purchases</strong>
              <p>Purchases inside those limits can be completed automatically by the trusted device, without repeated login or payment approval.</p>
            </div>
            <div>
              <strong>Step-up when needed</strong>
              <p>Re-authentication is required when limits are exceeded, the device changes, or risk controls trigger.</p>
            </div>
          </div>
          <p className="production-note">
            Example policy: up to $1 per purchase and $20 per day. Limits and step-up authentication rules would be configurable by the wallet provider and the user.
          </p>
        </section>

        <p className="status">AI recommends. Code controls balances. PayPal moves money.</p>
        <footer>
          <p><strong>Hackathon demo · No real-money service · PayPal Sandbox only</strong></p>
          <p><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms &amp; Demo Disclaimer</a></p>
        </footer>
      </section>
    </main>
  );
}
