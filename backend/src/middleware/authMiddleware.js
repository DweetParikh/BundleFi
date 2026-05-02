/**
 * authMiddleware.js
 * Fastify preHandler that reads Bearer token from Authorization header,
 * verifies the JWT, and attaches { userId, wallet } to request.user.
 */

import { verifyJwt } from '../services/authService.js'

/**
 * Strict auth — returns 401 if no valid token.
 */
export async function requireAuth(request, reply) {
  const header = request.headers['authorization'] ?? ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return reply.code(401).send({ error: 'Missing Bearer token' })
  }

  try {
    const decoded  = verifyJwt(token)
    request.user   = { userId: decoded.userId, wallet: decoded.wallet }
  } catch (err) {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }
}

/**
 * Optional auth — sets request.user if a valid token is present,
 * but does NOT reject the request if absent.
 */
export async function optionalAuth(request, _reply) {
  const header = request.headers['authorization'] ?? ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    request.user = null
    return
  }

  try {
    const decoded = verifyJwt(token)
    request.user  = { userId: decoded.userId, wallet: decoded.wallet }
  } catch {
    request.user = null
  }
}
