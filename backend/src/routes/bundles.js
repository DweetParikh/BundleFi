/**
 * routes/bundles.js
 * GET  /bundles          — list all bundles (filtered + sorted)
 * POST /bundles          — create a custom bundle (auth required)
 * GET  /bundles/:id      — single bundle detail (optional auth)
 * DELETE /bundles/:id    — delete bundle (auth required, creator only)
 */

import { z }            from 'zod'
import prisma           from '../lib/prisma.js'
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js'
import { normalizeWeights }          from '../services/bundleService.js'
import { getLatestPrices }           from '../services/priceService.js'

// Zod schema for creating a bundle
const tokenSchema = z.object({
  symbol: z.string().min(1).max(20),
  name:   z.string().min(1).max(80),
  weight: z.number().int().min(1).max(99),
  color:  z.string().default('#00d4ff'),
  icon:   z.string().default('●'),
})

const createBundleSchema = z.object({
  name:        z.string().min(1).max(80),
  description: z.string().max(500).default(''),
  risk:        z.enum(['Low', 'Medium', 'High', 'Very High']).default('Medium'),
  color:       z.string().default('#00d4ff'),
  tokens:      z
    .array(tokenSchema)
    .min(2, 'At least 2 tokens required')
    .max(15, 'Maximum 15 tokens'),
}).refine(
  (data) => {
    const total = data.tokens.reduce((s, t) => s + t.weight, 0)
    return Math.abs(total - 100) <= 2
  },
  { message: 'Token weights must sum to ~100 (±2)' }
)

export default async function bundleRoutes(fastify) {

  // ── GET /bundles ─────────────────────────────────────────────────────────────
  fastify.get('/bundles', async (request, reply) => {
    const { category, official } = request.query

    const where = {}
    if (category)          where.category  = category
    if (official === 'true') where.isOfficial = true

    const bundles = await prisma.bundle.findMany({
      where,
      include: {
        tokens:  true,
        creator: { select: { id: true, wallet: true } },
      },
      orderBy: { investorCount: 'desc' },
    })

    return reply.send({ bundles })
  })

  // ── GET /bundles/:id ──────────────────────────────────────────────────────────
  fastify.get(
    '/bundles/:id',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      const { id } = request.params

      const bundle = await prisma.bundle.findUnique({
        where:   { id },
        include: {
          tokens:  true,
          creator: { select: { id: true, wallet: true } },
        },
      })

      if (!bundle) {
        return reply.code(404).send({ error: 'Bundle not found' })
      }

      // Attach live price snapshots for each token
      const { prices, changes } = await getLatestPrices()
      const enrichedTokens = bundle.tokens.map((t) => ({
        ...t,
        livePrice: prices[t.symbol]  ?? null,
        change24h: changes[t.symbol] ?? null,
      }))

      // Check if the requesting user is invested
      let isInvested = false
      if (request.user?.userId) {
        const position = await prisma.position.findUnique({
          where: { userId_bundleId: { userId: request.user.userId, bundleId: id } },
        })
        isInvested = !!position
      }

      return reply.send({
        bundle: { ...bundle, tokens: enrichedTokens, isInvested },
      })
    }
  )

  // ── POST /bundles ─────────────────────────────────────────────────────────────
  fastify.post(
    '/bundles',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsed = createBundleSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({
          error:  'Validation failed',
          issues: parsed.error.issues,
        })
      }

      const { name, description, risk, color, tokens } = parsed.data

      // Normalize weights to exactly 100
      const normalizedTokens = normalizeWeights(tokens)

      // Create bundle + tokens in a transaction
      const bundle = await prisma.$transaction(async (tx) => {
        const created = await tx.bundle.create({
          data: {
            name,
            description,
            category:     'Custom',
            risk,
            color,
            isOfficial:   false,
            creatorId:    request.user.userId,
            minInvestment: 1,
            inception:    new Date().toISOString().slice(0, 10),
            tokens: {
              create: normalizedTokens.map((t) => ({
                symbol: t.symbol,
                name:   t.name,
                weight: t.weight,
                color:  t.color,
                icon:   t.icon,
              })),
            },
          },
          include: { tokens: true },
        })
        return created
      })

      return reply.code(201).send({ bundle })
    }
  )

  // ── DELETE /bundles/:id ───────────────────────────────────────────────────────
  fastify.delete(
    '/bundles/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params

      const bundle = await prisma.bundle.findUnique({ where: { id } })
      if (!bundle) {
        return reply.code(404).send({ error: 'Bundle not found' })
      }

      if (bundle.isOfficial) {
        return reply.code(403).send({ error: 'Official bundles cannot be deleted' })
      }

      if (bundle.creatorId !== request.user.userId) {
        return reply.code(403).send({ error: 'Only the creator can delete this bundle' })
      }

      await prisma.bundle.delete({ where: { id } })

      return reply.send({ success: true })
    }
  )
}
