import type { Metadata } from "next";
import { Orbitron, Exo_2 } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-orbitron",
  display: "swap",
});

const exo = Exo_2({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-exo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Frani Mint — NFTs on Unicity",
  description:
    "Mint and collect NFTs on Unicity testnet2. A mint studio for the Digital Republic.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${exo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
