/**
 * bundleService.js
 * NAV calculations for bundles and portfolio positions.
 */

import { FALLBACK_PRICES } from '../lib/tokens.js'
import { getLatestPrices } from './priceService.js'

// ─── Bundle NAV ───────────────────────────────────────────────────────────────

/**
 * Compute the current NAV multiplier for a bundle given live prices.
 * navMultiplier = Σ (weight/100 * livePrice / fallbackPrice)
 *
 * If a token has no price data, its weight contributes a 1× factor (neutral).
 *
 * @param {Array<{ symbol: string, weight: number }>} tokens
 * @param {Record<string, number>} livePrices  symbol → current USD price
 * @returns {number} multiplier (e.g. 1.15 = +15%)
 */
export function computeBundleNAV(tokens, livePrices = {}) {
  if (!tokens?.length) return 1

  let totalWeight    = 0
  let weightedReturn = 0

  for (const token of tokens) {
    const w         = token.weight ?? 0
    const live      = livePrices[token.symbol] ?? FALLBACK_PRICES[token.symbol]
    const fallback  = FALLBACK_PRICES[token.symbol] ?? live

    if (!live || !fallback) continue

    weightedReturn += (w / 100) * (live / fallback)
    totalWeight    += w
  }

  if (totalWeight <= 0) return 1

  // Normalise in case weights don't sum exactly to 100
  return weightedReturn * (100 / totalWeight)
}

// ─── Portfolio value ──────────────────────────────────────────────────────────

/**
 * Compute the current value, P&L, and P&L % for a set of positions.
 * Fetches latest prices from Redis / API.
 *
 * @param {Array<{ investedUsd: number, shares: number, bundle: object }>} positions
 * @returns {Promise<Array>} positions enriched with currentValue, pnl, pnlPct
 */
export async function computePortfolioValue(positions) {
  const { prices } = await getLatestPrices()

  return positions.map((pos) => {
    const tokens   = pos.bundle?.tokens ?? []
    const multiplier = computeBundleNAV(tokens, prices)
    const currentValue = pos.investedUsd * multiplier
    const pnl          = currentValue - pos.investedUsd
    const pnlPct       = pos.investedUsd > 0 ? (pnl / pos.investedUsd) * 100 : 0

    return {
      ...pos,
      currentValue,
      pnl,
      pnlPct,
    }
  })
}

// ─── Weight normalization ─────────────────────────────────────────────────────

/**
 * Normalize token weights so they sum to exactly 100.
 * @param {Array<{ weight: number }>} tokens
 * @returns {Array<{ weight: number }>}
 */
export function normalizeWeights(tokens) {
  const total = tokens.reduce((s, t) => s + (t.weight ?? 0), 0)
  if (total === 0) {
    const equal = Math.floor(100 / tokens.length)
    return tokens.map((t, i) => ({
      ...t,
      weight: i === tokens.length - 1 ? 100 - equal * (tokens.length - 1) : equal,
    }))
  }

  const normalized = tokens.map((t) => ({
    ...t,
    weight: Math.floor((t.weight / total) * 100),
  }))

  // Distribute rounding remainder to the largest token
  const remainder = 100 - normalized.reduce((s, t) => s + t.weight, 0)
  if (remainder !== 0) {
    const maxIdx = normalized.reduce(
      (mi, t, i) => (t.weight > normalized[mi].weight ? i : mi),
      0
    )
    normalized[maxIdx].weight += remainder
  }

  return normalized
}
