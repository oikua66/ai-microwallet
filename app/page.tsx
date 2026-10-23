import MicroWalletDemo from "@/app/components/micro-wallet-demo";

export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">PayPal AI Hackathon 2026</p>
        <h1>AI MicroWallet</h1>
        <p className="lead">Deterministic internal micro-purchases with integer-cent balances and inspectable ledger history.</p>
        <MicroWalletDemo />
        <p className="status">AI recommends. Code controls balances. PayPal moves money.</p>
      </section>
    </main>
  );
}
