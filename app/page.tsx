export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">PayPal AI Hackathon 2026</p>
        <h1>AI MicroWallet</h1>
        <p className="lead">
          AI-managed micro-wallets for buyers and sellers that aggregate real PayPal transactions while settling micro-purchases internally.
        </p>
        <div className="principles">
          <p><strong>Micro-purchases are settled internally.</strong></p>
          <p>PayPal is used for aggregated real money movement.</p>
          <p>AI identifies where aggregation makes sense.</p>
        </div>
        <p className="status">Hackathon MVP scaffold — implementation in progress.</p>
      </section>
    </main>
  );
}
