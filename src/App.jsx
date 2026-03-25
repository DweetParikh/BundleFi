import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'

import Navbar       from './components/Navbar'
import Landing      from './components/Landing'
import Dashboard    from './components/Dashboard'
import BundleDetail from './components/BundleDetail'
import CreateBundle from './components/CreateBundle'
import Portfolio    from './components/Portfolio'
import Notification from './components/Notification'
import { useApp }   from './context/AppContext'

export default function App() {
  const { connected } = useWallet()
  const { notification } = useApp()

  return (
    <>
      <div className="bg-grid" />

      {connected ? (
        <>
          <Navbar />
          <main style={{ paddingTop: 72, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
            <Routes>
              <Route path="/"        element={<Dashboard />}         />
              <Route path="/bundle/:id" element={<BundleDetail />}   />
              <Route path="/create"  element={<CreateBundle />}       />
              <Route path="/portfolio" element={<Portfolio />}        />
              <Route path="*"        element={<Dashboard />}          />
            </Routes>
          </main>
        </>
      ) : (
        <Landing />
      )}

      {notification && (
        <Notification key={notification.id} message={notification.message} type={notification.type} />
      )}
    </>
  )
}