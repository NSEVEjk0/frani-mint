"use client";

/**
 * Real Unicity wallet connection via the Sphere SDK (browser build).
 *
 * - `connectUnicityWallet()` — create a new wallet (auto-generates a
 *   mnemonic) or restore one from a mnemonic.
 * - The wallet persists in IndexedDB (provided by the SDK), so returning
 *   visitors load it automatically.
 * - Balances are read from the wallet-api inventory mirror (real UCT).
 * - `sendUct()` performs a real UCT transfer to a DIRECT address or nametag.
 */

import { Sphere, TokenRegistry, getCoinIdBySymbol } from "@unicitylabs/sphere-sdk";
import { createBrowserProviders, createWalletApiProviders } from "@unicitylabs/sphere-sdk/impl/browser";

export interface UnicityWallet {
  address: string;
  nametag: string;
  uctBalance: string; // whole UCT units (string to avoid float drift)
  created: boolean;
  generatedMnemonic?: string; // present only when newly created
}

const NETWORK = "testnet2";
const WALLET_API_URL = "https://wallet-api.unicity.network";
const DEVICE_ID = "frani-mint-browser-v1";
const UCT_DECIMALS = 18;

let sphere: Sphere | null = null;

function wholeFromBase(base: string, decimals: number): string {
  const v = BigInt(base || "0");
  const unit = 10n ** BigInt(decimals);
  const whole = v / unit;
  const frac = (v % unit).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

async function readUctBalance(s: Sphere): Promise<string> {
  const coinId = getCoinIdBySymbol("UCT");
  if (!coinId) return "0";
  try {
    const assets = await s.payments.assets(coinId);
    const confirmed = assets[0]?.confirmedAmount ?? "0";
    return wholeFromBase(confirmed, UCT_DECIMALS);
  } catch {
    // Inventory mirror not synced yet — treat as zero, caller can refresh.
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

export async function connectUnicityWallet(input?: {
  mnemonic?: string;
}): Promise<UnicityWallet> {
  const providers = buildProviders();
  await TokenRegistry.waitForReady().catch(() => {});
  const result = await Sphere.init({
    ...providers,
    network: NETWORK,
    autoGenerate: !input?.mnemonic,
    ...(input?.mnemonic ? { mnemonic: input.mnemonic.trim() } : {}),
  });
  sphere = result.sphere;

  const addresses = sphere.getActiveAddresses();
  const addr = addresses[0];
  if (!addr) throw new Error("Could not resolve a wallet address");

  const uctBalance = await readUctBalance(sphere);

  return {
    address: addr.directAddress,
    nametag: addr.nametag || `wallet_${addr.directAddress.slice(-6)}`,
    uctBalance,
    created: result.created,
    generatedMnemonic: result.generatedMnemonic,
  };
}

/** Load the persisted wallet (if any) without creating a new one. */
export async function loadUnicityWallet(): Promise<UnicityWallet | null> {
  try {
    const providers = buildProviders();
    await TokenRegistry.waitForReady().catch(() => {});
    const result = await Sphere.init({
      ...providers,
      network: NETWORK,
      autoGenerate: false,
    });
    sphere = result.sphere;
    const addresses = sphere.getActiveAddresses();
    const addr = addresses[0];
    if (!addr) {
      await sphere.destroy();
      sphere = null;
      return null;
    }
    const uctBalance = await readUctBalance(sphere);
    return {
      address: addr.directAddress,
      nametag: addr.nametag || `wallet_${addr.directAddress.slice(-6)}`,
      uctBalance,
      created: false,
    };
  } catch {
    return null;
  }
}

export async function refreshUctBalance(): Promise<string> {
  if (!sphere) throw new Error("Wallet not connected");
  return readUctBalance(sphere);
}

/** Send real UCT to a DIRECT address or nametag. */
export async function sendUct(
  to: string,
  amountWhole: string,
  memo?: string
): Promise<void> {
  if (!sphere) throw new Error("Wallet not connected");
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
  try {
    TokenRegistry.destroy();
  } catch {
    /* ignore */
  }
}
