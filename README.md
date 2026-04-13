# BundleFi
Crypto mutual funds on Solana — invest in curated token bundles or build your own.

BundleFi is a Web3 DeFi app on Solana that lets users invest in curated baskets of top-performing crypto tokens —
like mutual funds, but trustless and non-custodial.
Connect with Phantom or Solflare, explore official bundles,
or build a fully custom bundle with your own token mix and allocation weights.
Built with React + Vite, Solana Wallet Adapter, and Recharts.

## Backend: Jupiter Aggregation API proxy

This repo now includes a lightweight Node backend for Jupiter swaps.

### Run frontend

```bash
npm run dev
```

### Run backend

```bash
npm run dev:backend
```

The backend runs on `http://localhost:8787` by default.

### API endpoints

- `GET /health` - service health check.
- `GET /api/jupiter/quote` - proxied Jupiter quote endpoint.
  - Required query params: `inputMint`, `outputMint`, `amount`
  - Optional query params: `slippageBps`, `swapMode`, plus any Jupiter-compatible fields.
- `POST /api/jupiter/swap` - proxied Jupiter swap endpoint.
  - Required JSON fields: `quoteResponse`, `userPublicKey`
  - Adds defaults for `wrapAndUnwrapSol`, `dynamicComputeUnitLimit`, and `prioritizationFeeLamports`.

### Environment variables

- `PORT` (optional): backend port (default `8787`)
- `JUPITER_API_URL` (optional): Jupiter API base URL (default `https://quote-api.jup.ag/v6`)
