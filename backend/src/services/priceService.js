/**
 * priceService.js
 * Fetches token prices from Jupiter (Solana) and CoinGecko,
 * merges them, writes to Redis and Postgres.
 */

import redis from '../lib/redis.js'
import prisma from '../lib/prisma.js'
import {
  SOLANA_TOKEN_MINTS,
  MINT_TO_SYMBOL,
  ALL_CG_IDS,
  CG_ID_TO_SYMBOL,
  FALLBACK_PRICES,
} from '../lib/tokens.js'

const JUPITER_PRICE_URL = 'https://api.jup.ag/price/v2'
const COINGECKO_URL     = 'https://api.coingecko.com/api/v3/simple/price'
const REDIS_KEY         = 'prices:latest'
const REDIS_TTL         = 120 // seconds

// ─── Jupiter ─────────────────────────────────────────────────────────────────

/**
 * Fetch prices for all tracked Solana tokens from Jupiter Price API v2.
 * @returns {Promise<Record<string, number>>} symbol → price in USD
 */
export async function fetchJupiterPrices() {
  const ids = SOLANA_TOKEN_MINTS.join(',')
  const url = `${JUPITER_PRICE_URL}?ids=${ids}`

  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) })
  if (!res.ok) throw new Error(`Jupiter price API ${res.status}`)

  const json = await res.json()
  const prices = {}

  for (const [mint, info] of Object.entries(json.data ?? {})) {
    const sym = MINT_TO_SYMBOL[mint]
    if (sym && info?.price != null) {
      prices[sym] = parseFloat(info.price)
    }
  }

  return prices
}

// ─── CoinGecko ────────────────────────────────────────────────────────────────

/**
 * Fetch prices + 24h changes for all tracked tokens from CoinGecko.
 * @returns {Promise<{ prices: Record<string, number>, changes: Record<string, number> }>}
 */
export async function fetchCoinGeckoPrices() {
  const url = `${COINGECKO_URL}?ids=${ALL_CG_IDS}&vs_currencies=usd&include_24hr_change=true`

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`CoinGecko API ${res.status}`)

  const json = await res.json()
  const prices  = {}
  const changes = {}

  for (const [cgId, data] of Object.entries(json)) {
    const sym = CG_ID_TO_SYMBOL[cgId]
    if (!sym) continue
    if (data.usd != null)             prices[sym]  = data.usd
    if (data.usd_24h_change != null)  changes[sym] = data.usd_24h_change
  }

  return { prices, changes }
}

// ─── Build payload (called by worker + /prices/latest fallback) ───────────────

/**
 * Fetch from both APIs in parallel, merge results, persist to Redis + Postgres.
 * Jupiter prices take priority for Solana-native tokens.
 * @returns {Promise<{ prices, changes, updatedAt }>}
 */
export async function buildPricePayload() {
  const [jupResult, cgResult] = await Promise.allSettled([
    fetchJupiterPrices(),
    fetchCoinGeckoPrices(),
  ])

  // Start with fallbacks
  const prices  = { ...FALLBACK_PRICES }
  const changes = {}

  // Apply CoinGecko (broader coverage, includes non-Solana tokens)
  if (cgResult.status === 'fulfilled') {
    Object.assign(prices,  cgResult.value.prices)
    Object.assign(changes, cgResult.value.changes)
  } else {
    console.warn('[priceService] CoinGecko failed:', cgResult.reason?.message)
  }

  // Jupiter overrides for Solana tokens (more accurate for SPL tokens)
  if (jupResult.status === 'fulfilled') {
    Object.assign(prices, jupResult.value)
  } else {
    console.warn('[priceService] Jupiter failed:', jupResult.reason?.message)
  }

  const updatedAt = new Date()
  const payload   = { prices, changes, updatedAt: updatedAt.toISOString() }

  // Write to Redis
  try {
    await redis.set(REDIS_KEY, JSON.stringify(payload), 'EX', REDIS_TTL)
  } catch (err) {
    console.warn('[priceService] Redis write failed:', err.message)
  }

  // Bulk insert PriceSnapshot rows
  try {
    const snapshots = Object.entries(prices).map(([symbol, priceUsd]) => ({
      symbol,
      priceUsd,
      change24h: changes[symbol] ?? null,
      source:    jupResult.status === 'fulfilled' && prices[symbol] ? 'jupiter' : 'coingecko',
      timestamp: updatedAt,
    }))

    await prisma.priceSnapshot.createMany({
      data:           snapshots,
      skipDuplicates: true,
    })
  } catch (err) {
    console.warn('[priceService] Postgres write failed:', err.message)
  }

  return payload
}

// ─── Convenience: read from Redis or fetch ───────────────────────────────────

/**
 * Return the latest price payload.
 * Tries Redis first; falls back to a live fetch.
 * @returns {Promise<{ prices, changes, updatedAt }>}
 */
export async function getLatestPrices() {
  try {
    const cached = await redis.get(REDIS_KEY)
    if (cached) return JSON.parse(cached)
  } catch (err) {
    console.warn('[priceService] Redis read failed:', err.message)
  }

  return buildPricePayload()
}
