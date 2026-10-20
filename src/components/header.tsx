"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Wallet as WalletIcon } from "lucide-react";
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
import { connectWallet, currentWallet, disconnectWallet, type Wallet } from "@/lib/wallet";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/studio", label: "Studio" },
  { href: "/market", label: "Marketplace" },
];

export function Header() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setWallet(currentWallet());
  }, []);

  function handleConnect() {
    setWallet(connectWallet());
  }

  function handleDisconnect() {
    disconnectWallet();
    setWallet(null);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            Frani <span className="text-gradient">Mint</span>
          </span>
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
                  <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">
                    {wallet.nametag.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[90px] truncate text-xs font-medium">{wallet.nametag}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {wallet.uctBalance} UCT
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                CONNECTED WALLET
              </DropdownMenuLabel>
              <div className="px-2 pb-2 font-mono text-[11px] text-muted-foreground break-all">
                {wallet.address}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDisconnect}>Disconnect</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" className="h-9 gap-2 rounded-full" onClick={handleConnect}>
            <WalletIcon className="h-4 w-4" />
            Connect wallet
          </Button>
        )}
      </div>
    </header>
  );
}
