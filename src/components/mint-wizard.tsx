"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { NftMedia } from "@/components/nft-card";
import { mintNft, processImage, type Nft } from "@/lib/wallet";
import { HORDE_MODELS, submitHorde, waitForHorde } from "@/lib/aihorde";

const STEPS = ["Details", "Image", "Review", "Mint"];

export function MintWizard({ owner, onMinted }: { owner: string; onMinted: (nft: Nft) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [collection, setCollection] = useState("");
  const [count, setCount] = useState(1);
  const [imageType, setImageType] = useState<"generative" | "upload" | "ai">("generative");
  const [image, setImage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [minting, setMinting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [minted, setMinted] = useState<Nft | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // AI generation state
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>(HORDE_MODELS[0]);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string>("");

  const canNext = step === 0 ? name.trim().length > 0 : step === 1 ? imageType === "generative" || !!image : true;

  async function handleAiGenerate() {
    if (!prompt.trim()) {
      toast.error("Describe the image you want");
      return;
    }
    setGenerating(true);
    setGenStatus("Queuing your request…");
    try {
      const { id } = await submitHorde(prompt.trim(), model);
      const imageUrl = await waitForHorde(id, (status) => {
        if (status.queue != null) {
          setGenStatus(`In queue… position ${status.queue + 1}`);
        } else if (status.waiting != null) {
          setGenStatus("Generating your image…");
        }
      });
      setImage(imageUrl);
      setImageType("ai");
      setGenStatus("");
      toast.success("Image generated — review it and mint");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const handleFile = useCallback(async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    try {
      const dataUrl = await processImage(file);
      setImage(dataUrl);
      setImageType("upload");
    } catch {
      toast.error("Could not process that image");
    }
  }, []);

  function runMint() {
    setMinting(true);
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return p;
        }
        return p + 12;
      });
    }, 90);
    setTimeout(() => {
      clearInterval(timer);
      const copies = Math.min(25, Math.max(1, count));
      const mintedNfts: Nft[] = [];
      for (let i = 0; i < copies; i++) {
        const nft = mintNft({
          name: copies > 1 ? `${name.trim()} #${i + 1}` : name.trim(),
          description: description.trim(),
          symbol: symbol.trim() || "UCT-NFT",
          collection: collection.trim() || undefined,
          owner,
          imageType,
          image: imageType !== "generative" && image ? image : undefined,
        });
        mintedNfts.push(nft);
        onMinted(nft);
      }
      setMinted(mintedNfts[0]);
      setMinting(false);
      setProgress(100);
      toast.success(copies > 1 ? `Minted ${copies} NFTs` : "Minted — your NFT is on-chain");
    }, 1200);
  }

  if (minted) {
    return (
      <div className="animate-scale-in space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold">Minted</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {minted.name} is now owned by your wallet.
          </p>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground break-all">
            {minted.txRef}
          </p>
        </div>
        <div className="mx-auto aspect-square w-56 overflow-hidden rounded-xl border">
          <NftMedia nft={minted} />
        </div>
        <Button className="w-full" onClick={() => { setMinted(null); setStep(0); setName(""); setDescription(""); setSymbol(""); setImage(null); setImageType("generative"); setPrompt(""); }}>
          Mint another
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? <div className="h-px flex-1 bg-border" /> : null}
          </li>
        ))}
      </ol>

      {/* Step 0 — details */}
      {step === 0 ? (
        <div className="animate-fade-up space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nft-name">Name</Label>
            <Input
              id="nft-name"
              placeholder="e.g. Genesis Badge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nft-desc">Description</Label>
            <Textarea
              id="nft-desc"
              placeholder="What is this token?"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nft-symbol">Symbol</Label>
            <Input
              id="nft-symbol"
              placeholder="UCT-NFT"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              maxLength={12}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nft-collection">Collection</Label>
              <Input
                id="nft-collection"
                placeholder={symbol.trim() || "UCT-NFT"}
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nft-count">Copies</Label>
              <Input
                id="nft-count"
                type="number"
                min={1}
                max={25}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(25, Number(e.target.value) || 1)))}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 1 — image */}
      {step === 1 ? (
        <div className="animate-fade-up space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => { setImageType("generative"); setImage(null); }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all",
                imageType === "generative"
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/30"
              )}
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Generative</span>
              <span className="text-xs text-muted-foreground">
                Unique art generated from your metadata
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setImageType("ai"); }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all",
                imageType === "ai"
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/30"
              )}
            >
              <Wand2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">AI generate</span>
              <span className="text-xs text-muted-foreground">
                Describe an image, free via AI Horde
              </span>
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all",
                imageType === "upload"
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/30"
              )}
            >
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Upload image</span>
              <span className="text-xs text-muted-foreground">PNG / JPG, up to 1024px</span>
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {/* Copies > 1: clarify image behavior */}
          {count > 1 ? (
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              {imageType === "generative" ? (
                <>Each of the {count} copies gets <span className="font-medium text-foreground">unique generative art</span>.</>
              ) : (
                <>
                  All {count} copies will <span className="font-medium text-foreground">share this image</span>.{" "}
                  <button
                    type="button"
                    onClick={() => { setImageType("generative"); setImage(null); }}
                    className="font-medium text-primary underline underline-offset-2 hover:text-foreground"
                  >
                    Use unique generative art instead
                  </button>
                </>
              )}
            </div>
          ) : null}

          {imageType === "ai" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Describe the image</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="e.g. a glowing neon badge on a dark background, studio lighting, futuristic"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={generating}
                />
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ai-model">Model</Label>
                  <select
                    id="ai-model"
                    className="flex h-10 w-full min-w-[220px] rounded-md border border-input bg-background/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={generating}
                  >
                    {HORDE_MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleAiGenerate} disabled={generating || !prompt.trim()} className="gap-2">
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {generating ? "Generating…" : "Generate image"}
                </Button>
              </div>
              {generating ? (
                <div className="flex items-center gap-3 rounded-lg border bg-background/40 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">{genStatus || "Working…"}</span>
                </div>
              ) : null}
              {image && imageType === "ai" ? (
                <div className="relative overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="AI preview" className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImage(null); setPrompt(""); }}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition-colors hover:bg-black"
                    aria-label="Discard image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : imageType === "upload" ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              {image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImage(null); setImageType("generative"); }}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition-colors hover:bg-black"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Drop an image here or click to browse</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border">
              <div className="h-full w-full opacity-90">
                <NftMedia nft={{ id: "preview", name: name || "Preview", description, symbol: symbol || "UCT-NFT", imageType: "generative", artSeed: (name || "x").length * 7919 + 7, mintedAt: "", owner: "", txRef: "" }} />
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Step 2 — review */}
      {step === 2 ? (
        <div className="animate-fade-up space-y-4">
          <div className="flex gap-4">
            <div className="aspect-square w-28 shrink-0 overflow-hidden rounded-lg border">
              <NftMedia nft={{ id: "review", name, description, symbol: symbol || "UCT-NFT", imageType, image: image ?? undefined, artSeed: imageType === "generative" ? 424242 : undefined, mintedAt: "", owner: "", txRef: "" }} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <h4 className="font-display text-base font-semibold">{name}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{symbol || "UCT-NFT"}</Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  {imageType === "upload" ? "Uploaded image" : imageType === "ai" ? "AI generated" : "Generative art"}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description || "No description."}
              </p>
              <p className="pt-1 text-xs text-muted-foreground">
                {count > 1 ? (
                  <>
                    <span className="font-medium text-foreground">{count} copies</span>
                    {imageType === "generative" ? " · each with unique art" : " · sharing this image"}
                  </>
                ) : (
                  <>Minted to <span className="font-mono">{owner.slice(0, 10)}…{owner.slice(-4)}</span></>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 3 — minting */}
      {step === 3 ? (
        <div className="animate-fade-up space-y-5 py-4">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium">Minting on Unicity…</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Signing the transaction and writing your asset
            </p>
          </div>
          <Progress value={progress} className="h-1.5" />
          <p className="text-center font-mono text-xs text-muted-foreground">{progress}%</p>
        </div>
      ) : null}

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || minting}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 3 ? (
          <Button size="sm" disabled={!canNext || minting} onClick={() => setStep((s) => s + 1)}>
            {step === 2 ? "Mint" : "Continue"} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={runMint} disabled={minting}>
            {minting ? "Minting…" : "Confirm mint"}
          </Button>
        )}
      </div>
    </div>
  );
}
