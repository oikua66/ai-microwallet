import MicroWalletDemo from "@/app/components/micro-wallet-demo";
import AIRecommendationDemo from "@/app/components/ai-recommendation-demo";

export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">PayPal AI Hackathon 2026 · Product demo</p>
        <h1>AI MicroWallet</h1>
        <p className="lead">Turn repeated low-value purchases into a clear, auditable wallet journey.</p>
        <p>New to the demo? Follow the numbered steps, then run three internal purchases to compare N and M. PayPal Sandbox is optional when you want to show external wallet funding.</p>
        <nav className="journey-nav" aria-label="Demo journey">
          <a href="#opportunity">1. AI opportunity</a>
          <a href="#wallet">2. Buyer wallet</a>
          <a href="#checkout">3. Merchant checkout</a>
          <a href="#seller">4. Seller & ledger</a>
          <a href="#aggregation">5. Aggregation</a>
        </nav>
        <div className="journey-key" aria-label="Action types">
          <span><strong>AI advice</strong> — recommendation only</span>
          <span><strong>Internal settlement</strong> — deterministic wallet ledger</span>
          <span><strong>PayPal Sandbox</strong> — real external funding, when approved</span>
        </div>
        <AIRecommendationDemo />
        <MicroWalletDemo />
        <p className="status">AI recommends. Code controls balances. PayPal moves money.</p>
      </section>
    </main>
  );
}
