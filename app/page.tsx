import FundingTest from "@/app/components/funding-test";

export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">PayPal AI Hackathon 2026</p>
        <h1>AI MicroWallet</h1>
        <p className="lead">A focused PayPal Sandbox funding test. No internal wallet balance or ledger is involved.</p>
        <FundingTest />
        <p className="status">AI recommends. Code controls balances. PayPal moves money.</p>
      </section>
    </main>
  );
}
