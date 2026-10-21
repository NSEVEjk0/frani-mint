"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  fetchListings,
  fetchOffers,
  respondToOffer,
  type Offer,
  type SharedListing,
  type Wallet,
} from "@/lib/wallet";

export function OffersPanel({ wallet }: { wallet: Wallet }) {
  const [incoming, setIncoming] = useState<Array<Offer & { listing?: SharedListing }>>([]);
  const [outgoing, setOutgoing] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [myOffers, listings, myListings] = await Promise.all([
        fetchOffers({ bidder: wallet.address }),
        fetchListings(),
        fetchOffers({ seller: wallet.address }),
      ]);
      setOutgoing(myOffers);
      const listingById = new Map(listings.map((l) => [l.id, l]));
      setIncoming(
        myListings.map((o) => ({ ...o, listing: listingById.get(o.listingId) }))
      );
    } catch {
      setIncoming([]);
      setOutgoing([]);
    } finally {
      setLoading(false);
    }
  }, [wallet.address]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRespond(offerId: string, action: "accept" | "reject") {
    setBusy(offerId);
    try {
      await respondToOffer(offerId, action, wallet.address);
      toast.success(action === "accept" ? "Offer accepted — sale completed" : "Offer declined");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update offer");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const incomingPending = incoming.filter((o) => o.status === "pending");
  const outgoingPending = outgoing.filter((o) => o.status === "pending");
  const outgoingHistory = outgoing.filter((o) => o.status !== "pending");

  return (
    <div className="space-y-8">
      {/* Incoming — offers on my listings */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ArrowDownLeft className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">Incoming offers</h3>
          <Badge variant="secondary" className="font-mono">{incomingPending.length}</Badge>
        </div>
        {incoming.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-7 w-7" />}
            title="No offers on your listings"
            body="When someone makes an offer on one of your NFTs, it appears here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="divide-y divide-border">
              {incoming.map((offer) => (
                <div key={offer.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-mono font-semibold">{offer.price} UCT</span>
                      <span className="text-muted-foreground"> for </span>
                      <span className="font-medium">{offer.listing?.nft.name ?? "listing"}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      from <span className="font-mono">{offer.bidder.slice(0, 10)}…</span> ·{" "}
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {offer.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={busy === offer.id} onClick={() => handleRespond(offer.id, "reject")}>
                        Decline
                      </Button>
                      <Button size="sm" disabled={busy === offer.id} onClick={() => handleRespond(offer.id, "accept")}>
                        {busy === offer.id ? "…" : "Accept"}
                      </Button>
                    </div>
                  ) : (
                    <Badge variant={offer.status === "accepted" ? "success" : "secondary"}>
                      {offer.status === "accepted" ? "accepted" : "declined"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Outgoing — offers I made */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">My offers</h3>
          {outgoingPending.length > 0 ? (
            <Badge variant="secondary" className="font-mono">{outgoingPending.length} pending</Badge>
          ) : null}
        </div>
        {outgoing.length === 0 ? (
          <EmptyState
            icon={<ArrowUpRight className="h-7 w-7" />}
            title="You haven't made any offers"
            body="Go to the marketplace and make an offer on an NFT you like."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="divide-y divide-border">
              {outgoing.map((offer) => (
                <div key={offer.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-mono font-semibold">{offer.price} UCT</span>
                      <span className="text-muted-foreground"> on </span>
                      <span className="font-medium">{offer.listingId.slice(0, 10)}…</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      placed {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      offer.status === "accepted" ? "success" : offer.status === "pending" ? "warning" : "secondary"
                    }
                  >
                    {offer.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
