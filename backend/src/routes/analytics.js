/**
 * routes/analytics.js
 * GET /analytics/bundle/:id — AUM, investors, APY, token breakdown for a bundle
 */

import prisma            from '../lib/prisma.js'
import { getLatestPrices } from '../services/priceService.js'
import { computeBundleNAV } from '../services/bundleService.js'

export default async function analyticsRoutes(fastify) {

  // ── GET /analytics/bundle/:id ─────────────────────────────────────────────────
  fastify.get('/analytics/bundle/:id', async (request, reply) => {
    const { id } = request.params

    const bundle = await prisma.bundle.findUnique({
      where:   { id },
      include: { tokens: true },
    })

    if (!bundle) {
      return reply.code(404).send({ error: 'Bundle not found' })
    }

    // Live price snapshot
    const { prices, changes } = await getLatestPrices()

    // Compute bundle NAV multiplier (vs fallback prices)
    const navMultiplier = computeBundleNAV(bundle.tokens, prices)

    // Aggregate transaction volume in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTransactions = await prisma.transaction.aggregate({
      where: {
        position: { bundleId: id },
        createdAt: { gte: thirtyDaysAgo },
        status:    { in: ['confirmed', 'simulated'] },
      },
      _sum:   { usdAmount:  true },
      _count: { id: true },
    })

    // Price history for APY estimation (30d high/low)
    const priceHistory30d = await prisma.priceSnapshot.findMany({
      where: {
        symbol:    bundle.tokens.map((t) => t.symbol),
        timestamp: { gte: thirtyDaysAgo },
      },
      orderBy: { timestamp: 'asc' },
      select: { symbol: true, priceUsd: true, timestamp: true },
    })

    // Per-token analytics
    const tokenAnalytics = bundle.tokens.map((token) => {
      const history = priceHistory30d.filter((p) => p.symbol === token.symbol)
      const prices30d = history.map((p) => p.priceUsd)
      const high30d   = prices30d.length ? Math.max(...prices30d) : null
      const low30d    = prices30d.length ? Math.min(...prices30d) : null
      const first30d  = prices30d[0]         ?? null
      const last30d   = prices30d[prices30d.length - 1] ?? null
      const change30d = first30d && last30d ? ((last30d - first30d) / first30d) * 100 : null

      return {
        symbol:    token.symbol,
        name:      token.name,
        weight:    token.weight,
        livePrice: prices[token.symbol]  ?? null,
        change24h: changes[token.symbol] ?? null,
        high30d,
        low30d,
        change30d,
      }
    })

    // Weighted 30d return for the bundle
    const weightedReturn30d = tokenAnalytics
      .filter((t) => t.change30d != null)
      .reduce((s, t) => s + (t.change30d * t.weight) / 100, 0)

    return reply.send({
      bundleId:      id,
      name:          bundle.name,
      aum:           bundle.aum,
      investorCount: bundle.investorCount,
      apy30d:        bundle.apy30d ?? weightedReturn30d,
      change7d:      bundle.change7d ?? null,
      navMultiplier,
      volume30d:     recentTransactions._sum.usdAmount ?? 0,
      txCount30d:    recentTransactions._count.id,
      tokenAnalytics,
      updatedAt:     new Date().toISOString(),
    })
  })
}
