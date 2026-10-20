# Frani Mint

A mint studio for NFTs on Unicity testnet2. Connect a wallet, upload your own
art (or generate unique art from metadata), mint, and trade in the on-site
marketplace. Built with Next.js, shadcn/ui, and a premium dark design system.
Deployed on Vercel.

Made by **CRYPTFRANI**. Owner / creator: **Itachi**.

---

## Track

NFTs / Collectibles.

## Is it Agentic?

No. Frani Mint is a web app; minting and trading are user-driven.

## Runs on AstridOS?

No.

## Live on-network

- Network: **testnet2**
- Preview mode: wallet, NFTs, and listings live in the browser (localStorage)
  until a wallet-api connection is wired in.

## Features

- **Mint with your own art** — upload a PNG/JPG (auto-downscaled to 1024px)
  or let the generative engine create unique SVG art from your metadata.
- **Wallet-bound ownership** — no account, no email; assets belong to your wallet.
- **Marketplace** — list NFTs for UCT, browse community listings, search, and
  buy with one click. Balance and ownership are simulated locally in preview mode.
- **Refined dark UI** — shadcn/ui components, noise + grid + particle ambient
  background, soft glows, Space Grotesk / Inter typography.

## SDK features used

| Feature | Where |
|---|---|
| Wallet identity (planned) | `src/lib/wallet.ts` adapter |
| Asset model | `src/lib/wallet.ts` (Nft store) |
| Token model (planned) | UCT balance in `src/lib/wallet.ts` |

## Develop

```bash
npm install
npm run dev
npm run build
```
