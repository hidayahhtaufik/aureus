import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aureus Docs · TalosFacilitator x402 for Arc Network",
  description:
    "Build agent-paid HTTP APIs on Arc Network. SDK quickstart, facilitator endpoints, deployment, x402 spec compliance.",
  metadataBase: new URL("https://aureus.auranode.xyz"),
  openGraph: {
    title: "Aureus Docs",
    description: "First community x402 facilitator for Arc Network.",
    url: "https://aureus.auranode.xyz/docs",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
