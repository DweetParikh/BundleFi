/**
 * routes/portfolio.js
 * GET    /portfolio              — fetch user's positions with live values (auth required)
 * POST   /portfolio/invest       — record a bundle investment (auth required)
 * POST   /portfolio/withdraw     — withdraw (partial or full) from a position (auth required)
 */

import { z }           from 'zod'
import prisma          from '../lib/prisma.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { computePortfolioValue } from '../services/bundleService.js'

// ── Zod schemas ────────────────────────────────────────────────────────────────

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

const withdrawSchema = z.object({
  bundleId:    z.string().min(1),
  usdAmount:   z.number().positive(),   // amount to withdraw in USD
  // Optional on-chain tx signatures for the sell/swap legs
  signatures:  z.array(z.string()).default([]),
  simulated:   z.boolean().default(false),
})

export default async function portfolioRoutes(fastify) {

  // ── GET /portfolio ───────────────────────────────────────────────────────────
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

  // ── POST /portfolio/invest ───────────────────────────────────────────────────
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
            type:        'invest',
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

  // ── POST /portfolio/withdraw ─────────────────────────────────────────────────
  fastify.post(
    '/portfolio/withdraw',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = withdrawSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({
          error:  'Validation failed',
          issues: parsed.error.issues,
        })
      }

      const { bundleId, usdAmount, signatures, simulated } = parsed.data
      const { userId } = request.user

      // Fetch existing position
      const position = await prisma.position.findUnique({
        where: { userId_bundleId: { userId, bundleId } },
        include: { bundle: { include: { tokens: true } } },
      })

      if (!position) {
        return reply.code(404).send({ error: 'Position not found' })
      }

      // Compute current live value to determine the withdrawal fraction
      const [enriched] = await computePortfolioValue([position])
      const currentValue = enriched.currentValue

      if (usdAmount > currentValue + 0.01) {
        return reply.code(400).send({
          error: `Withdrawal amount ($${usdAmount.toFixed(2)}) exceeds current position value ($${currentValue.toFixed(2)})`,
        })
      }

      // Fraction of shares/invested being withdrawn
      const fraction       = Math.min(usdAmount / currentValue, 1)
      const investedRemoved = position.investedUsd * fraction
      const sharesRemoved   = position.shares      * fraction
      const newInvested     = position.investedUsd - investedRemoved
      const newShares       = position.shares      - sharesRemoved
      const fullExit        = newShares < 0.0001

      const result = await prisma.$transaction(async (tx) => {
        let updatedPosition = null

        if (fullExit) {
          // Delete the position entirely on full exit
          await tx.position.delete({ where: { id: position.id } })
        } else {
          // Reduce the position proportionally
          updatedPosition = await tx.position.update({
            where: { id: position.id },
            data: {
              investedUsd: newInvested,
              shares:      newShares,
            },
          })
        }

        // Record withdrawal transactions (one per signature, or a synthetic one)
        const txRecords = signatures.length > 0
          ? signatures.map((sig, i) => ({
              positionId:  position.id,
              signature:   sig,
              solAmount:   0,                  // filled in by caller if known
              usdAmount:   usdAmount / signatures.length,
              tokenSymbol: 'MULTI',
              type:        'withdraw',
              status:      simulated ? 'simulated' : 'confirmed',
              simulated,
            }))
          : [{
              positionId:  position.id,
              // Generate a deterministic placeholder when no on-chain sig provided
              signature:   `withdraw-${position.id}-${Date.now()}`,
              solAmount:   0,
              usdAmount,
              tokenSymbol: 'MULTI',
              type:        'withdraw',
              status:      'simulated',
              simulated:   true,
            }]

        await tx.transaction.createMany({ data: txRecords, skipDuplicates: true })

        // Decrease bundle AUM
        await tx.bundle.update({
          where: { id: bundleId },
          data: {
            aum:          { decrement: usdAmount },
            // Decrement investor count only on full exit
            investorCount: fullExit ? { decrement: 1 } : undefined,
          },
        })

        return updatedPosition
      })

      if (fullExit) {
        return reply.send({
          message:  'Position fully closed',
          fullExit: true,
          withdrawn: usdAmount,
        })
      }

      // Return updated enriched position
      const fullPosition = await prisma.position.findUnique({
        where: { id: result.id },
        include: {
          bundle:       { include: { tokens: true } },
          transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      })

      const [enrichedResult] = await computePortfolioValue([fullPosition])

      return reply.send({
        message:  'Withdrawal successful',
        fullExit: false,
        withdrawn: usdAmount,
        position:  enrichedResult,
      })
    }
  )
}
