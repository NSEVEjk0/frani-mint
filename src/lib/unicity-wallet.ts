"use client";

/**
 * Unicity wallet — local, self-custodial.
 *
 * Identity is derived entirely in the browser from a BIP-39 mnemonic using
 * the Sphere SDK's pure primitives (generateMnemonic / identityFromMnemonicSync
 * / deriveAddressInfo). This always works — no network, no wallet-api session,
 * no fragile init required to connect.
 *
 * Balance and sending are best-effort: we attempt a full Sphere SDK session
 * (wallet-api + nostr) so we can read real UCT and send it. If the network
 * path is unavailable, the wallet still connects and shows its address; the
 * UI degrades gracefully (balance shown as "—", purchases disabled with a
 * clear message).
 */

import {
  generateMnemonic,
  identityFromMnemonicSync,
  deriveAddressInfo,
  getAddressId,
  Sphere,
  TokenRegistry,
  getCoinIdBySymbol,
} from "@unicitylabs/sphere-sdk";
import { createBrowserProviders, createWalletApiProviders } from "@unicitylabs/sphere-sdk/impl/browser";

export interface UnicityWallet {
  address: string; // DIRECT://...
  addressId: string;
  nametag: string;
  uctBalance: string | null; // null = network sync unavailable
  created: boolean;
  generatedMnemonic?: string;
}

const NETWORK = "testnet2";
const WALLET_API_URL = "https://wallet-api.unicity.network";
const DEVICE_ID = "frani-mint-browser-v1";
const UCT_DECIMALS = 18;
const BASE_PATH = "m/44'/0'/0'";

const MNEMONIC_KEY = "frani-mint:mnemonic";

let sphere: Sphere | null = null;

function wholeFromBase(base: string, decimals: number): string {
  const v = BigInt(base || "0");
  const unit = 10n ** BigInt(decimals);
  const whole = v / unit;
  const frac = (v % unit).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

/** Derive the DIRECT address from a mnemonic — pure, local, synchronous. */
export function addressFromMnemonic(mnemonic: string): { address: string; addressId: string } {
  const mk = identityFromMnemonicSync(mnemonic.trim());
  const info = deriveAddressInfo(mk, BASE_PATH, 0, false);
  const address = `DIRECT://${info.publicKey}` as const;
  return { address, addressId: getAddressId(address) };
}

export function isValidMnemonic(phrase: string): boolean {
  const words = phrase.trim().split(/\s+/);
  return words.length === 12 || words.length === 24;
}

/** Derive the private key from the stored mnemonic (0x… hex). */
export function getPrivateKey(): string {
  const mnemonic = readStoredMnemonic();
  if (!mnemonic || !isValidMnemonic(mnemonic)) {
    throw new Error("No wallet key available");
  }
  const mk = identityFromMnemonicSync(mnemonic.trim());
  const info = deriveAddressInfo(mk, BASE_PATH, 0, false);
  return `0x${info.privateKey}`;
}

export function generateFreshMnemonic(): string {
  return generateMnemonic(128);
}

function readStoredMnemonic(): string | null {
  try {
    return window.localStorage.getItem(MNEMONIC_KEY);
  } catch {
    return null;
  }
}

function storeMnemonic(phrase: string) {
  try {
    window.localStorage.setItem(MNEMONIC_KEY, phrase);
  } catch {
    /* ignore */
  }
}

export function clearStoredMnemonic() {
  try {
    window.localStorage.removeItem(MNEMONIC_KEY);
  } catch {
    /* ignore */
  }
}

async function readUctBalance(s: Sphere): Promise<string> {
  const coinId = getCoinIdBySymbol("UCT");
  if (!coinId) return "0";
  try {
    const assets = await s.payments.assets(coinId);
    const confirmed = assets[0]?.confirmedAmount ?? "0";
    return wholeFromBase(confirmed, UCT_DECIMALS);
  } catch {
    return "0";
  }
}

function buildProviders() {
  const base = createBrowserProviders({ network: NETWORK });
  return createWalletApiProviders(base, {
    network: NETWORK,
    baseUrl: WALLET_API_URL,
    deviceId: DEVICE_ID,
  });
}

/** Try to open a full SDK session for the mnemonic. Returns null on failure. */
async function tryOpenSession(mnemonic: string): Promise<Sphere | null> {
  try {
    const providers = buildProviders();
    await TokenRegistry.waitForReady().catch(() => {});
    const result = await Sphere.init({
      ...providers,
      network: NETWORK,
      mnemonic: mnemonic.trim(),
      autoGenerate: false,
    });
    return result.sphere;
  } catch {
    return null;
  }
}

/**
 * Connect a wallet. With no input, generates a fresh mnemonic. Always
 * succeeds locally; network sync is attempted in the background.
 */
export async function connectUnicityWallet(input?: {
  mnemonic?: string;
}): Promise<UnicityWallet> {
  const mnemonic = input?.mnemonic?.trim() || generateFreshMnemonic();
  if (!isValidMnemonic(mnemonic)) {
    throw new Error("That recovery phrase isn't valid. Check the words and their order.");
  }
  const { address, addressId } = addressFromMnemonic(mnemonic);
  storeMnemonic(mnemonic);

  // Best-effort network sync for balance.
  let uctBalance: string | null = null;
  sphere = await tryOpenSession(mnemonic);
  if (sphere) {
    try {
      uctBalance = await readUctBalance(sphere);
    } catch {
      uctBalance = null;
    }
  }

  return {
    address,
    addressId,
    nametag: `wallet_${address.slice(-6)}`,
    uctBalance,
    created: !input?.mnemonic,
    generatedMnemonic: !input?.mnemonic ? mnemonic : undefined,
  };
}

/** Restore the persisted wallet, if any. */
export async function loadUnicityWallet(): Promise<UnicityWallet | null> {
  const mnemonic = readStoredMnemonic();
  if (!mnemonic || !isValidMnemonic(mnemonic)) return null;
  const { address, addressId } = addressFromMnemonic(mnemonic);

  let uctBalance: string | null = null;
  sphere = await tryOpenSession(mnemonic);
  if (sphere) {
    try {
      uctBalance = await readUctBalance(sphere);
    } catch {
      uctBalance = null;
    }
  }

  return {
    address,
    addressId,
    nametag: `wallet_${address.slice(-6)}`,
    uctBalance,
    created: false,
  };
}

export async function refreshUctBalance(): Promise<string> {
  if (!sphere) throw new Error("Wallet not connected to the network");
  return readUctBalance(sphere);
}

/** Send real UCT to a DIRECT address or nametag. */
export async function sendUct(
  to: string,
  amountWhole: string,
  memo?: string
): Promise<void> {
  if (!sphere) throw new Error("Wallet is offline — cannot send right now");
  const coinId = getCoinIdBySymbol("UCT");
  if (!coinId) throw new Error("UCT not found in the token registry");
  await sphere.payments.send({ recipient: to, amount: amountWhole, coinId, memo });
}

export async function disconnectUnicityWallet(): Promise<void> {
  try {
    await sphere?.destroy();
  } catch {
    /* ignore */
  }
  sphere = null;
  clearStoredMnemonic();
  try {
    TokenRegistry.destroy();
  } catch {
    /* ignore */
  }
}
