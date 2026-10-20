/**
 * Type declarations for @unicitylabs/sphere-sdk/impl/browser.
 *
 * The package ships JS for this entry but no .d.ts alongside it; the main
 * entry has full types. We declare the two functions we use here.
 */

declare module "@unicitylabs/sphere-sdk/impl/browser" {
  import type {
    StorageProvider,
    TransportProvider,
    OracleProvider,
    PriceProvider,
    WalletApiTransportConfig,
  } from "@unicitylabs/sphere-sdk";

  export interface BrowserProviders {
    storage: StorageProvider;
    transport: TransportProvider;
    oracle: OracleProvider;
    price?: PriceProvider;
    walletApi?: WalletApiTransportConfig;
  }

  export function createBrowserProviders(config?: {
    network?: string;
    storage?: unknown;
    transport?: unknown;
    oracle?: unknown;
    price?: unknown;
    groupChat?: unknown;
    market?: unknown;
  }): BrowserProviders;

  export function createWalletApiProviders(
    base: BrowserProviders,
    config: {
      network: string;
      baseUrl: string;
      deviceId?: string;
      fetchFn?: unknown;
      webSocketFactory?: unknown;
      paymentsV2Transport?: unknown;
    }
  ): BrowserProviders & { walletApi: WalletApiTransportConfig };
}

declare module "@unicitylabs/sphere-sdk/connect/browser" {
  export type DetectedTransport = "iframe" | "extension" | "popup";

  export interface PublicIdentity {
    chainPubkey: string;
    directAddress?: string;
    nametag?: string;
  }

  export interface ConnectResult {
    sessionId: string;
    permissions: string[];
    identity: PublicIdentity;
    locked?: boolean;
  }

  export interface AutoConnectConfig {
    dapp: { name: string; description?: string; icon?: string; url: string };
    walletUrl?: string;
    permissions?: string[];
    silent?: boolean;
    network?: { id: number; name?: string };
    resumeSessionId?: string;
    timeout?: number;
    intentTimeout?: number;
    forceTransport?: DetectedTransport;
  }

  export interface AutoConnectResult {
    client: {
      disconnect(): Promise<void>;
      isConnected: boolean;
      walletIdentity: PublicIdentity | null;
      query<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
      intent<T = unknown>(action: string, params: Record<string, unknown>): Promise<T>;
      on(event: string, handler: (data: unknown) => void): () => void;
    };
    connection: ConnectResult;
    transport: DetectedTransport;
    disconnect: () => Promise<void>;
  }

  export function hasExtension(): boolean;
  export function isInIframe(): boolean;
  export function detectTransport(): DetectedTransport;
  export function autoConnect(config: AutoConnectConfig): Promise<AutoConnectResult>;
}
