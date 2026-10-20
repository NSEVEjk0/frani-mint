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
