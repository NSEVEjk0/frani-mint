"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History as HistoryIcon, PackagePlus, ShoppingBag, Tag, TimerOff } from "lucide-react";
import { Header } from "@/components/header";
import { BackButton } from "@/components/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  currentWallet,
  fetchListings,
  getActivity,
  type ActivityEvent,
  type SharedListing,
  type Wallet,
} from "@/lib/wallet";

interface HistoryItem {
  id: string;
  at: string;
  type: "mint" | "list" | "sale" | "purchase" | "offer" | "cancel";
  title: string;
  detail: string;
}

const TYPE_META: Record<HistoryItem["type"], { label: string; className: string }> = {
  mint: { label: "Minted", className: "bg-primary/10 text-primary" },
  list: { label: "Listed", className: "bg-sky-500/10 text-sky-400" },
  sale: { label: "Sold", className: "bg-emerald-500/10 text-emerald-400" },
  purchase: { label: "Bought", className: "bg-violet-500/10 text-violet-400" },
  offer: { label: "Offer", className: "bg-amber-500/10 text-amber-400" },
  cancel: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export default function HistoryPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [events, setEvents] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setWallet(currentWallet());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const local = getActivity();
      const items: HistoryItem[] = local.map((a: ActivityEvent) => ({
        id: a.id,
        at: a.at,
        type: a.type,
        title: a.title,
        detail: a.detail,
      }));

      if (wallet) {
        const all = await fetchListings();
        for (const l of all) {
          const mine = l.seller.toLowerCase() === wallet.address.toLowerCase();
          const bought = l.buyer?.toLowerCase() === wallet.address.toLowerCase();
          if (mine && l.status === "sold") {
            items.push({
              id: `sale_${l.id}`,
              at: l.soldAt ?? l.listedAt,
              type: "sale",
              title: `Sold ${l.nft.name}`,
              detail: `${l.soldPrice || l.price} UCT → ${l.buyer?.slice(0, 8)}…`,
            });
          } else if (bought && l.status === "sold") {
            items.push({
              id: `buy_${l.id}`,
              at: l.soldAt ?? l.listedAt,
              type: "purchase",
              title: `Bought ${l.nft.name}`,
              detail: `${l.soldPrice || l.price} UCT from ${l.seller.slice(0, 8)}…`,
            });
          } else if (mine && l.status === "active") {
            items.push({
              id: `list_${l.id}`,
              at: l.listedAt,
              type: "list",
              title: `Listed ${l.nft.name}`,
              detail: `${l.price} UCT${l.expiresAt ? ` · expires ${new Date(l.expiresAt).toLocaleDateString()}` : ""}`,
            });
          } else if (mine && l.status === "cancelled") {
            items.push({
              id: `cancel_${l.id}`,
              at: l.listedAt,
              type: "cancel",
              title: `Cancelled listing: ${l.nft.name}`,
              detail: `${l.price} UCT`,
            });
          }
        }
      }

      items.sort((a, b) => (a.at < b.at ? 1 : -1));
      setEvents(items);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet) void load();
    else {
      setEvents(getActivity().map((a) => ({ id: a.id, at: a.at, type: a.type, title: a.title, detail: a.detail })));
      setLoading(false);
    }
  }, [wallet, load]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) counts[e.type] = (counts[e.type] ?? 0) + 1;
    return counts;
  }, [events]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-2">
          <BackButton label="Back to home" />
        </div>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight">History</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your minting activity, listings, offers, and trades.
          </p>
        </div>

        {!loading && events.length > 0 ? (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Mints", summary.mint ?? 0],
              ["Listings", (summary.list ?? 0) + (summary.cancel ?? 0)],
              ["Sales", summary.sale ?? 0],
              ["Purchases", summary.purchase ?? 0],
            ].map(([label, n]) => (
              <div key={label} className="rounded-xl border bg-card p-4 text-center">
                <div className="font-display text-2xl font-semibold">{n}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon className="h-8 w-8" />}
            title="No activity yet"
            body="Mint an NFT, list it, or make a trade and it will show up here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="divide-y divide-border">
              {events.map((e) => {
                const meta = TYPE_META[e.type] ?? TYPE_META.mint;
                return (
                  <div key={e.id} className="flex items-start gap-4 px-5 py-4">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                      {e.type === "mint" ? <PackagePlus className="h-4 w-4" /> : e.type === "sale" || e.type === "purchase" ? <ShoppingBag className="h-4 w-4" /> : e.type === "cancel" ? <TimerOff className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{e.title}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(e.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
