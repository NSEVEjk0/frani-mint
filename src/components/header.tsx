"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Wallet as WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MintWordmark } from "@/components/logo";
import {
  connectWallet,
  connectGuestWallet,
  connectWalletViaSphereConnect,
  currentWallet,
  disconnectWallet,
  refreshBalance,
  restoreWallet,
  type Wallet,
} from "@/lib/wallet";
import { detectWalletTransport } from "@/lib/sphere-connect";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/studio", label: "Studio" },
  { href: "/market", label: "Marketplace" },
  { href: "/history", label: "History" },
];

export function Header() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "create" | "import" | "mnemonic">("choose");
  const [mnemonic, setMnemonic] = useState("");
  const [busy, setBusy] = useState(false);
  const [freshMnemonic, setFreshMnemonic] = useState("");
  const [walletDetected, setWalletDetected] = useState<{ available: boolean; reason?: string } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const cached = currentWallet();
    if (cached) {
      setWallet(cached);
      if (cached.kind === "unicity") {
        restoreWallet()
          .then((w) => {
            if (w) setWallet(w);
          })
          .catch(() => {});
      }
    }
  }, []);

  async function handleConnect(mnemonicInput?: string) {
    setBusy(true);
    try {
      const w = await connectWallet(mnemonicInput ? { mnemonic: mnemonicInput } : undefined);
      setWallet(w);
      setMnemonic("");
      if (w.generatedMnemonic) {
        // Keep the dialog open to show the recovery phrase once.
        setFreshMnemonic(w.generatedMnemonic);
        setMode("mnemonic");
      } else {
        setConnectOpen(false);
        setMode("choose");
        toast.success("Wallet connected");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect wallet");
    } finally {
      setBusy(false);
    }
  }

  function handleGuest() {
    setWallet(connectGuestWallet());
    setConnectOpen(false);
    setMode("choose");
    toast.info("Connected as guest — preview only");
  }

  async function handleConnectExisting() {
    setBusy(true);
    try {
      const w = await connectWalletViaSphereConnect();
      setWallet(w);
      setConnectOpen(false);
      setMode("choose");
      toast.success(`Connected ${w.nametag} via Unicity wallet`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect wallet");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    await disconnectWallet();
    setWallet(null);
  }

  async function handleRefresh() {
    if (!wallet) return;
    try {
      const updated = await refreshBalance(wallet);
      setWallet(updated);
      if (updated.uctBalance === null) {
        toast.error("Still offline — balance unavailable");
      } else {
        toast.success(`Balance refreshed: ${updated.uctBalance} UCT`);
      }
    } catch {
      toast.error("Could not refresh balance");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/50 glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-foreground">
            <MintWordmark />
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {wallet ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 rounded-full pl-1.5 pr-3">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                      {wallet.nametag.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[90px] truncate text-xs font-medium">{wallet.nametag}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {wallet.uctBalance ?? "—"} UCT
                  </span>
                  {wallet.kind === "guest" ? (
                    <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
                      guest
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {wallet.kind === "unicity" ? "UNICITY WALLET" : "GUEST PREVIEW"}
                </DropdownMenuLabel>
                <div className="px-2 pb-2 font-mono text-[11px] text-muted-foreground break-all">
                  {wallet.address}
                </div>
                {wallet.kind === "unicity" ? (
                  <DropdownMenuItem onClick={handleRefresh}>Refresh balance</DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnect}>Disconnect</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="h-9 gap-2 rounded-full" onClick={() => setConnectOpen(true)}>
              <WalletIcon className="h-4 w-4" />
              Connect wallet
            </Button>
          )}
        </div>
      </header>

      <Dialog open={connectOpen} onOpenChange={(o) => { if (!o) { setConnectOpen(false); setMode("choose"); setMnemonic(""); } }}>
        <DialogContent className="max-w-md">
          {mode === "choose" ? (
            <>
              <DialogHeader>
                <DialogTitle>Connect a wallet</DialogTitle>
                <DialogDescription>
                  Connect your existing Unicity wallet, or create a new one here.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-1">
                {/* Connect existing Unicity wallet (native Sphere Connect) */}
                <Button
                  className="w-full justify-start"
                  onClick={() => { setWalletDetected(detectWalletTransport()); void handleConnectExisting(); }}
                  disabled={busy}
                >
                  <WalletIcon className="h-4 w-4" />
                  {busy ? "Waiting for wallet…" : "Connect existing Unicity wallet"}
                </Button>
                {walletDetected && !walletDetected.available ? (
                  <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    {walletDetected.reason}
                  </p>
                ) : null}

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full justify-start" onClick={() => setMode("create")} disabled={busy}>
                  Create a new Unicity wallet
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setMode("import")} disabled={busy}>
                  Import an existing mnemonic
                </Button>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleGuest} disabled={busy}>
                  Continue as guest (preview)
                </Button>
              </div>
            </>
          ) : mode === "create" ? (
            <>
              <DialogHeader>
                <DialogTitle>Create a wallet</DialogTitle>
                <DialogDescription>
                  We&apos;ll generate a fresh 12-word mnemonic. You&apos;ll see it
                  once — save it somewhere safe.
                </DialogDescription>
              </DialogHeader>
              <Button className="w-full" onClick={() => handleConnect()} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Creating wallet…" : "Generate wallet"}
              </Button>
            </>
          ) : mode === "import" ? (
            <>
              <DialogHeader>
                <DialogTitle>Import wallet</DialogTitle>
                <DialogDescription>
                  Enter your 12 or 24-word mnemonic.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="mnemonic">Mnemonic</Label>
                  <Input
                    id="mnemonic"
                    placeholder="word word word …"
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <Button className="w-full" onClick={() => handleConnect(mnemonic)} disabled={busy || !mnemonic.trim()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? "Importing…" : "Import wallet"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Save your recovery phrase</DialogTitle>
                <DialogDescription>
                  This is the only time it&apos;s shown. Write it down — anyone
                  with these words controls this wallet.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border bg-background/60 p-4">
                <p className="font-mono text-sm leading-relaxed break-words">{freshMnemonic}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setConnectOpen(false); setMode("choose"); setFreshMnemonic(""); }}>
                  I saved it
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
