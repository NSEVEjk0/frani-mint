/**
 * Frani Mint — wallet, asset store, and marketplace (preview mode).
 *
 * Everything lives in localStorage, shaped like the Sphere SDK's model so a
 * real Unicity wallet-api connection can replace it without touching the UI.
 */

export interface Nft {
  id: string;
  name: string;
  description: string;
  symbol: string;
  /** "generative" = auto art; "upload" = user image; "ai" = AI Horde image. */
  imageType: "generative" | "upload" | "ai";
  /** Data URL for uploads; art seed for generative. */
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
  price: string; // whole UCT, string to avoid float issues
  listedAt: string;
  status: "active" | "sold" | "cancelled";
  buyer?: string;
  soldAt?: string;
}

export interface Wallet {
  address: string;
  nametag: string;
  connectedAt: string;
  /** Simulated UCT balance (whole units) for marketplace purchases. */
  uctBalance: string;
}

const WALLET_KEY = "frani-mint:wallet";
const NFTS_KEY = "frani-mint:nfts";
const LISTINGS_KEY = "frani-mint:listings";

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

/* ------------------------------ wallet ------------------------------ */

export function connectWallet(): Wallet {
  const existing = read<Wallet | null>(WALLET_KEY, null);
  if (existing) return existing;
  const wallet: Wallet = {
    address: randomAddress(),
    nametag: `guest_${Math.floor(Math.random() * 900 + 100)}`,
    connectedAt: new Date().toISOString(),
    uctBalance: "1000",
  };
  write(WALLET_KEY, wallet);
  return wallet;
}

export function currentWallet(): Wallet | null {
  return read<Wallet | null>(WALLET_KEY, null);
}

export function disconnectWallet() {
  try {
    window.localStorage.removeItem(WALLET_KEY);
  } catch {
    /* ignore */
  }
}

export function updateWalletBalance(address: string, delta: bigint) {
  const wallet = currentWallet();
  if (!wallet || wallet.address.toLowerCase() !== address.toLowerCase()) return;
  wallet.uctBalance = (BigInt(wallet.uctBalance) + delta).toString();
  write(WALLET_KEY, wallet);
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
    imageType: input.imageType,
    image: input.imageType !== "generative" ? input.image : undefined,
    artSeed: input.imageType === "generative" ? Math.floor(Math.random() * 1e9) : undefined,
    mintedAt: new Date().toISOString(),
    owner: input.owner,
    txRef: `0x${randomHex(64)}`,
  };
  nfts.unshift(nft);
  write(NFTS_KEY, nfts);
  return nft;
}

export function transferNft(nftId: string, to: string) {
  const nfts = listNfts();
  const nft = nfts.find((n) => n.id === nftId);
  if (!nft) throw new Error("NFT not found");
  nft.owner = to;
  write(NFTS_KEY, nfts);
}

/* ------------------------------ marketplace ------------------------------ */

export function listListings(): Listing[] {
  return read<Listing[]>(LISTINGS_KEY, []);
}

export function activeListings(): Listing[] {
  return listListings().filter((l) => l.status === "active");
}

export function myListings(address: string): Listing[] {
  return listListings().filter((l) => l.seller.toLowerCase() === address.toLowerCase());
}

export function listNftForSale(nftId: string, seller: string, price: string): Listing {
  const nft = getNft(nftId);
  if (!nft) throw new Error("NFT not found");
  if (nft.owner.toLowerCase() !== seller.toLowerCase()) throw new Error("You don't own this NFT");
  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) throw new Error("Price must be a positive number");
  const listings = listListings();
  if (listings.some((l) => l.nftId === nftId && l.status === "active")) {
    throw new Error("This NFT is already listed");
  }
  const listing: Listing = {
    id: `lst_${Date.now().toString(36)}_${randomHex(6)}`,
    nftId,
    seller,
    price: String(p),
    listedAt: new Date().toISOString(),
    status: "active",
  };
  listings.unshift(listing);
  write(LISTINGS_KEY, listings);
  return listing;
}

export function cancelListing(listingId: string, by: string) {
  const listings = listListings();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.status !== "active") throw new Error("Listing is not active");
  if (listing.seller.toLowerCase() !== by.toLowerCase()) throw new Error("Only the seller can cancel");
  listing.status = "cancelled";
  write(LISTINGS_KEY, listings);
}

export function buyNft(listingId: string, buyer: string): Listing {
  const listings = listListings();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.status !== "active") throw new Error("Listing is not active");
  if (listing.seller.toLowerCase() === buyer.toLowerCase()) throw new Error("You can't buy your own listing");
  const wallet = currentWallet();
  if (!wallet) throw new Error("Connect a wallet to buy");
  const price = BigInt(listing.price);
  if (BigInt(wallet.uctBalance) < price) {
    throw new Error(`Insufficient UCT — you have ${wallet.uctBalance}, this costs ${listing.price}`);
  }
  // Simulated exchange: deduct UCT, transfer the NFT.
  wallet.uctBalance = (BigInt(wallet.uctBalance) - price).toString();
  write(WALLET_KEY, wallet);
  transferNft(listing.nftId, buyer);
  listing.status = "sold";
  listing.buyer = buyer;
  listing.soldAt = new Date().toISOString();
  write(LISTINGS_KEY, listings);
  return listing;
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
