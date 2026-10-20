"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Gem, Search } from "lucide-react";
import { Header } from "@/components/header";
import { BackButton } from "@/components/back-button";
import { NftMedia } from "@/components/nft-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { NftDetailDialog } from "@/components/nft-detail-dialog";
import {
  buyNft,
  currentWallet,
  fetchListings,
  type Nft,
  type SharedListing,
  type Wallet,
} from "@/lib/wallet";

export default function MarketPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [query, setQuery] = useState("");
  const [buying, setBuying] = useState<SharedListing | null>(null);
  const [busy, setBusy] = useState(false);
  const [sold, setSold] = useState(false);
  const [listings, setListings] = useState<SharedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detailNft, setDetailNft] = useState<Nft | null>(null);

  useEffect(() => {
    setWallet(currentWallet());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const all = await fetchListings();
      setListings(all.filter((l) => l.status === "active"));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) => {
      const nft = l.nft;
      return (
        nft.name.toLowerCase().includes(q) ||
        nft.description.toLowerCase().includes(q) ||
        nft.symbol.toLowerCase().includes(q) ||
        l.seller.toLowerCase().includes(q)
      );
    });
  }, [query, listings]);

  async function handleBuy() {
    if (!buying || !wallet) return;
    setBusy(true);
    try {
      await buyNft(buying.id, wallet);
      setSold(true);
      await load();
      toast.success("Purchase complete — NFT transferred to your wallet");
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

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border bg-card">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            icon={<Gem className="h-8 w-8" />}
            title="Couldn't load the marketplace"
            body={loadError}
            action={<Button variant="outline" onClick={() => void load()}>Retry</Button>}
          />
        ) : filtered.length === 0 ? (
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
            {filtered.map((listing) => (
              <div
                key={listing.id}
                className="card-glow cursor-pointer overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.35)]"
                onClick={() => setDetailNft({
                  id: listing.nftId,
                  name: listing.nft.name,
                  description: listing.nft.description,
                  symbol: listing.nft.symbol,
                  imageType: listing.nft.imageType as "generative" | "upload" | "ai",
                  image: listing.nft.image,
                  artSeed: listing.nft.artSeed,
                  mintedAt: listing.listedAt,
                  owner: listing.seller,
                  txRef: "",
                })}
              >
                <div className="aspect-square overflow-hidden">
                  <NftMedia nft={{ id: listing.nftId, name: listing.nft.name, description: listing.nft.description, symbol: listing.nft.symbol, imageType: listing.nft.imageType as "generative" | "upload" | "ai", image: listing.nft.image, artSeed: listing.nft.artSeed, mintedAt: "", owner: "", txRef: "" }} />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-sm font-semibold">{listing.nft.name}</h3>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {listing.nft.symbol}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {listing.price} UCT
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {listing.nft.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      by <span className="font-mono">{listing.seller.slice(0, 8)}…</span>
                    </span>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); setSold(false); setBuying(listing); }}>
                      Buy <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <NftDetailDialog
        nft={detailNft}
        open={!!detailNft}
        onOpenChange={(o) => { if (!o) setDetailNft(null); }}
      />

      <Dialog open={!!buying} onOpenChange={(o) => { if (!o) { setBuying(null); setSold(false); } }}>
        <DialogContent className="max-w-md">
          {buying ? (
            sold ? (
              <>
                <DialogHeader>
                  <DialogTitle>Purchase complete</DialogTitle>
                  <DialogDescription>
                    {buying.nft.name} is now in your collection.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="aspect-square w-20 shrink-0 overflow-hidden rounded-lg border">
                    <NftMedia nft={{ id: buying.nftId, name: buying.nft.name, description: buying.nft.description, symbol: buying.nft.symbol, imageType: buying.nft.imageType as "generative" | "upload" | "ai", image: buying.nft.image, artSeed: buying.nft.artSeed, mintedAt: "", owner: "", txRef: "" }} />
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Paid: <span className="font-mono text-foreground">{buying.price} UCT</span>
                    </p>
                    <p className="text-muted-foreground">
                      New balance:{" "}
                      <span className="font-mono text-foreground">{wallet?.uctBalance ?? "—"} UCT</span>
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => { setBuying(null); setSold(false); }}>
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Confirm purchase</DialogTitle>
                  <DialogDescription>
                    {buying.nft.name} — {buying.price} UCT
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="aspect-square w-20 shrink-0 overflow-hidden rounded-lg border">
                    <NftMedia nft={{ id: buying.nftId, name: buying.nft.name, description: buying.nft.description, symbol: buying.nft.symbol, imageType: buying.nft.imageType as "generative" | "upload" | "ai", image: buying.nft.image, artSeed: buying.nft.artSeed, mintedAt: "", owner: "", txRef: "" }} />
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
                  {wallet ? (
                    <Button onClick={handleBuy} disabled={busy}>
                      {busy ? "Processing…" : `Buy for ${buying.price} UCT`}
                    </Button>
                  ) : (
                    <Button disabled>Connect a wallet to buy</Button>
                  )}
                </div>
              </>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
