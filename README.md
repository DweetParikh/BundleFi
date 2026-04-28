# BundleFi
Crypto mutual funds on Solana — invest in curated token bundles or build your own.

BundleFi is a Web3 DeFi app on Solana that lets users invest in curated baskets of top-performing crypto tokens — 
like mutual funds, but trustless and non-custodial. 
Connect with Phantom or Solflare, explore official bundles, 
or build a fully custom bundle with your own token mix and allocation weights.
Built with React + Vite, Solana Wallet Adapter, and Recharts.

## Jupiter Swap Integration

Bundle investments now execute a Jupiter-routed swap when the wallet is connected.

### Environment variables

- `VITE_JUPITER_API_BASE` (optional): Defaults to `https://lite-api.jup.ag/swap/v1`.
- `VITE_JUPITER_API_KEY` (optional): Adds `x-api-key` header for Jupiter Developer Portal keys.

### Network

The app is configured to use **Solana Devnet** (`clusterApiUrl('devnet')`).
