"use client";

import { toast } from "sonner";
import { Download, Link2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NftMedia } from "@/components/nft-card";
import type { Nft } from "@/lib/wallet";

export function NftDetailDialog({
  nft,
  open,
  onOpenChange,
  onList,
}: {
  nft: Nft | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onList?: (nft: Nft) => void;
}) {
  if (!nft) return null;
  const item = nft;

  function downloadImage() {
    if (!item.image) {
      toast.info("This NFT has generative art — nothing to download as a file.");
      return;
    }
    const a = document.createElement("a");
    a.href = item.image;
    a.download = `${item.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.jpg`;
    a.click();
    toast.success("Image downloaded");
  }

  async function copyLink() {
    const url = `${window.location.origin}/studio?nft=${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="grid gap-6 sm:grid-cols-[1fr_1.1fr]">
          <div className="aspect-square overflow-hidden rounded-lg border">
            <NftMedia nft={nft} />
          </div>
          <div className="flex flex-col min-w-0">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{nft.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">{nft.symbol}</Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {nft.imageType === "upload" ? "Uploaded image" : nft.imageType === "ai" ? "AI generated" : "Generative art"}
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {nft.description || "No description."}
            </p>
            <Separator className="my-4" />
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="font-mono break-all text-right">{nft.owner}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Minted</dt>
                <dd>{new Date(nft.mintedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Transaction</dt>
                <dd className="font-mono break-all text-right">{nft.txRef.slice(0, 18)}…{nft.txRef.slice(-6)}</dd>
              </div>
            </dl>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              {onList ? (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onList(nft)}>
                  <Tag className="h-3.5 w-3.5" /> List for sale
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={downloadImage}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={copyLink}>
                <Link2 className="h-3.5 w-3.5" /> Share
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
