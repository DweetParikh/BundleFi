/**
 * routes/portfolio.js
 * GET  /portfolio          — fetch user's positions with live values (auth required)
 * POST /portfolio/invest   — record a bundle investment (auth required)
 */

import { z }         from 'zod'
import prisma        from '../lib/prisma.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { computePortfolioValue } from '../services/bundleService.js'

// Zod schemas
const transactionSchema = z.object({
  symbol:    z.string().min(1).max(20),
  signature: z.string().min(1),
  simulated: z.boolean().default(false),
  weight:    z.number().int().min(1).max(100),
  solAmount: z.number().nonnegative().default(0),
  usdAmount: z.number().nonnegative().default(0),
})

const investSchema = z.object({
  bundleId:     z.string().min(1),
  solAmount:    z.number().positive(),
  usdAmount:    z.number().positive(),
  transactions: z.array(transactionSchema).min(1),
})

export default async function portfolioRoutes(fastify) {

  // ── GET /portfolio ────────────────────────────────────────────────────────────
  fastify.get(
    '/portfolio',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { userId } = request.user

      const positions = await prisma.position.findMany({
        where: { userId },
        include: {
          bundle: {
            include: { tokens: true },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Compute current values using live prices
      const enriched = await computePortfolioValue(positions)

      // Aggregate portfolio summary
      const totalInvested     = enriched.reduce((s, p) => s + p.investedUsd, 0)
      const totalCurrentValue = enriched.reduce((s, p) => s + p.currentValue, 0)
      const totalPnl          = totalCurrentValue - totalInvested
      const totalPnlPct       = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

      return reply.send({
        positions: enriched,
        summary: {
          totalInvested,
          totalCurrentValue,
          totalPnl,
          totalPnlPct,
          positionCount: enriched.length,
        },
      })
    }
  )

  // ── POST /portfolio/invest ────────────────────────────────────────────────────
  fastify.post(
    '/portfolio/invest',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = investSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({
          error:  'Validation failed',
          issues: parsed.error.issues,
        })
      }

      const { bundleId, solAmount, usdAmount, transactions } = parsed.data
      const { userId } = request.user

      // Validate bundle exists
      const bundle = await prisma.bundle.findUnique({ where: { id: bundleId } })
      if (!bundle) {
        return reply.code(404).send({ error: 'Bundle not found' })
      }

      // Check if user already has a position in this bundle
      const existing = await prisma.position.findUnique({
        where: { userId_bundleId: { userId, bundleId } },
      })

      const result = await prisma.$transaction(async (tx) => {
        let position

        if (existing) {
          // Increment existing position
          position = await tx.position.update({
            where: { id: existing.id },
            data: {
              investedUsd: { increment: usdAmount },
              shares:      { increment: usdAmount / 10 },
            },
          })
        } else {
          // Create new position
          position = await tx.position.create({
            data: {
              userId,
              bundleId,
              investedUsd: usdAmount,
              shares:      usdAmount / 10,
            },
          })
        }

        // Bulk create transaction records (skip duplicate signatures)
        await tx.transaction.createMany({
          data: transactions.map((t) => ({
            positionId:  position.id,
            signature:   t.signature,
            solAmount:   t.solAmount,
            usdAmount:   t.usdAmount,
            tokenSymbol: t.symbol,
            status:      t.simulated ? 'simulated' : 'confirmed',
            simulated:   t.simulated,
          })),
          skipDuplicates: true,
        })

        // Update bundle AUM
        await tx.bundle.update({
          where: { id: bundleId },
          data: {
            aum:          { increment: usdAmount },
            // Only increment investor count for new positions
            investorCount: existing ? undefined : { increment: 1 },
          },
        })

        return position
      })

      // Return enriched position
      const fullPosition = await prisma.position.findUnique({
        where: { id: result.id },
        include: {
          bundle:       { include: { tokens: true } },
          transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      })

      const [enriched] = await computePortfolioValue([fullPosition])

      return reply.code(201).send({ position: enriched })
    }
  )
}
