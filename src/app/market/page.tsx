"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Gem, Search } from "lucide-react";
import { Header } from "@/components/header";
import { BackButton } from "@/components/back-button";
import { NftCard, NftMedia } from "@/components/nft-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import {
  activeListings,
  buyNft,
  currentWallet,
  getNft,
  type Listing,
  type Wallet,
} from "@/lib/wallet";

export default function MarketPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [query, setQuery] = useState("");
  const [buying, setBuying] = useState<Listing | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setWallet(currentWallet());
  }, []);

  const listings = useMemo(() => {
    const all = activeListings();
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((l) => {
      const nft = getNft(l.nftId);
      if (!nft) return false;
      return (
        nft.name.toLowerCase().includes(q) ||
        nft.description.toLowerCase().includes(q) ||
        nft.symbol.toLowerCase().includes(q)
      );
    });
  }, [query, buying]);

  async function handleBuy() {
    if (!buying || !wallet) return;
    setBusy(true);
    try {
      await buyNft(buying.id, wallet);
      toast.success("Purchase complete — NFT transferred to your wallet");
      setBuying(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-2">
          <BackButton label="Back to home" />
        </div>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Marketplace</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Browse NFTs listed by the community, priced in UCT.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search NFTs…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={<Gem className="h-8 w-8" />}
            title={query ? "No matches" : "Nothing listed yet"}
            body={
              query
                ? "Try a different search."
                : "When someone lists an NFT from their collection, it shows up here."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const nft = getNft(listing.nftId);
              if (!nft) return null;
              return (
                <div key={listing.id} className="card-glow overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.35)]">
                  <div className="aspect-square overflow-hidden">
                    <NftMedia nft={nft} />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-sm font-semibold">{nft.name}</h3>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {nft.symbol}
                        </p>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {listing.price} UCT
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {nft.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        by <span className="font-mono">{listing.seller.slice(0, 8)}…</span>
                      </span>
                      <Button size="sm" onClick={() => setBuying(listing)}>
                        Buy <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!buying} onOpenChange={(o) => { if (!o) setBuying(null); }}>
        <DialogContent className="max-w-md">
          {buying ? (
            <>
              <DialogHeader>
                <DialogTitle>Confirm purchase</DialogTitle>
                <DialogDescription>
                  {getNft(buying.nftId)?.name} — {buying.price} UCT
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-4">
                <div className="aspect-square w-20 shrink-0 overflow-hidden rounded-lg border">
                  {(() => {
                    const nft = getNft(buying.nftId);
                    return nft ? <NftMedia nft={nft} /> : null;
                  })()}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    Seller: <span className="font-mono">{buying.seller.slice(0, 10)}…</span>
                  </p>
                  <p className="text-muted-foreground">
                    Your balance:{" "}
                    <span className="font-mono text-foreground">
                      {wallet?.uctBalance ?? "—"} UCT
                    </span>
                    {wallet?.kind === "guest" ? (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
                        guest
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The NFT transfers to your wallet instantly.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setBuying(null)} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={handleBuy} disabled={busy}>
                  {busy ? "Processing…" : `Buy for ${buying.price} UCT`}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
