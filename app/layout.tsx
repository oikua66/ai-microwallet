import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI MicroWallet",
  description: "Hackathon demo of an AI-assisted MicroWallet for aggregated low-value purchases using PayPal Sandbox.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
