import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter }  from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { clusterApiUrl } from '@solana/web3.js'

import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'

import App from './App'
import { AppProvider }   from './context/AppContext'
import { PriceProvider } from './context/PriceContext'

function Root() {
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), [])
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
  </React.StrictMode>
)