/**
 * rateLimiter.js
 * @fastify/rate-limit configuration.
 * Exported as a plugin options object — applied globally in server.js.
 */

export const rateLimitConfig = {
  max:       100,     // requests per window
  timeWindow: '1 minute',
  errorResponseBuilder: (_request, context) => ({
    error:      'Too Many Requests',
    message:    `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)}s.`,
    statusCode: 429,
  }),
  // Bypass rate-limit for health check endpoint
  allowList: (request) => request.url === '/health',
}

/**
 * Stricter config for auth endpoints to prevent nonce-spam / brute-force.
 */
export const authRateLimitConfig = {
  max:        10,
  timeWindow: '1 minute',
  errorResponseBuilder: (_request, context) => ({
    error:      'Too Many Requests',
    message:    `Auth rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)}s.`,
    statusCode: 429,
  }),
}
