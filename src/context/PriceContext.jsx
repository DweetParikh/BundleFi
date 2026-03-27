import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { TOKEN_META } from '../data/mockData'

const PriceContext = createContext(null)

const JUPITER_API    = 'https://api.jup.ag'
const COINGECKO_API  = 'https://api.coingecko.com/api/v3/simple/price'
const JUP_INTERVAL   = 30_000
const CG_INTERVAL    = 60_000   

// Build lookup maps once
const MINT_TO_SYMBOL  = {}
const CG_ID_TO_SYMBOL = {}
Object.entries(TOKEN_META).forEach(([sym, meta]) => {
  if (meta.solanaMint)  MINT_TO_SYMBOL[meta.solanaMint]  = sym
  if (meta.coingeckoId) CG_ID_TO_SYMBOL[meta.coingeckoId] = sym
})

const SOLANA_MINTS  = Object.entries(TOKEN_META).filter(([, m]) => m.solanaMint).map(([, m]) => m.solanaMint)
const ALL_CG_IDS    = Object.values(TOKEN_META).map(m => m.coingeckoId).join(',')

function buildFallbackPrices() {
  const prices = {}, changes = {}
  Object.entries(TOKEN_META).forEach(([sym, meta]) => {
    prices[sym]  = meta.fallbackPrice
    changes[sym] = null
  })
  return { prices, changes }
}

export function PriceProvider({ children }) {
  const { prices: fp, changes: fc } = buildFallbackPrices()
  const [prices,      setPrices]      = useState(fp)
  const [changes24h,  setChanges24h]  = useState(fc)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [sources,     setSources]     = useState({ jupiter: false, coingecko: false })

  const mergePrices  = useCallback(p => setPrices(prev  => ({ ...prev,  ...p  })), [])
  const mergeChanges = useCallback(c => setChanges24h(prev => ({ ...prev, ...c })), [])

  const fetchJupiter = useCallback(async () => {
    try {
      const url  = `${JUPITER_API}?ids=${SOLANA_MINTS.join(',')}`
      const res  = await fetch(url)
      if (!res.ok) throw new Error(`Jupiter ${res.status}`)
      const json = await res.json()

      const newPrices = {}
      Object.entries(json.data || {}).forEach(([mint, info]) => {
        const sym = MINT_TO_SYMBOL[mint]
        if (sym) newPrices[sym] = parseFloat(info.price)
      })
      mergePrices(newPrices)
      setSources(s => ({ ...s, jupiter: true }))
      setLastUpdated(new Date())
    } catch (err) {
      console.warn('[PriceContext] Jupiter failed:', err.message)
    }
  }, [mergePrices])

  const fetchCoinGecko = useCallback(async () => {
    try {
      const url = `${COINGECKO_API}?ids=${ALL_CG_IDS}&vs_currencies=usd&include_24hr_change=true`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
      const json = await res.json()

      const newPrices  = {}
      const newChanges = {}
      Object.entries(json).forEach(([cgId, data]) => {
        const sym = CG_ID_TO_SYMBOL[cgId]
        if (!sym) return
        if (data.usd)                 newPrices[sym]  = data.usd
        if (data.usd_24h_change != null) newChanges[sym] = data.usd_24h_change
      })

      mergePrices(newPrices)
      mergeChanges(newChanges)
      setSources(s => ({ ...s, coingecko: true }))
      setLastUpdated(new Date())
    } catch (err) {
      console.warn('[PriceContext] CoinGecko failed:', err.message)
    } finally {
      setLoading(false)
    }
  }, [mergePrices, mergeChanges])

  useEffect(() => {
    Promise.all([fetchJupiter(), fetchCoinGecko()])

    const jupTimer = setInterval(fetchJupiter,  JUP_INTERVAL)
    const cgTimer  = setInterval(fetchCoinGecko, CG_INTERVAL)

    return () => {
      clearInterval(jupTimer)
      clearInterval(cgTimer)
    }
  }, [fetchJupiter, fetchCoinGecko])

  const getPrice = useCallback((symbol) => {
    return prices[symbol] ?? TOKEN_META[symbol]?.fallbackPrice ?? 0
  }, [prices])

  const getChange24h = useCallback((symbol) => {
    return changes24h[symbol] ?? null
  }, [changes24h])

  return (
    <PriceContext.Provider value={{
      prices,
      changes24h,
      lastUpdated,
      loading,
      sources,
      getPrice,
      getChange24h,
    }}>
      {children}
    </PriceContext.Provider>
  )
}

export const usePrices = () => {
  const ctx = useContext(PriceContext)
  if (!ctx) throw new Error('usePrices must be inside PriceProvider')
  return ctx
}