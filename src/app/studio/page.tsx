"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LayoutGrid, Plus, ShoppingBag, Tag } from "lucide-react";
import { Header } from "@/components/header";
import { BackButton } from "@/components/back-button";
import { MintWizard } from "@/components/mint-wizard";
import { NftCard, NftMedia } from "@/components/nft-card";
import { NftDetailDialog } from "@/components/nft-detail-dialog";
import { OffersPanel } from "@/components/offers-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import {
  connectGuestWallet,
  currentWallet,
  listNfts,
  listNftForSale,
  cancelListing,
  fetchListings,
  fetchOffers,
  respondToOffer,
  type Nft,
  type Offer,
  type SharedListing,
  type Wallet,
} from "@/lib/wallet";

export default function StudioPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [mintOpen, setMintOpen] = useState(false);
  const [listingNft, setListingNft] = useState<Nft | null>(null);
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("never");
  const [detailNft, setDetailNft] = useState<Nft | null>(null);

  useEffect(() => {
    setWallet(currentWallet());
    setNfts(listNfts());
  }, []);

  const owned = useMemo(
    () => nfts.filter((n) => wallet && n.owner.toLowerCase() === wallet.address.toLowerCase()),
    [nfts, wallet]
  );

  function handleMinted(nft: Nft) {
    setNfts((prev) => [nft, ...prev]);
    setMintOpen(false);
  }

  async function handleList() {
    if (!wallet || !listingNft) return;
    try {
      let expiresAt: string | undefined;
      if (duration !== "never") {
        const days = Number(duration);
        expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
      }
      await listNftForSale(listingNft.id, wallet.address, price, { expiresAt });
      toast.success("Listed for sale in the marketplace");
      setListingNft(null);
      setPrice("");
      setDuration("never");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not list");
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
            <h1 className="font-display text-3xl font-semibold tracking-tight">Studio</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Mint, collect, and manage your NFTs.
            </p>
          </div>
          <Button onClick={() => setMintOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Mint new NFT
          </Button>
        </div>

        {!wallet ? (
          <div className="rounded-xl border border-dashed p-16 text-center">
            <h2 className="font-display text-lg font-semibold">Connect your wallet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              You need a wallet to mint and hold NFTs. Connecting takes one click.
            </p>
            <Button className="mt-6" onClick={() => setWallet(connectGuestWallet())}>
              Connect wallet
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="collection">
            <TabsList>
              <TabsTrigger value="collection" className="gap-2">
                <LayoutGrid className="h-3.5 w-3.5" /> Collection ({owned.length})
              </TabsTrigger>
              <TabsTrigger value="listings" className="gap-2">
                <ShoppingBag className="h-3.5 w-3.5" /> My listings
              </TabsTrigger>
              <TabsTrigger value="offers" className="gap-2">
                <Tag className="h-3.5 w-3.5" /> Offers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collection" className="mt-6">
              {owned.length === 0 ? (
                <EmptyState
                  icon={<LayoutGrid className="h-8 w-8" />}
                  title="No NFTs yet"
                  body="Mint your first collectible to see it here."
                  action={<Button onClick={() => setMintOpen(true)}>Mint your first NFT</Button>}
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {owned.map((nft) => (
                    <div key={nft.id} className="cursor-pointer" onClick={() => setDetailNft(nft)}>
                      <NftCard
                        nft={nft}
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setListingNft(nft); }}
                          >
                            List
                          </Button>
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="listings" className="mt-6">
              <MyListings wallet={wallet} />
            </TabsContent>

            <TabsContent value="offers" className="mt-6">
              <OffersPanel wallet={wallet} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Dialog open={mintOpen} onOpenChange={setMintOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Mint a new NFT</DialogTitle>
            <DialogDescription>
              Four quick steps — details, image, review, mint.
            </DialogDescription>
          </DialogHeader>
          <MintWizard owner={wallet?.address ?? ""} onMinted={handleMinted} />
        </DialogContent>
      </Dialog>

      <NftDetailDialog
        nft={detailNft}
        open={!!detailNft}
        onOpenChange={(o) => { if (!o) setDetailNft(null); }}
        onList={(nft) => { setDetailNft(null); setListingNft(nft); }}
      />

      <Dialog open={!!listingNft} onOpenChange={(o) => { if (!o) setListingNft(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>List for sale</DialogTitle>
            <DialogDescription>
              {listingNft?.name} will be visible in the marketplace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (UCT)</Label>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 25"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Listing duration</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  ["never", "Until sold"],
                  ["1", "1 day"],
                  ["3", "3 days"],
                  ["7", "7 days"],
                  ["30", "30 days"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDuration(val)}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                      (duration === val
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setListingNft(null)}>
                Cancel
              </Button>
              <Button onClick={handleList} disabled={!price || Number(price) <= 0}>
                List NFT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MyListings({ wallet }: { wallet: Wallet }) {
  const [listings, setListings] = useState<SharedListing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOffer, setBusyOffer] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchListings();
      setListings(all.filter((l) => l.seller.toLowerCase() === wallet.address.toLowerCase()));
      const myOffers = await fetchOffers({ seller: wallet.address });
      setOffers(myOffers);
    } catch {
      setListings([]);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [wallet.address]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCancel(id: string) {
    try {
      await cancelListing(id, wallet.address);
      toast.success("Listing cancelled");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel");
    }
  }

  async function handleOfferResponse(offerId: string, action: "accept" | "reject") {
    setBusyOffer(offerId);
    try {
      await respondToOffer(offerId, action, wallet.address);
      toast.success(action === "accept" ? "Offer accepted — sale completed" : "Offer declined");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update offer");
    } finally {
      setBusyOffer(null);
    }
  }

  function expiryLabel(l: SharedListing) {
    if (!l.expiresAt) return "no expiry";
    const ms = new Date(l.expiresAt).getTime() - Date.now();
    if (ms <= 0) return "expired";
    const h = Math.floor(ms / 3_600_000);
    return h < 48 ? `${h}h left` : `${Math.floor(h / 24)}d left`;
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-8 w-8" />}
        title="No active listings"
        body="List an NFT from your collection to put it up for sale."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => {
        const listingOffers = offers.filter((o) => o.listingId === listing.id);
        return (
          <div key={listing.id} className="overflow-hidden rounded-xl border bg-card">
            <div className="aspect-square overflow-hidden">
              <NftMedia nft={{ id: listing.nftId, name: listing.nft.name, description: listing.nft.description, symbol: listing.nft.symbol, imageType: listing.nft.imageType as "generative" | "upload" | "ai", image: listing.nft.image, artSeed: listing.nft.artSeed, mintedAt: "", owner: "", txRef: "" }} />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{listing.nft.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {listing.status === "active" ? (
                      <>Listed for <span className="font-mono text-foreground">{listing.price} UCT</span> · {expiryLabel(listing)}</>
                    ) : listing.status === "sold" ? (
                      <>Sold to <span className="font-mono">{listing.buyer?.slice(0, 8)}…</span> for <span className="font-mono">{listing.soldPrice || listing.price} UCT</span></>
                    ) : (
                      "Cancelled"
                    )}
                  </p>
                </div>
                {listing.status === "active" ? (
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(listing.id)}>
                    Cancel
                  </Button>
                ) : null}
              </div>

              {listingOffers.length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Offers ({listingOffers.length})
                  </p>
                  {listingOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm">
                          <span className="font-mono font-medium">{offer.price} UCT</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          from <span className="font-mono">{offer.bidder.slice(0, 8)}…</span> · {new Date(offer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {offer.status === "pending" ? (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" disabled={busyOffer === offer.id} onClick={() => handleOfferResponse(offer.id, "reject")}>
                            Decline
                          </Button>
                          <Button size="sm" disabled={busyOffer === offer.id} onClick={() => handleOfferResponse(offer.id, "accept")}>
                            {busyOffer === offer.id ? "…" : "Accept"}
                          </Button>
                        </div>
                      ) : (
                        <span className={"text-[11px] font-medium " + (offer.status === "accepted" ? "text-emerald-400" : "text-muted-foreground")}>
                          {offer.status === "accepted" ? "accepted" : "declined"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
