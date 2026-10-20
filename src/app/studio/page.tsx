"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LayoutGrid, Plus, ShoppingBag } from "lucide-react";
import { Header } from "@/components/header";
import { MintWizard } from "@/components/mint-wizard";
import { NftCard } from "@/components/nft-card";
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
  connectWallet,
  currentWallet,
  listNfts,
  listNftForSale,
  myListings,
  cancelListing,
  type Nft,
  type Wallet,
} from "@/lib/wallet";

export default function StudioPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [mintOpen, setMintOpen] = useState(false);
  const [listingNft, setListingNft] = useState<Nft | null>(null);
  const [price, setPrice] = useState("");

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

  function handleList() {
    if (!wallet || !listingNft) return;
    try {
      listNftForSale(listingNft.id, wallet.address, price);
      toast.success("Listed for sale in the marketplace");
      setListingNft(null);
      setPrice("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not list");
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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
            <Button className="mt-6" onClick={() => setWallet(connectWallet())}>
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
                    <NftCard
                      key={nft.id}
                      nft={nft}
                      action={
                        <Button variant="outline" size="sm" onClick={() => setListingNft(nft)}>
                          List
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="listings" className="mt-6">
              <MyListings wallet={wallet} />
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
  const [listings, setListings] = useState(() => myListings(wallet.address));

  function handleCancel(id: string) {
    try {
      cancelListing(id, wallet.address);
      setListings(myListings(wallet.address));
      toast.success("Listing cancelled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel");
    }
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
        const nft = listNfts().find((n) => n.id === listing.nftId);
        if (!nft) return null;
        return (
          <div key={listing.id} className="overflow-hidden rounded-xl border bg-card">
            <div className="aspect-square overflow-hidden">
              <NftCard nft={nft} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{nft.name}</p>
                <p className="text-xs text-muted-foreground">
                  {listing.status === "active" ? (
                    <>Listed for <span className="font-mono text-foreground">{listing.price} UCT</span></>
                  ) : listing.status === "sold" ? (
                    <>Sold to <span className="font-mono">{listing.buyer?.slice(0, 8)}…</span></>
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
          </div>
        );
      })}
    </div>
  );
}
