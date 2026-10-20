"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { NftMedia } from "@/components/nft-card";
import { fetchListings, type SharedListing } from "@/lib/wallet";

/** "Fresh on the market" — the most recent shared listings, live. */
export function FreshMints() {
  const [listings, setListings] = useState<SharedListing[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchListings()
      .then((all) => setListings(all.filter((l) => l.status === "active").slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || listings.length === 0) return null;

  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <h2 className="display-serif text-4xl sm:text-5xl">Fresh on the market</h2>
            <p className="mt-3 text-muted-foreground">
              Recently listed by the community, live from the shared marketplace.
            </p>
          </div>
          <Link
            href="/market"
            className="hidden items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-foreground sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href="/market"
              className="card-glow group overflow-hidden rounded-lg border bg-card transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-square overflow-hidden">
                <NftMedia nft={{
                  id: listing.nftId,
                  name: listing.nft.name,
                  description: listing.nft.description,
                  symbol: listing.nft.symbol,
                  imageType: listing.nft.imageType as "generative" | "upload" | "ai",
                  image: listing.nft.image,
                  artSeed: listing.nft.artSeed,
                  mintedAt: "",
                  owner: "",
                  txRef: "",
                }} />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{listing.nft.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    by <span className="font-mono">{listing.seller.slice(0, 8)}…</span>
                  </p>
                </div>
                <span className="font-mono text-sm text-primary">{listing.price} UCT</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
