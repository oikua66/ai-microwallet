import MicroWalletDemo from "@/app/components/micro-wallet-demo";
import AIRecommendationDemo from "@/app/components/ai-recommendation-demo";

export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">PayPal AI Hackathon 2026</p>
        <h1>AI MicroWallet</h1>
        <p className="lead">Deterministic internal micro-purchases with integer-cent balances and inspectable ledger history.</p>
        <MicroWalletDemo />
        <AIRecommendationDemo />
        <p className="status">AI finds where aggregation makes sense. MicroWallet settles the micro-purchases. PayPal moves the real money.</p>
      </section>
    </main>
  );
}
