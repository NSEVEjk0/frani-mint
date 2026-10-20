"use client";

/**
 * Sphere Connect — connect an EXISTING Unicity wallet.
 *
 * This is the native wallet-connection protocol (the Unicity equivalent of
 * MetaMask's window.ethereum). It detects the wallet's transport (browser
 * extension, iframe host, or popup fallback), performs a handshake, and
 * returns the wallet's public identity. No mnemonic is ever generated or
 * imported here — the user's own wallet approves the connection.
 */

import {
  autoConnect,
  detectTransport,
  hasExtension,
  isInIframe,
  type AutoConnectResult,
  type DetectedTransport,
} from "@unicitylabs/sphere-sdk/connect/browser";

export interface SphereConnectSession {
  address: string; // DIRECT://...
  nametag: string;
  transport: DetectedTransport;
  sessionId: string;
}

const DAPP_METADATA = {
  name: "Frani Mint",
  description: "Mint, collect, and trade NFTs on Unicity.",
  url: "https://frani-mint.vercel.app",
};

const TESTNET2: { id: number; name: string } = { id: 4, name: "testnet2" };

export function detectWalletTransport(): {
  available: boolean;
  transport: DetectedTransport | null;
  reason?: string;
} {
  if (hasExtension()) {
    return { available: true, transport: "extension" };
  }
  if (isInIframe()) {
    return { available: true, transport: "iframe" };
  }
  return {
    available: false,
    transport: null,
    reason:
      "No Unicity wallet detected. Install the Unicity wallet extension, or open this site inside the Unicity wallet's browser.",
  };
}

/** Connect to the user's existing Unicity wallet. */
export async function connectExistingWallet(): Promise<SphereConnectSession> {
  const detected = detectWalletTransport();
  if (!detected.available) {
    throw new Error(detected.reason || "No Unicity wallet detected");
  }

  let result: AutoConnectResult;
  try {
    result = await autoConnect({
      dapp: DAPP_METADATA,
      network: TESTNET2,
      // Request identity + balance + transfer so the marketplace works.
      permissions: ["identity:read", "balance:read", "transfer:request"],
    });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "The wallet declined the connection"
    );
  }

  const identity = result.connection.identity;
  if (!identity?.directAddress) {
    throw new Error("Connected, but the wallet did not share an address");
  }

  return {
    address: identity.directAddress,
    nametag: identity.nametag || `wallet_${identity.directAddress.slice(-6)}`,
    transport: result.transport,
    sessionId: result.connection.sessionId,
  };
}
