import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { AmbientBackground } from "@/components/ambient-background";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Frani Mint — NFTs on Unicity",
  description:
    "Mint, collect, and trade NFTs on Unicity testnet2. A mint studio for the Digital Republic.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen font-sans">
        <AmbientBackground />
        <div className="relative z-10">{children}</div>
        <Toaster position="bottom-right" theme="dark" toastOptions={{ style: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" } }} />
      </body>
    </html>
  );
}
