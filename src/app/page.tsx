import Link from "next/link";
import { ArrowRight, Gem, ImageIcon, ShieldCheck, Wallet } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NftArt } from "@/components/nft-art";

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

const STEPS = [
  { n: "01", title: "Connect", body: "Create or connect your Unicity wallet in one click." },
  { n: "02", title: "Create", body: "Give your NFT a name, description, and image — or let art generate." },
  { n: "03", title: "Mint", body: "Mint it. Your asset is written to the network with a signed reference." },
  { n: "04", title: "Trade", body: "Hold it, list it, or buy from the marketplace." },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
            <div className="animate-fade-up">
              <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Unicity testnet2
              </Badge>
            </div>
            <h1 className="animate-fade-up mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Mint the things you <span className="text-gradient">make</span>.
            </h1>
            <p className="animate-fade-up mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Frani Mint is a mint studio for Unicity — create NFTs, collect them,
              and trade them, all from your wallet.
            </p>
            <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link href="/studio">
                  Open the studio <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/market">Browse marketplace</Link>
              </Button>
            </div>

            {/* Floating art previews */}
            <div className="relative mx-auto mt-16 hidden max-w-3xl items-end justify-center gap-5 sm:flex">
              <div className="animate-float w-40 overflow-hidden rounded-xl border shadow-2xl shadow-primary/10" style={{ animationDelay: "0.4s" }}>
                <NftArt seed={7} />
              </div>
              <div className="animate-float w-52 overflow-hidden rounded-xl border shadow-2xl shadow-primary/20" style={{ animationDelay: "0.9s" }}>
                <NftArt seed={42} />
              </div>
              <div className="animate-float w-40 overflow-hidden rounded-xl border shadow-2xl shadow-primary/10" style={{ animationDelay: "1.4s" }}>
                <NftArt seed={1337} />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
            {[
              ["100%", "wallet-owned"],
              ["1 tx", "per mint"],
              ["0", "accounts needed"],
              ["∞", "possibilities"],
            ].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{v}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-10 max-w-xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Why Frani Mint
            </h2>
            <p className="mt-2 text-muted-foreground">
              A refined mint experience for the Digital Republic.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-glow rounded-xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-10 max-w-xl">
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                How it works
              </h2>
              <p className="mt-2 text-muted-foreground">
                Four steps from idea to marketable collectible.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.n} className="relative rounded-xl border bg-card p-6">
                  <span className="font-display text-sm font-semibold text-primary">{s.n}</span>
                  <h3 className="mt-3 font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-t border-border/60">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Your first NFT is one click away.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              No sign-up. No gas token. Just your wallet.
            </p>
            <Button size="lg" className="mt-8 gap-2" asChild>
              <Link href="/studio">
                Start minting <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>Frani Mint · made by CRYPTFRANI on Unicity testnet2</p>
          <div className="flex items-center gap-4">
            <Link href="/studio" className="transition-colors hover:text-foreground">Studio</Link>
            <Link href="/market" className="transition-colors hover:text-foreground">Marketplace</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
