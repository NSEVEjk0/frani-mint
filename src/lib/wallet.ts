/**
 * Frani Mint — wallet + asset store.
 *
 * Testnet-preview mode: a local wallet is generated in the browser and NFTs
 * are minted into a local store (metadata + generated art seed). The store is
 * shaped like the Sphere SDK's asset model so a real Unicity wallet-api
 * connection can replace it without touching the UI.
 */

export interface Nft {
  id: string;
  name: string;
  description: string;
  symbol: string;
  artSeed: number;
  mintedAt: string;
  owner: string;
  txRef: string;
}

export interface Wallet {
  address: string;
  nametag: string;
  connectedAt: string;
}

const WALLET_KEY = "frani-mint:wallet";
const NFTS_KEY = "frani-mint:nfts";

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
    /* storage unavailable — keep in-memory only */
  }
}

function randomAddress(): string {
  const hex = Array.from({ length: 40 }, () =>
    "0123456789abcdef"[Math.floor(Math.random() * 16)]
  ).join("");
  return `0x${hex}`;
}

/** Connect (or resume) the local preview wallet. */
export function connectWallet(): Wallet {
  const existing = read<Wallet | null>(WALLET_KEY, null);
  if (existing) return existing;
  const wallet: Wallet = {
    address: randomAddress(),
    nametag: `guest_${Math.floor(Math.random() * 900 + 100)}`,
    connectedAt: new Date().toISOString(),
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

export function listNfts(): Nft[] {
  return read<Nft[]>(NFTS_KEY, []);
}

/** Mint an NFT into the preview store. Returns the minted asset. */
export function mintNft(input: {
  name: string;
  description: string;
  symbol: string;
  owner: string;
}): Nft {
  const nfts = listNfts();
  const nft: Nft = {
    id: `nft_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
    name: input.name,
    description: input.description,
    symbol: input.symbol || "UCT-NFT",
    artSeed: Math.floor(Math.random() * 1e9),
    mintedAt: new Date().toISOString(),
    owner: input.owner,
    txRef: `0x${Array.from({ length: 64 }, () =>
      "0123456789abcdef"[Math.floor(Math.random() * 16)]
    ).join("")}`,
  };
  nfts.unshift(nft);
  write(NFTS_KEY, nfts);
  return nft;
}
