# Frani Mint

A mint studio for NFTs on Unicity testnet2. Connect a wallet, upload a name
and description, mint — every NFT gets unique generative art and a signed
transaction reference. Built with Next.js, deployed on Vercel.

Made by **CRYPTFRANI**. Owner / creator: **Itachi**.

---

## Track

NFTs / Collectibles.

## Is it Agentic?

No. Frani Mint is a web app; minting is user-driven.

## Runs on AstridOS?

No.

## Live on-network

- Network: **testnet2**
- Preview mode: wallet + assets live in the browser (localStorage) until a
  wallet-api connection is wired in.

## SDK features used

| Feature | Where |
|---|---|
| Wallet identity (planned) | `src/lib/wallet.ts` adapter |
| Asset model | `src/lib/wallet.ts` (Nft store) |

## Develop

```bash
npm install
npm run dev
npm run build
```
