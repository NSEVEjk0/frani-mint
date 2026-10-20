"use client";

import { ImageIcon, Sparkles } from "lucide-react";
import type { Nft } from "@/lib/wallet";
import { Badge } from "@/components/ui/badge";
import { NftArt } from "@/components/nft-art";

export function NftMedia({ nft, className }: { nft: Nft; className?: string }) {
  if (nft.imageType !== "generative" && nft.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={nft.image}
        alt={nft.name}
        className={className ?? "h-full w-full object-cover"}
        loading="lazy"
      />
    );
  }
  return <NftArt seed={nft.artSeed ?? 0} className={className} />;
}

export function NftCard({
  nft,
  action,
}: {
  nft: Nft;
  action?: React.ReactNode;
}) {
  return (
    <div className="group card-glow overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.35)]">
      <div className="relative aspect-square overflow-hidden">
        <NftMedia nft={nft} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="glass gap-1 border-border/60 text-[10px]">
            {nft.imageType === "upload" ? (
              <ImageIcon className="h-3 w-3" />
            ) : nft.imageType === "ai" ? (
              <Sparkles className="h-3 w-3" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {nft.imageType === "upload" ? "Image" : nft.imageType === "ai" ? "AI" : "Generative"}
          </Badge>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold leading-tight">{nft.name}</h3>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{nft.symbol}</p>
          </div>
          {action}
        </div>
        {nft.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {nft.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
