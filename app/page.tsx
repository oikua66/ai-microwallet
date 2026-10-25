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
        <p className="status">AI recommends. Code controls balances. PayPal moves money.</p>
      </section>
    </main>
  );
}
