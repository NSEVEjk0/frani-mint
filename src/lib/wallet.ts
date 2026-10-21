/**
 * Frani Mint — wallet session, asset store, and marketplace.
 *
 * The wallet layer now delegates to the real Unicity Sphere SDK
 * (src/lib/unicity-wallet.ts). A lightweight "guest" fallback exists for
 * preview/demo use and is always labeled as such.
 */

import {
  connectUnicityWallet,
  disconnectUnicityWallet,
  loadUnicityWallet,
  refreshUctBalance,
  sendUct,
  type UnicityWallet,
} from "@/lib/unicity-wallet";
import { connectExistingWallet, type SphereConnectSession } from "@/lib/sphere-connect";

export interface Nft {
  id: string;
  name: string;
  description: string;
  symbol: string;
  /** Collection name (defaults to symbol). */
  collection?: string;
  /** "generative" = auto art; "upload" = user image; "ai" = AI Horde image. */
  imageType: "generative" | "upload" | "ai";
  image?: string;
  artSeed?: number;
  mintedAt: string;
  owner: string;
  txRef: string;
}

export interface Listing {
  id: string;
  nftId: string;
  seller: string;
  price: string; // whole UCT
  listedAt: string;
  status: "active" | "sold" | "cancelled";
  buyer?: string;
  soldAt?: string;
  /** ISO expiry; undefined = stays until sold/cancelled. */
  expiresAt?: string;
  /** Actual sale price (when sold via an accepted offer). */
  soldPrice?: string;
}

export interface ActivityEvent {
  id: string;
  type: "mint" | "list" | "sale" | "purchase" | "offer" | "cancel";
  at: string;
  title: string;
  detail: string;
  meta?: Record<string, unknown>;
}

export interface Wallet {
  address: string;
  nametag: string;
  connectedAt: string;
  /** null = network sync unavailable (wallet connected, balance unknown). */
  uctBalance: string | null;
  kind: "unicity" | "connect" | "guest";
  /** Present only when this wallet was just created (show once). */
  generatedMnemonic?: string;
  /** Transport used for a Sphere Connect session (extension/iframe/popup). */
  connectTransport?: string;
}

const WALLET_KEY = "frani-mint:wallet";
const NFTS_KEY = "frani-mint:nfts";
const LISTINGS_KEY = "frani-mint:listings";
const ACTIVITY_KEY = "frani-mint:activity";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function randomHex(len: number): string {
  return Array.from({ length: len }, () =>
    "0123456789abcdef"[Math.floor(Math.random() * 16)]
  ).join("");
}

function randomAddress(): string {
  return `0x${randomHex(40)}`;
}

function toSessionWallet(u: UnicityWallet): Wallet {
  return {
    address: u.address,
    nametag: u.nametag,
    connectedAt: new Date().toISOString(),
    uctBalance: u.uctBalance,
    kind: "unicity",
  };
}

/* ------------------------------ wallet ------------------------------ */

/** Connect a real Unicity wallet (create or restore). Throws on failure. */
export async function connectWallet(input?: { mnemonic?: string }): Promise<Wallet> {
  const u = await connectUnicityWallet(input);
  const session = toSessionWallet(u);
  if (u.generatedMnemonic) session.generatedMnemonic = u.generatedMnemonic;
  write(WALLET_KEY, session);
  return session;
}

/** Restore the persisted session (real wallet) without network init. */
export function currentWallet(): Wallet | null {
  return read<Wallet | null>(WALLET_KEY, null);
}

/** Load the real wallet from the SDK's storage (IndexedDB) if it exists. */
export async function restoreWallet(): Promise<Wallet | null> {
  const u = await loadUnicityWallet();
  if (!u) return null;
  const session = toSessionWallet(u);
  write(WALLET_KEY, session);
  return session;
}

/** Guest preview wallet (clearly labeled) — used when real connect fails/declined. */
export function connectGuestWallet(): Wallet {
  const wallet: Wallet = {
    address: randomAddress(),
    nametag: `guest_${Math.floor(Math.random() * 900 + 100)}`,
    connectedAt: new Date().toISOString(),
    uctBalance: "1000",
    kind: "guest",
  };
  write(WALLET_KEY, wallet);
  return wallet;
}

/** Connect the user's EXISTING Unicity wallet via Sphere Connect. */
export async function connectWalletViaSphereConnect(): Promise<Wallet> {
  const session: SphereConnectSession = await connectExistingWallet();
  const wallet: Wallet = {
    address: session.address,
    nametag: session.nametag,
    connectedAt: new Date().toISOString(),
    uctBalance: null, // balance comes from the wallet's own UI/approval
    kind: "connect",
    connectTransport: session.transport,
  };
  write(WALLET_KEY, wallet);
  return wallet;
}

export async function disconnectWallet() {
  try {
    window.localStorage.removeItem(WALLET_KEY);
  } catch {
    /* ignore */
  }
  await disconnectUnicityWallet();
}

/** Refresh the real UCT balance and update the session. */
export async function refreshBalance(wallet: Wallet): Promise<Wallet> {
  if (wallet.kind !== "unicity") return wallet;
  try {
    const balance = await refreshUctBalance();
    const updated: Wallet = { ...wallet, uctBalance: balance };
    write(WALLET_KEY, updated);
    return updated;
  } catch {
    return wallet;
  }
}

/* ------------------------------ NFTs ------------------------------ */

export function listNfts(): Nft[] {
  return read<Nft[]>(NFTS_KEY, []);
}

export function getNft(id: string): Nft | null {
  return listNfts().find((n) => n.id === id) ?? null;
}

export function mintNft(input: {
  name: string;
  description: string;
  symbol: string;
  collection?: string;
  owner: string;
  imageType: "generative" | "upload" | "ai";
  image?: string;
}): Nft {
  const nfts = listNfts();
  const nft: Nft = {
    id: `nft_${Date.now().toString(36)}_${randomHex(6)}`,
    name: input.name,
    description: input.description,
    symbol: input.symbol || "UCT-NFT",
    collection: input.collection?.trim() || input.symbol || "UCT-NFT",
    imageType: input.imageType,
    image: input.imageType !== "generative" ? input.image : undefined,
    artSeed: input.imageType === "generative" ? Math.floor(Math.random() * 1e9) : undefined,
    mintedAt: new Date().toISOString(),
    owner: input.owner,
    txRef: `0x${randomHex(64)}`,
  };
  nfts.unshift(nft);
  write(NFTS_KEY, nfts);
  logActivity({
    type: "mint",
    title: `Minted ${nft.name}`,
    detail: `${nft.symbol} · ${nft.collection}`,
    meta: { nftId: nft.id },
  });
  return nft;
}

/* ------------------------------ activity log ------------------------------ */

export function logActivity(ev: Omit<ActivityEvent, "id" | "at">) {
  const events = read<ActivityEvent[]>(ACTIVITY_KEY, []);
  events.unshift({
    ...ev,
    id: `act_${Date.now().toString(36)}_${randomHex(4)}`,
    at: new Date().toISOString(),
  });
  write(ACTIVITY_KEY, events.slice(0, 200));
}

export function getActivity(): ActivityEvent[] {
  return read<ActivityEvent[]>(ACTIVITY_KEY, []);
}

export function transferNft(nftId: string, to: string) {
  const nfts = listNfts();
  const nft = nfts.find((n) => n.id === nftId);
  if (!nft) throw new Error("NFT not found");
  nft.owner = to;
  write(NFTS_KEY, nfts);
}

/* ------------------------------ marketplace (shared) ------------------------------ */

/**
 * Listings are stored server-side in a shared Turso database so every user
 * sees the same marketplace. The client keeps a small local cache for
 * instant UI, but the source of truth is the API.
 */

export interface SharedListing extends Listing {
  nft: {
    name: string;
    description: string;
    symbol: string;
    collection?: string;
    imageType: string;
    image?: string;
    artSeed?: number;
  };
}

export interface Offer {
  id: string;
  listingId: string;
  bidder: string;
  price: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  listing?: SharedListing;
}

const LISTINGS_CACHE_KEY = "frani-mint:listings-cache";

export async function fetchListings(): Promise<SharedListing[]> {
  const res = await fetch("/api/listings", { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not load listings");
  }
  const data = await res.json();
  const listings = (data.listings ?? []) as SharedListing[];
  try {
    window.localStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify(listings));
  } catch {
    /* ignore */
  }
  return listings;
}

export function cachedListings(): SharedListing[] {
  return read<SharedListing[]>(LISTINGS_CACHE_KEY, []);
}

export async function listNftForSale(
  nftId: string,
  seller: string,
  price: string,
  options?: { expiresAt?: string }
): Promise<SharedListing> {
  const nft = getNft(nftId);
  if (!nft) throw new Error("NFT not found");
  if (nft.owner.toLowerCase() !== seller.toLowerCase()) throw new Error("You don't own this NFT");
  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) throw new Error("Price must be a positive number");

  const listing: SharedListing = {
    id: `lst_${Date.now().toString(36)}_${randomHex(6)}`,
    nftId,
    seller,
    price: String(p),
    listedAt: new Date().toISOString(),
    status: "active",
    expiresAt: options?.expiresAt,
    nft: {
      name: nft.name,
      description: nft.description,
      symbol: nft.symbol,
      collection: nft.collection,
      imageType: nft.imageType,
      image: nft.image,
      artSeed: nft.artSeed,
    },
  };

  const res = await fetch("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(listing),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not create listing");
  }
  logActivity({
    type: "list",
    title: `Listed ${nft.name}`,
    detail: `${listing.price} UCT`,
    meta: { listingId: listing.id },
  });
  return listing;
}

export function isListingExpired(listing: SharedListing, now = Date.now()): boolean {
  return !!listing.expiresAt && new Date(listing.expiresAt).getTime() <= now;
}

/* ------------------------------ offers ------------------------------ */

export async function makeOffer(listingId: string, bidder: string, price: string): Promise<Offer> {
  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) throw new Error("Offer must be a positive number");
  const res = await fetch("/api/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, bidder, price: String(p) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not place offer");
  }
  const offer = (await res.json()).offer as Offer;
  logActivity({
    type: "offer",
    title: `Offered ${offer.price} UCT`,
    detail: `on listing ${listingId.slice(0, 8)}…`,
    meta: { listingId, offerId: offer.id },
  });
  return offer;
}

export async function fetchOffers(params?: {
  listingId?: string;
  seller?: string;
  bidder?: string;
}): Promise<Offer[]> {
  const q = new URLSearchParams();
  if (params?.listingId) q.set("listing", params.listingId);
  if (params?.seller) q.set("seller", params.seller);
  if (params?.bidder) q.set("bidder", params.bidder);
  const res = await fetch(`/api/offers?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not load offers");
  }
  return (await res.json()).offers ?? [];
}

export async function respondToOffer(
  offerId: string,
  action: "accept" | "reject",
  by: string
): Promise<void> {
  const res = await fetch(`/api/offers/${encodeURIComponent(offerId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, by }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not update offer");
  }
}

export async function cancelListing(listingId: string, by: string) {
  const res = await fetch(`/api/listings/${encodeURIComponent(listingId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel", by }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not cancel listing");
  }
}

export async function completeSale(listingId: string, buyer: string, soldPrice?: string) {
  const res = await fetch(`/api/listings/${encodeURIComponent(listingId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buyer, soldPrice }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not complete purchase");
  }
}

/**
 * Buy an NFT. With a real Unicity wallet this performs a real UCT transfer to
 * the seller's address; with a guest wallet it simulates the exchange. The
 * sale is then recorded in the shared marketplace.
 */
export async function buyNft(
  listingId: string,
  wallet: Wallet,
  priceOverride?: string
): Promise<SharedListing> {
  const listings = await fetchListings();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.status !== "active") throw new Error("Listing is not active");
  if (listing.seller.toLowerCase() === wallet.address.toLowerCase()) {
    throw new Error("You can't buy your own listing");
  }

  if (wallet.kind === "unicity" && wallet.uctBalance === null) {
    throw new Error("Your wallet is offline — balance unavailable. Please try again later.");
  }

  const price = BigInt(priceOverride ?? listing.price);
  const balance = BigInt(wallet.uctBalance ?? "0");
  if (balance < price) {
    throw new Error(
      `Insufficient UCT — you have ${wallet.uctBalance}, this costs ${listing.price}`
    );
  }

  const priceStr = price.toString();
  if (wallet.kind === "unicity") {
    // Real transfer to the seller's DIRECT address.
    await sendUct(listing.seller, priceStr, `Frani Mint: ${listing.nft.name}`);
    const fresh = await refreshBalance(wallet);
    wallet.uctBalance = fresh.uctBalance;
  } else {
    wallet.uctBalance = (balance - price).toString();
  }

  // Record the sale in the shared marketplace.
  await completeSale(listingId, wallet.address, priceStr);

  // Local NFT ownership transfer (preview store).
  transferNft(listing.nftId, wallet.address);
  write(WALLET_KEY, wallet);

  logActivity({
    type: "purchase",
    title: `Bought ${listing.nft.name}`,
    detail: `${priceStr} UCT`,
    meta: { listingId, nftId: listing.nftId },
  });

  return {
    ...listing,
    status: "sold",
    buyer: wallet.address,
    soldAt: new Date().toISOString(),
    soldPrice: priceStr,
  };
}

/** Downscale an uploaded image to a max dimension and return a data URL. */
export function processImage(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Not a valid image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
