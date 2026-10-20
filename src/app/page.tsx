import Link from "next/link";
import { ArrowRight, Gem, ImageIcon, ShieldCheck, Wallet } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NftArt } from "@/components/nft-art";
import { MintMark } from "@/components/logo";
import { FreshMints } from "@/components/fresh-mints";

const FEATURES = [
  {
    icon: ImageIcon,
    title: "Mint with your own art",
    body: "Upload an image or let us generate unique art from your metadata — every mint is yours.",
  },
  {
    icon: Wallet,
    title: "Owned by your wallet",
    body: "No account, no email, no middleman. Assets are bound to your Unicity wallet.",
  },
  {
    icon: Gem,
    title: "Trade in the marketplace",
    body: "List your NFTs for UCT, browse the community's collection, and buy with one click.",
  },
  {
    icon: ShieldCheck,
    title: "Built for the Digital Republic",
    body: "Native to Unicity testnet2, ready for the ecosystem's agents, markets, and identity rails.",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* ── Hero: editorial, art-first ── */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
            <div className="grid items-end gap-12 lg:grid-cols-[1.2fr_1fr]">
              {/* Left: words */}
              <div>
                <div className="animate-fade-up mb-8 flex items-center gap-3">
                  <span className="hairline w-10" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                    Unicity testnet2
                  </span>
                </div>
                <h1 className="display-serif animate-fade-up text-5xl sm:text-6xl lg:text-7xl">
                  Mint the things
                  <br />
                  you <span className="text-gradient italic">make</span>.
                </h1>
                <p className="animate-fade-up mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Frani Mint is a mint studio for Unicity — create NFTs, collect
                  them, and trade them, all from your wallet.
                </p>
                <div className="animate-fade-up mt-10 flex flex-wrap items-center gap-4">
                  <Button size="lg" asChild className="gap-2 rounded-full">
                    <Link href="/studio">
                      Open the studio <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="rounded-full">
                    <Link href="/market">Browse marketplace</Link>
                  </Button>
                </div>
              </div>

              {/* Right: featured artwork, gallery-style */}
              <div className="relative hidden lg:block">
                <div className="absolute -left-10 -top-10">
                  <MintMark size={120} />
                </div>
                <div className="card-glow relative ml-auto w-72 overflow-hidden rounded-sm border">
                  <div className="aspect-square">
                    <NftArt seed={42} />
                  </div>
                  <div className="flex items-center justify-between border-t bg-card px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Genesis</p>
                      <p className="text-[11px] text-muted-foreground">by Frani Mint</p>
                    </div>
                    <Badge variant="secondary" className="font-mono">42 UCT</Badge>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-4 w-40 overflow-hidden rounded-sm border opacity-80">
                  <div className="aspect-square">
                    <NftArt seed={7} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Strip ── */}
        <section className="border-y border-border/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
            {[
              ["100%", "wallet-owned"],
              ["1 tx", "per mint"],
              ["0", "accounts needed"],
              ["∞", "possibilities"],
            ].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="display-serif text-3xl sm:text-4xl">{v}</div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="mb-14 grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <h2 className="display-serif text-4xl sm:text-5xl">
              Why Frani Mint
            </h2>
            <p className="text-muted-foreground lg:pb-2">
              A refined mint experience for the Digital Republic — the artwork
              first, everything else quietly behind it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="group bg-card p-8 transition-colors hover:bg-card/70">
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-border text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium text-lg">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Fresh on the market (live) ── */}
        <FreshMints />

        {/* ── How it works ── */}
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <div className="mb-14">
              <h2 className="display-serif text-4xl sm:text-5xl">How it works</h2>
              <p className="mt-3 text-muted-foreground">
                Four steps from idea to marketable collectible.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {[
                { n: "01", title: "Connect", body: "Create or connect your Unicity wallet in one click." },
                { n: "02", title: "Create", body: "Give your NFT a name, description, and image — or let art generate." },
                { n: "03", title: "Mint", body: "Mint it. Your asset is written to the network with a signed reference." },
                { n: "04", title: "Trade", body: "Hold it, list it, or buy from the marketplace." },
              ].map((s) => (
                <div key={s.n} className="bg-card p-8">
                  <span className="display-serif text-2xl text-primary">{s.n}</span>
                  <h3 className="mt-6 font-medium text-lg">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative overflow-hidden border-t border-border/60">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[360px] w-[360px] rounded-full bg-primary/5 blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-28 text-center sm:px-6">
            <MintMark size={48} className="mx-auto mb-8 text-primary" />
            <h2 className="display-serif mx-auto max-w-2xl text-4xl sm:text-5xl">
              Your first NFT is one click away.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              No sign-up. No gas token. Just your wallet.
            </p>
            <Button size="lg" className="mt-10 gap-2 rounded-full" asChild>
              <Link href="/studio">
                Start minting <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>Frani Mint · made by CRYPTFRANI on Unicity testnet2</p>
          <div className="flex items-center gap-6">
            <Link href="/studio" className="transition-colors hover:text-foreground">Studio</Link>
            <Link href="/market" className="transition-colors hover:text-foreground">Marketplace</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
