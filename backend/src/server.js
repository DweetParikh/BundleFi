/**
 * server.js
 * BundleFi backend — Fastify application entry point.
 * Registers plugins, mounts routes, starts price worker, listens.
 */

import 'dotenv/config'
import Fastify           from 'fastify'
import cors              from '@fastify/cors'
import rateLimit         from '@fastify/rate-limit'

import { rateLimitConfig }  from './middleware/rateLimiter.js'
import { startPriceWorker } from './workers/pricePoll.js'

import authRoutes      from './routes/auth.js'
import bundleRoutes    from './routes/bundles.js'
import portfolioRoutes from './routes/portfolio.js'
import pricesRoutes    from './routes/prices.js'
import analyticsRoutes from './routes/analytics.js'

// ─── Build app ────────────────────────────────────────────────────────────────

export function buildApp(opts = {}) {
  const fastify = Fastify({
    logger: {
      level:     process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
    },
    ...opts,
  })

  // ── Plugins ────────────────────────────────────────────────────────────────

  // CORS
  fastify.register(cors, {
    origin:      process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })

  // Global rate limiting
  fastify.register(rateLimit, rateLimitConfig)

  // ── Health check ───────────────────────────────────────────────────────────

  fastify.get('/health', async () => ({
    status:  'ok',
    version: '1.0.0',
    time:    new Date().toISOString(),
  }))

  // ── Routes ─────────────────────────────────────────────────────────────────

  fastify.register(authRoutes,      { prefix: '/auth'      })
  fastify.register(bundleRoutes,    { prefix: '/'          })
  fastify.register(portfolioRoutes, { prefix: '/'          })
  fastify.register(pricesRoutes,    { prefix: '/'          })
  fastify.register(analyticsRoutes, { prefix: '/'          })

  // ── Global error handler ───────────────────────────────────────────────────

  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({ err: error, url: request.url }, 'Unhandled error')
    const statusCode = error.statusCode ?? 500
    return reply.code(statusCode).send({
      error:   error.name ?? 'InternalServerError',
      message: statusCode < 500 ? error.message : 'An unexpected error occurred',
    })
  })

  fastify.setNotFoundHandler((request, reply) => {
    return reply.code(404).send({ error: 'Not Found', message: `Route ${request.url} does not exist` })
  })

  return fastify
}

// ─── Start server ─────────────────────────────────────────────────────────────

async function start() {
  const PORT = parseInt(process.env.PORT ?? '3001', 10)
  const HOST = process.env.HOST ?? '0.0.0.0'

  const app = buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`\n🚀 BundleFi API running at http://localhost:${PORT}`)
    console.log(`   Health: http://localhost:${PORT}/health\n`)

    // Start background price polling worker
    startPriceWorker()
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
