/**
 * routes/auth.js
 * POST /auth/nonce/:wallet  — issue a nonce
 * POST /auth/verify         — verify signature, issue JWT
 */

import { z }              from 'zod'
import {
  generateNonce,
  getNonce,
  deleteNonce,
  verifyWalletSignature,
  issueJwt,
  upsertUser,
} from '../services/authService.js'
import { authRateLimitConfig } from '../middleware/rateLimiter.js'

// Zod schema for verify body
const verifySchema = z.object({
  wallet:    z.string().min(32).max(44),
  signature: z.string().min(1),
  nonce:     z.string().min(1),
})

export default async function authRoutes(fastify) {
  // ── GET /auth/nonce/:wallet ─────────────────────────────────────────────────
  fastify.get(
    '/auth/nonce/:wallet',
    {
      config: { rateLimit: authRateLimitConfig },
      schema: {
        params: { type: 'object', properties: { wallet: { type: 'string' } }, required: ['wallet'] },
      },
    },
    async (request, reply) => {
      const { wallet } = request.params

      // Basic public-key format validation
      if (!wallet || wallet.length < 32 || wallet.length > 44) {
        return reply.code(400).send({ error: 'Invalid wallet address' })
      }

      const nonce = await generateNonce(wallet)
      return reply.send({ nonce })
    }
  )

  // ── POST /auth/verify ────────────────────────────────────────────────────────
  fastify.post(
    '/auth/verify',
    {
      config: { rateLimit: authRateLimitConfig },
    },
    async (request, reply) => {
      // Validate body with Zod
      const parsed = verifySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({
          error:  'Validation failed',
          issues: parsed.error.issues,
        })
      }

      const { wallet, signature, nonce: providedNonce } = parsed.data

      // 1. Retrieve stored nonce
      const storedNonce = await getNonce(wallet)
      if (!storedNonce) {
        return reply.code(401).send({ error: 'Nonce expired or not found. Request a new one.' })
      }

      // 2. Check nonce matches what the client signed
      if (storedNonce !== providedNonce) {
        return reply.code(401).send({ error: 'Nonce mismatch' })
      }

      // 3. Verify ed25519 signature
      const valid = verifyWalletSignature(wallet, signature, storedNonce)
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid signature' })
      }

      // 4. Delete nonce (single-use)
      await deleteNonce(wallet)

      // 5. Upsert user
      const user = await upsertUser(wallet)

      // 6. Issue JWT
      const token = issueJwt({ userId: user.id, wallet: user.wallet })

      return reply.send({ token, user })
    }
  )
}
