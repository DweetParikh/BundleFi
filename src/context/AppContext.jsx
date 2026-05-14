import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CURATED_BUNDLES, TOKEN_META } from '../data/mockData'
import { usePrices } from './PriceContext'

const AppContext = createContext(null)

const TOKEN_META_FALLBACK = Object.fromEntries(
  Object.entries(TOKEN_META).map(([sym, m]) => [sym, m.fallbackPrice])
)

const LS_BUNDLES_KEY   = 'bundlefi_user_bundles'
const LS_PORTFOLIO_KEY = 'bundlefi_portfolio'

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn('[BundleFi] Could not save "' + key + '" to localStorage:', err)
  }
}


export function AppProvider({ children }) {
  const { getPrice } = usePrices()

  const [userBundles,  setUserBundles]  = useState(() => loadFromStorage(LS_BUNDLES_KEY,   []))
  const [portfolio,    setPortfolio]    = useState(() => loadFromStorage(LS_PORTFOLIO_KEY, []))
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    saveToStorage(LS_BUNDLES_KEY, userBundles)
  }, [userBundles])

  useEffect(() => {
    saveToStorage(LS_PORTFOLIO_KEY, portfolio)
  }, [portfolio])

  // ── Notifications ──────────────────────────────────────────────────────────

  const showNotif = useCallback((message, type = 'success') => {
    setNotification({ message, type, id: Date.now() })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  // ── Actions ────────────────────────────────────────────────────────────────

  const investInBundle = useCallback((
    bundleId,
    amountUSD,
    tokenPositions = [],
    txSignature    = null,
  ) => {
    const newTx = {
      signature:      txSignature,
      usdAmount:      amountUSD,
      tokenPositions,
      timestamp:      Date.now(),
      type:           'invest',
    }

    setPortfolio(prev => {
      const existing = prev.find(p => p.bundleId === bundleId)

      if (existing) {
        return prev.map(p =>
          p.bundleId === bundleId
            ? {
                ...p,
                invested:     p.invested + amountUSD,
                shares:       p.shares + amountUSD / 10,
                transactions: [...(p.transactions ?? []), newTx],
                timestamp:    Date.now(),
              }
            : p
        )
      }
      return [
        ...prev,
        {
          bundleId,
          invested:     amountUSD,
          shares:       amountUSD / 10,
          transactions: txSignature ? [newTx] : [],
          timestamp:    Date.now(),
        },
      ]
    })

    showNotif('Invested $' + amountUSD.toFixed(2) + ' successfully! ◎ SOL deducted from wallet.')
  }, [showNotif])

  /**
   * Withdraw a portion (or all) of a position from a bundle.
   * @param {string} bundleId
   * @param {number} withdrawUSD   - USD amount to withdraw (≤ currentValue)
   * @param {number} currentValue  - live current value of the position (used to compute share ratio)
   * @param {string|null} txSignature
   */
  const withdrawFromBundle = useCallback((
    bundleId,
    withdrawUSD,
    currentValue,
    txSignature = null,
  ) => {
    setPortfolio(prev => {
      const pos = prev.find(p => p.bundleId === bundleId)
      if (!pos) return prev

      // Fraction of the position being withdrawn (by current value)
      const fraction = currentValue > 0 ? Math.min(withdrawUSD / currentValue, 1) : 1

      const newInvested = pos.invested * (1 - fraction)
      const newShares   = pos.shares   * (1 - fraction)

      const withdrawTx = {
        signature: txSignature,
        usdAmount: withdrawUSD,
        timestamp: Date.now(),
        type:      'withdraw',
      }

      // Remove position entirely if fully withdrawn
      if (newShares <= 0.0001) {
        showNotif('Fully withdrawn from bundle. Funds returned to wallet.')
        return prev.filter(p => p.bundleId !== bundleId)
      }

      showNotif('Withdrew $' + withdrawUSD.toFixed(2) + ' successfully! ◎ SOL returned to wallet.')
      return prev.map(p =>
        p.bundleId === bundleId
          ? {
              ...p,
              invested:     newInvested,
              shares:       newShares,
              transactions: [...(p.transactions ?? []), withdrawTx],
              timestamp:    Date.now(),
            }
          : p
      )
    })
  }, [showNotif])

  const createBundle = useCallback((bundle) => {
    const totalRaw = bundle.tokens.reduce((s, t) => s + (t.weight || 0), 0)
    const tokens   = bundle.tokens.map(t => ({
      ...t,
      weight: totalRaw > 0
        ? Math.round((t.weight / totalRaw) * 100)
        : Math.round(100 / bundle.tokens.length),
    }))

    const newBundle = {
      ...bundle,
      tokens,
      id:            'user-' + Date.now(),
      isOfficial:    false,
      aum:           0,
      apy:           null,
      change7d:      null,
      change30d:     null,
      investors:     1,
      minInvestment: 1,
      chartData:     [],
      category:      'Custom',
      inception:     new Date().toISOString().slice(0, 10),
    }

    setUserBundles(prev => [newBundle, ...prev])
    showNotif('Bundle "' + bundle.name + '" created!')
    return newBundle
  }, [showNotif])

  // ── Derived values ─────────────────────────────────────────────────────────

  const allBundles = [...CURATED_BUNDLES, ...userBundles]

  const portfolioWithValue = portfolio.map(pos => {
    const bundle = allBundles.find(b => b.id === pos.bundleId)
    if (!bundle) return { ...pos, currentValue: pos.invested, bundle: null }

    let navMultiplier = 1
    if (bundle.tokens.length > 0) {
      let totalWeight    = 0
      let weightedReturn = 0

      bundle.tokens.forEach(t => {
        const live     = getPrice(t.symbol)
        const fallback = TOKEN_META_FALLBACK[t.symbol] ?? live
        const ret      = fallback > 0 ? live / fallback : 1

        weightedReturn += (t.weight / 100) * ret
        totalWeight    += t.weight
      })

      if (totalWeight > 0) navMultiplier = weightedReturn
    }

    return {
      ...pos,
      currentValue: pos.invested * navMultiplier,
      bundle,
    }
  })

  const totalInvested     = portfolioWithValue.reduce((s, p) => s + p.invested,     0)
  const totalCurrentValue = portfolioWithValue.reduce((s, p) => s + p.currentValue, 0)
  const totalPnL          = totalCurrentValue - totalInvested
  const totalPnLPct       = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  return (
    <AppContext.Provider value={{
      userBundles,
      allBundles,
      portfolio:        portfolioWithValue,
      totalInvested,
      totalCurrentValue,
      totalPnL,
      totalPnLPct,
      investInBundle,
      withdrawFromBundle,
      createBundle,
      notification,
      showNotif,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
