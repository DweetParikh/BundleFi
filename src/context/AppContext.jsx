import React, { createContext, useContext, useState, useCallback } from 'react'
import { CURATED_BUNDLES } from '../data/mockData'
import { usePrices } from './PriceContext'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { getPrice } = usePrices()
  const [userBundles,  setUserBundles]  = useState([])
  const [portfolio,    setPortfolio]    = useState([])
  const [notification, setNotification] = useState(null)

  const showNotif = useCallback((message, type = 'success') => {
    setNotification({ message, type, id: Date.now() })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  const investInBundle = useCallback((bundleId, amountUSD) => {
    setPortfolio(prev => {
      const existing = prev.find(p => p.bundleId === bundleId)
      if (existing) {
        return prev.map(p =>
          p.bundleId === bundleId
            ? { ...p, invested: p.invested + amountUSD, timestamp: Date.now() }
            : p
        )
      }
      return [...prev, { bundleId, invested: amountUSD, shares: amountUSD / 10, timestamp: Date.now() }]
    })
    showNotif(`Invested $${amountUSD.toFixed(2)} successfully!`)
  }, [showNotif])

  const createBundle = useCallback((bundle) => {
    const totalRaw = bundle.tokens.reduce((s, t) => s + (t.weight || 0), 0)
    const tokens = bundle.tokens.map(t => ({
      ...t,
      weight: totalRaw > 0
        ? Math.round((t.weight / totalRaw) * 100)
        : Math.round(100 / bundle.tokens.length),
    }))
    const newBundle = {
      ...bundle, tokens,
      id: `user-${Date.now()}`,
      isOfficial: false, aum: 0, apy: null,
      change7d: null, change30d: null,
      investors: 1, minInvestment: 1,
      chartData: [], category: 'Custom',
      inception: new Date().toISOString().slice(0, 10),
    }
    setUserBundles(prev => [newBundle, ...prev])
    showNotif(`Bundle "${bundle.name}" created!`)
    return newBundle
  }, [showNotif])

  const allBundles = [...CURATED_BUNDLES, ...userBundles]

  // Compute portfolio values using live prices
  const portfolioWithValue = portfolio.map(pos => {
    const bundle = allBundles.find(b => b.id === pos.bundleId)
    if (!bundle) return { ...pos, currentValue: pos.invested, bundle: null }

    // Compute bundle NAV change using live prices vs fallback prices
    let navMultiplier = 1
    if (bundle.tokens.length > 0) {
      let totalWeight = 0
      let weightedReturn = 0
      bundle.tokens.forEach(t => {
        const live     = getPrice(t.symbol)
        const fallback = t.fallbackPrice ?? (TOKEN_META_FALLBACK[t.symbol] ?? live)
        const ret      = fallback > 0 ? live / fallback : 1
        weightedReturn += (t.weight / 100) * ret
        totalWeight    += t.weight
      })
      if (totalWeight > 0) navMultiplier = weightedReturn
    }

    return { ...pos, currentValue: pos.invested * navMultiplier, bundle }
  })

  const totalInvested     = portfolioWithValue.reduce((s, p) => s + p.invested, 0)
  const totalCurrentValue = portfolioWithValue.reduce((s, p) => s + p.currentValue, 0)
  const totalPnL          = totalCurrentValue - totalInvested
  const totalPnLPct       = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  return (
    <AppContext.Provider value={{
      userBundles, allBundles, portfolio: portfolioWithValue,
      totalInvested, totalCurrentValue, totalPnL, totalPnLPct,
      investInBundle, createBundle, notification, showNotif,
    }}>
      {children}
    </AppContext.Provider>
  )
}

import { TOKEN_META } from '../data/mockData'
const TOKEN_META_FALLBACK = Object.fromEntries(
  Object.entries(TOKEN_META).map(([sym, m]) => [sym, m.fallbackPrice])
)

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
