"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { NftArt } from "@/components/NftArt";
import {
  connectWallet,
  currentWallet,
  listNfts,
  mintNft,
  disconnectWallet,
  type Nft,
} from "@/lib/wallet";

export default function StudioPage() {
  const [wallet, setWallet] = useState(() => currentWallet());
  const [nfts, setNfts] = useState<Nft[]>(() => listNfts());
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [status, setStatus] = useState<"idle" | "minting" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [minted, setMinted] = useState<Nft | null>(null);
  const [tab, setTab] = useState<"mint" | "collection">("mint");

  const collection = useMemo(
    () => [...nfts].sort((a, b) => (a.mintedAt < b.mintedAt ? 1 : -1)),
    [nfts]
  );

  function handleConnect() {
    setWallet(connectWallet());
  }

  function handleDisconnect() {
    disconnectWallet();
    setWallet(null);
  }

  function handleMint(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) return;
    if (!name.trim()) {
      setStatus("error");
      setError("Give your NFT a name.");
      return;
    }
    setStatus("minting");
    setError("");
    // Simulate a short chain round-trip for the mint.
    window.setTimeout(() => {
      const nft = mintNft({
        name: name.trim(),
        description: description.trim() || "Minted on Frani Mint.",
        symbol: symbol.trim() || "UCT-NFT",
        owner: wallet.address,
      });
      setNfts((prev) => [nft, ...prev]);
      setMinted(nft);
      setStatus("done");
      setName("");
      setDescription("");
      setSymbol("");
    }, 900);
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 96px" }}>
        {/* Wallet bar */}
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 20px",
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted-fg)", marginBottom: 4 }}>
              WALLET
            </div>
            {wallet ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  aria-hidden="true"
                  style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--pos)" }}
                />
                <span style={{ fontWeight: 600 }}>{wallet.nametag}</span>
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "0.78rem",
                    color: "var(--muted-fg)",
                  }}
                >
                  {wallet.address.slice(0, 10)}…{wallet.address.slice(-6)}
                </span>
              </div>
            ) : (
              <span style={{ color: "var(--muted-fg)" }}>Not connected</span>
            )}
          </div>
          {wallet ? (
            <button className="btn btn-ghost btn-sm" onClick={handleDisconnect}>
              Disconnect
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleConnect}>
              Connect wallet
            </button>
          )}
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Studio" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(
            [
              ["mint", "Mint"],
              ["collection", `Collection (${collection.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className="btn btn-sm"
              style={{
                background: tab === key ? "var(--primary)" : "transparent",
                color: tab === key ? "var(--on-primary)" : "var(--muted-fg)",
                borderColor: tab === key ? "var(--primary)" : "var(--border)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "mint" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            {/* Mint form */}
            <form className="card" onSubmit={handleMint} style={{ padding: 28 }}>
              <h2 style={{ fontSize: "1.3rem", margin: "0 0 20px" }}>Mint a new NFT</h2>

              <label style={{ display: "block", marginBottom: 6, fontSize: "0.9rem", fontWeight: 600 }}>
                Name
              </label>
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Genesis Badge"
                style={{ marginBottom: 16 }}
                aria-label="NFT name"
              />

              <label style={{ display: "block", marginBottom: 6, fontSize: "0.9rem", fontWeight: 600 }}>
                Description
              </label>
              <textarea
                className="field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this token?"
                rows={4}
                style={{ marginBottom: 16, resize: "vertical" }}
                aria-label="NFT description"
              />

              <label style={{ display: "block", marginBottom: 6, fontSize: "0.9rem", fontWeight: 600 }}>
                Symbol
              </label>
              <input
                className="field"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="UCT-NFT"
                style={{ marginBottom: 24 }}
                aria-label="NFT symbol"
              />

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", padding: "14px 20px" }}
                disabled={!wallet || status === "minting"}
              >
                {!wallet
                  ? "Connect a wallet to mint"
                  : status === "minting"
                  ? "Minting on Unicity…"
                  : "Mint NFT"}
              </button>

              {!wallet ? (
                <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "var(--muted-fg)", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={handleConnect}
                    style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                  >
                    Connect wallet
                  </button>{" "}
                  to get started.
                </p>
              ) : null}

              {status === "error" && error ? (
                <p style={{ color: "var(--neg)", fontSize: "0.88rem", margin: "12px 0 0" }}>{error}</p>
              ) : null}
            </form>

            {/* Preview / result */}
            <div>
              {status === "done" && minted ? (
                <div className="card" style={{ padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--pos)", fontWeight: 700, marginBottom: 12 }}>
                    ✓ Minted on Unicity
                  </div>
                  <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "1 / 1", marginBottom: 16 }}>
                    <NftArt seed={minted.artSeed} />
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>{minted.name}</h3>
                  <p style={{ margin: "0 0 12px", color: "var(--muted-fg)", fontSize: "0.9rem" }}>
                    {minted.symbol} · {minted.description}
                  </p>
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "0.72rem",
                      color: "var(--muted-fg)",
                      overflowWrap: "anywhere",
                    }}
                  >
                    tx {minted.txRef.slice(0, 18)}…{minted.txRef.slice(-6)}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => setTab("collection")}>
                    View in collection →
                  </button>
                </div>
              ) : (
                <div className="card" style={{ padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted-fg)", marginBottom: 12 }}>
                    PREVIEW
                  </div>
                  <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "1 / 1", marginBottom: 16 }}>
                    <NftArt seed={name ? name.length * 7919 + 7 : 42} />
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>
                    {name.trim() || "Your NFT preview"}
                  </h3>
                  <p style={{ margin: 0, color: "var(--muted-fg)", fontSize: "0.9rem" }}>
                    {description.trim() || "Art is generated from your metadata."}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Collection */
          <div>
            {collection.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">◇</div>
                <h2 style={{ fontSize: "1.2rem", margin: "0 0 8px" }}>No NFTs yet</h2>
                <p style={{ color: "var(--muted-fg)", margin: "0 0 20px" }}>
                  Mint your first collectible to see it here.
                </p>
                <button className="btn btn-primary" onClick={() => setTab("mint")}>
                  Mint your first NFT
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                {collection.map((nft) => (
                  <article key={nft.id} className="card" style={{ overflow: "hidden" }}>
                    <div style={{ aspectRatio: "1 / 1" }}>
                      <NftArt seed={nft.artSeed} />
                    </div>
                    <div style={{ padding: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <h3 style={{ margin: 0, fontSize: "1rem" }}>{nft.name}</h3>
                        <span className="chip">{nft.symbol}</span>
                      </div>
                      <p
                        style={{
                          margin: "0 0 12px",
                          color: "var(--muted-fg)",
                          fontSize: "0.88rem",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {nft.description}
                      </p>
                      <div style={{ fontSize: "0.74rem", color: "var(--muted-fg)", fontFamily: "ui-monospace, monospace" }}>
                        {new Date(nft.mintedAt).toLocaleDateString()} ·{" "}
                        {nft.owner.slice(0, 8)}…{nft.owner.slice(-4)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
