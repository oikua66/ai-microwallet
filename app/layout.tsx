import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI MicroWallet",
  description: "AI-managed micro-wallets for aggregated micro-commerce powered by PayPal payment infrastructure.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
