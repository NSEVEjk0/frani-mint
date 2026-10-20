import Link from "next/link";
import { Header } from "@/components/Header";

const FEATURES = [
  {
    title: "Mint in seconds",
    body: "Name it, describe it, mint it. Every NFT gets unique generative art and a signed transaction reference.",
  },
  {
    title: "Owned by your wallet",
    body: "Assets are bound to your Unicity wallet — no account, no email, no middleman.",
  },
  {
    title: "Built for the Digital Republic",
    body: "Native to Unicity testnet2, ready for the ecosystem's agents, markets, and identity rails.",
  },
];

const STEPS = [
  { n: "01", title: "Connect", body: "Create or connect your Unicity wallet in one click." },
  { n: "02", title: "Create", body: "Give your NFT a name, description, and symbol." },
  { n: "03", title: "Mint", body: "Mint it — unique generative art is produced from your metadata." },
  { n: "04", title: "Collect", body: "Browse your collection in the studio. Share, keep, or trade." },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "96px 24px 72px",
            textAlign: "center",
          }}
        >
          <span className="chip" style={{ marginBottom: 24 }}>
            <span aria-hidden="true" style={{ color: "var(--primary)" }}>◆</span>
            Unicity testnet2
          </span>
          <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 1.1, margin: "0 0 20px" }}>
            Mint the things you{" "}
            <span className="gold-grad">make</span>.
          </h1>
          <p
            style={{
              maxWidth: 620,
              margin: "0 auto 36px",
              color: "var(--muted-fg)",
              fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            }}
          >
            Frani Mint is a mint studio for Unicity — create NFTs, collect them,
            and prove what&apos;s yours, all from your wallet.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/studio" className="btn btn-primary btn-lg">
              Open the studio →
            </Link>
            <Link href="#how" className="btn btn-ghost btn-lg">
              How it works
            </Link>
          </div>
        </section>

        {/* Proof strip */}
        <section
          style={{
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            background: "rgba(39, 47, 66, 0.35)",
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              padding: "28px 24px",
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            {[
              ["100%", "wallet-owned"],
              ["1 tx", "per mint"],
              ["0", "accounts needed"],
              ["∞", "possibilities"],
            ].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Orbitron", fontSize: "1.6rem", fontWeight: 700 }} className="gold-grad">
                  {v}
                </div>
                <div style={{ color: "var(--muted-fg)", fontSize: "0.85rem" }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "80px 24px" }}>
          <h2 style={{ fontSize: "1.8rem", margin: "0 0 32px" }}>Why Frani Mint</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ padding: 26 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "rgba(245, 158, 11, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    marginBottom: 14,
                    color: "var(--primary)",
                  }}
                  aria-hidden="true"
                >
                  ◆
                </div>
                <h3 style={{ fontSize: "1.05rem", margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ margin: 0, color: "var(--muted-fg)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px 96px" }}>
          <h2 style={{ fontSize: "1.8rem", margin: "0 0 8px" }}>How it works</h2>
          <p style={{ color: "var(--muted-fg)", margin: "0 0 36px" }}>
            Four steps from idea to on-chain collectible.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {STEPS.map((s) => (
              <div key={s.n} className="card" style={{ padding: 24, position: "relative" }}>
                <div
                  style={{
                    fontFamily: "Orbitron",
                    fontSize: "0.85rem",
                    color: "var(--primary)",
                    marginBottom: 12,
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ fontSize: "1rem", margin: "0 0 6px" }}>{s.title}</h3>
                <p style={{ margin: 0, color: "var(--muted-fg)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ borderTop: "1px solid var(--border)", background: "rgba(245, 158, 11, 0.05)" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 24px", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.6rem", margin: "0 0 12px" }}>
              Your first NFT is one click away.
            </h2>
            <p style={{ color: "var(--muted-fg)", margin: "0 0 28px" }}>
              No sign-up. No gas token. Just your wallet.
            </p>
            <Link href="/studio" className="btn btn-primary btn-lg">
              Start minting
            </Link>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, color: "var(--muted-fg)", fontSize: "0.85rem" }}>
          Frani Mint · made by CRYPTFRANI on Unicity testnet2
        </p>
      </footer>
    </>
  );
}
