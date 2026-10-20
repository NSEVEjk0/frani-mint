"use client";

import Link from "next/link";
import { useState } from "react";
import { connectWallet, currentWallet, disconnectWallet, type Wallet } from "@/lib/wallet";

export function Header() {
  const [wallet, setWallet] = useState<Wallet | null>(() => currentWallet());
  const [open, setOpen] = useState(false);

  function handleConnect() {
    setWallet(connectWallet());
  }

  function handleDisconnect() {
    disconnectWallet();
    setWallet(null);
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            aria-hidden="true"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "linear-gradient(135deg, #fbbf24, #d97706)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#0f172a",
              fontSize: 15,
            }}
          >
            F
          </span>
          <span style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.02em" }}>
            Frani <span className="gold-grad">Mint</span>
          </span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 20 }} aria-label="Main">
          <Link
            href="/#how"
            style={{ color: "var(--muted-fg)", fontSize: "0.95rem", transition: "color 160ms" }}
            className="nav-link"
          >
            How it works
          </Link>
          <Link
            href="/studio"
            style={{ color: "var(--muted-fg)", fontSize: "0.95rem" }}
            className="nav-link"
          >
            Studio
          </Link>

          {wallet ? (
            <div style={{ position: "relative" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="true"
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--pos)",
                  }}
                />
                {wallet.nametag}
                <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>▾</span>
              </button>
              {open ? (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: 260,
                    padding: 14,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    boxShadow: "0 20px 50px -12px rgba(0,0,0,0.6)",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "var(--muted-fg)", marginBottom: 6 }}>
                    CONNECTED WALLET
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "0.8rem",
                      overflowWrap: "anywhere",
                      marginBottom: 12,
                    }}
                  >
                    {wallet.address}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={handleDisconnect}>
                    Disconnect
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleConnect}>
              Connect wallet
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
