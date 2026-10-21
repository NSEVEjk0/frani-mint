"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PrivateKeyDialog({
  open,
  onOpenChange,
  onReveal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReveal: () => string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [key, setKey] = useState("");

  function handleReveal() {
    try {
      setKey(onReveal());
      setRevealed(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read the private key");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(key);
      toast.success("Private key copied to clipboard");
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setRevealed(false); setKey(""); } onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Private key
          </DialogTitle>
          <DialogDescription>
            Anyone with this key controls your wallet. Never share it.
          </DialogDescription>
        </DialogHeader>

        {!revealed ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
              Revealing your private key lets anyone import and control this wallet.
              Only do this on a device you trust.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleReveal} className="gap-2">
                <Eye className="h-4 w-4" /> Reveal private key
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-background/60 p-4">
              <p className="font-mono text-xs leading-relaxed break-all">{key}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setRevealed(false); setKey(""); }}>
                <EyeOff className="h-4 w-4" /> Hide
              </Button>
              <Button onClick={handleCopy}>Copy private key</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
