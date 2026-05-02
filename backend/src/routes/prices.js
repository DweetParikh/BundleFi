/**
 * routes/prices.js
 * GET /prices/latest             — latest price payload (Redis cache → live fetch)
 * GET /prices/history/:symbol    — price history for a token (?days=30)
 */

import prisma              from '../lib/prisma.js'
import { getLatestPrices, buildPricePayload } from '../services/priceService.js'
import redis               from '../lib/redis.js'

const REDIS_KEY = 'prices:latest'

export default async function pricesRoutes(fastify) {

  // ── GET /prices/latest ────────────────────────────────────────────────────────
  fastify.get('/prices/latest', async (request, reply) => {
    // Fast path: try Redis first
    try {
      const cached = await redis.get(REDIS_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        return reply.send({ ...parsed, source: 'cache' })
      }
    } catch (err) {
      fastify.log.warn('Redis read failed:', err.message)
    }

    // Cache miss: fetch live
    const payload = await buildPricePayload()
    return reply.send({ ...payload, source: 'live' })
  })

  // ── GET /prices/history/:symbol ───────────────────────────────────────────────
  fastify.get('/prices/history/:symbol', async (request, reply) => {
    const { symbol } = request.params
    const days       = Math.min(Math.max(parseInt(request.query.days ?? '30', 10), 1), 365)

    const since = new Date()
    since.setDate(since.getDate() - days)

    const snapshots = await prisma.priceSnapshot.findMany({
      where: {
        symbol:    symbol.toUpperCase(),
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true, priceUsd: true, change24h: true },
    })

    if (!snapshots.length) {
      return reply.send({ symbol: symbol.toUpperCase(), history: [] })
    }

    // Downsample to max 200 data points using modulo sampling
    let history = snapshots
    if (snapshots.length > 200) {
      const step = Math.ceil(snapshots.length / 200)
      history = snapshots.filter((_, i) => i % step === 0)
      // Always include the last data point
      if (history[history.length - 1] !== snapshots[snapshots.length - 1]) {
        history.push(snapshots[snapshots.length - 1])
      }
    }

    return reply.send({
      symbol:  symbol.toUpperCase(),
      days,
      count:   history.length,
      history,
    })
  })
}
