import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter }  from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { clusterApiUrl } from '@solana/web3.js'
import { Analytics } from "@vercel/analytics/react"

import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'

import App from './App'
import { AppProvider }   from './context/AppContext'
import { PriceProvider } from './context/PriceContext'

/**
 * NETWORK: 'devnet'
 *
 * BundleFi is configured for Solana Devnet.
 * - Wallet connections point to devnet RPC
 * - Jupiter swap quotes use mainnet mints for accurate pricing
 *   (Jupiter does not operate on devnet natively)
 * - Transactions broadcast to devnet and are treated as simulations
 *
 * To switch to mainnet-beta:
 *   1. Change NETWORK to 'mainnet-beta' here
 *   2. Change SOLANA_NETWORK in src/services/jupiterSwap.js
 */
const NETWORK = 'devnet'
//const NETWORK = 'mainnet-beta'

function Root() {
  const endpoint = useMemo(() => clusterApiUrl(NETWORK), [])
  const wallets  = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <PriceProvider>
            <AppProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AppProvider>
          </PriceProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
    <Analytics />
  </React.StrictMode>
)
