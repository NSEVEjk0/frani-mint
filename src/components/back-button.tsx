"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * BackButton — returns to the previous screen when there is history,
 * otherwise falls back to home. Label is customizable.
 */
export function BackButton({ href = "/", label = "Back" }: { href?: string; label?: string }) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(href);
    }
  }

  return (
    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleClick}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
