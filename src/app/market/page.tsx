"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Gem, Search, Timer } from "lucide-react";
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
import {
  buyNft,
  currentWallet,
  fetchListings,
  isListingExpired,
  makeOffer,
  type SharedListing,
  type Wallet,
} from "@/lib/wallet";

export default function MarketPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [query, setQuery] = useState("");
  const [buying, setBuying] = useState<SharedListing | null>(null);
  const [offering, setOffering] = useState<SharedListing | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [sold, setSold] = useState(false);
  const [allListings, setAllListings] = useState<SharedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<"active" | "collections" | "sold">("active");
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);

  useEffect(() => {
    setWallet(currentWallet());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const all = await fetchListings();
      setAllListings(all);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(
    () => allListings.filter((l) => l.status === "active" && !isListingExpired(l)),
    [allListings]
  );
  const soldListings = useMemo(
    () => allListings.filter((l) => l.status === "sold"),
    [allListings]
  );

  const collections = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of active) {
      const c = l.nft.collection || l.nft.symbol || "Uncategorized";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [active]);

  const filteredActive = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active.filter((l) => {
      if (collectionFilter && (l.nft.collection || l.nft.symbol) !== collectionFilter) return false;
      if (!q) return true;
      const nft = l.nft;
      return (
        nft.name.toLowerCase().includes(q) ||
        nft.description.toLowerCase().includes(q) ||
        nft.symbol.toLowerCase().includes(q) ||
        (nft.collection ?? "").toLowerCase().includes(q) ||
        l.seller.toLowerCase().includes(q)
      );
    });
  }, [query, active, collectionFilter]);

  async function handleBuy(priceOverride?: string) {
    if (!buying || !wallet) return;
    setBusy(true);
    try {
      await buyNft(buying.id, wallet, priceOverride);
      setSold(true);
      await load();
      toast.success("Purchase complete — NFT transferred to your wallet");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleOffer() {
    if (!offering || !wallet) return;
    setBusy(true);
    try {
      await makeOffer(offering.id, wallet.address, offerPrice);
      toast.success("Offer placed — the seller will review it");
      setOffering(null);
      setOfferPrice("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place offer");
    } finally {
      setBusy(false);
    }
  }

  function formatExpiry(l: SharedListing) {
    if (!l.expiresAt) return null;
    const ms = new Date(l.expiresAt).getTime() - Date.now();
    if (ms <= 0) return "expired";
    const h = Math.floor(ms / 3_600_000);
    if (h < 48) return `${h}h left`;
    return `${Math.floor(h / 24)}d left`;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-2">
          <BackButton label="Back to home" />
        </div>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Marketplace</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Browse NFTs listed by the community, priced in UCT. Make offers, buy instantly, or watch the latest sales.
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

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(
            [
              ["active", `For sale (${active.length})`],
              ["collections", "Collections"],
              ["sold", `Recently sold (${soldListings.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setCollectionFilter(null); }}
              className={
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                (tab === key
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Collection chips (only on collections tab) */}
        {tab === "collections" ? (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setCollectionFilter(null)}
              className={
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                (!collectionFilter
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground")
              }
            >
              All
            </button>
            {collections.map(([c, n]) => (
              <button
                key={c}
                onClick={() => setCollectionFilter(c)}
                className={
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                  (collectionFilter === c
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30")
                }
              >
                {c} · {n}
              </button>
            ))}
          </div>
        ) : null}

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
        ) : tab === "sold" ? (
          soldListings.length === 0 ? (
            <EmptyState icon={<Gem className="h-8 w-8" />} title="No sales yet" body="Completed trades will appear here with the buyer." />
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="divide-y divide-border">
                {soldListings.map((l) => (
                  <div key={l.id} className="flex items-center gap-4 p-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border">
                      <NftMedia nft={{ id: l.nftId, name: l.nft.name, description: l.nft.description, symbol: l.nft.symbol, imageType: l.nft.imageType as "generative" | "upload" | "ai", image: l.nft.image, artSeed: l.nft.artSeed, mintedAt: "", owner: "", txRef: "" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{l.nft.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.nft.collection || l.nft.symbol} · sold {l.soldAt ? new Date(l.soldAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm">{l.soldPrice || l.price} UCT</p>
                      <p className="text-xs text-muted-foreground">
                        bought by <span className="font-mono">{l.buyer?.slice(0, 8)}…</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : filteredActive.length === 0 ? (
          <EmptyState
            icon={<Gem className="h-8 w-8" />}
            title={query || collectionFilter ? "No matches" : "Nothing listed yet"}
            body={
              query || collectionFilter
                ? "Try a different search or collection."
                : "When someone lists an NFT from their collection, it shows up here."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredActive.map((listing) => (
              <div key={listing.id} className="card-glow overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.35)]">
                <div className="aspect-square overflow-hidden">
                  <NftMedia nft={{ id: listing.nftId, name: listing.nft.name, description: listing.nft.description, symbol: listing.nft.symbol, collection: listing.nft.collection, imageType: listing.nft.imageType as "generative" | "upload" | "ai", image: listing.nft.image, artSeed: listing.nft.artSeed, mintedAt: "", owner: "", txRef: "" }} />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-sm font-semibold">{listing.nft.name}</h3>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {listing.nft.collection || listing.nft.symbol}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {listing.price} UCT
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {listing.nft.description}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      {formatExpiry(listing) ?? "no expiry"} · by{" "}
                      <span className="font-mono">{listing.seller.slice(0, 8)}…</span>
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setOffering(listing); setOfferPrice(""); }}>
                        Offer
                      </Button>
                      <Button size="sm" onClick={() => { setSold(false); setBuying(listing); }}>
                        Buy <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Buy dialog */}
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
                      Paid: <span className="font-mono text-foreground">{buying.soldPrice || buying.price} UCT</span>
                    </p>
                    <p className="text-muted-foreground">
                      New balance: <span className="font-mono text-foreground">{wallet?.uctBalance ?? "—"} UCT</span>
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => { setBuying(null); setSold(false); }}>Done</Button>
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
                      Your balance: <span className="font-mono text-foreground">{wallet?.uctBalance ?? "—"} UCT</span>
                      {wallet?.kind === "guest" ? (
                        <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">guest</span>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setBuying(null)} disabled={busy}>Cancel</Button>
                  {wallet ? (
                    <Button onClick={() => handleBuy()} disabled={busy}>
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

      {/* Offer dialog */}
      <Dialog open={!!offering} onOpenChange={(o) => { if (!o) setOffering(null); }}>
        <DialogContent className="max-w-md">
          {offering ? (
            <>
              <DialogHeader>
                <DialogTitle>Make an offer</DialogTitle>
                <DialogDescription>
                  {offering.nft.name} — listed at {offering.price} UCT
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="offer-price" className="text-sm font-medium">Your offer (UCT)</label>
                  <Input
                    id="offer-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 20"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The seller will be notified and can accept or decline. If accepted, the NFT
                  transfers to you at your offered price.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setOffering(null)} disabled={busy}>Cancel</Button>
                  {wallet ? (
                    <Button onClick={handleOffer} disabled={busy || !offerPrice || Number(offerPrice) <= 0}>
                      {busy ? "Placing…" : "Place offer"}
                    </Button>
                  ) : (
                    <Button disabled>Connect a wallet to offer</Button>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
