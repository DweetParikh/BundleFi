/**
 * pricePoll.js
 * node-cron job: runs every 30 seconds.
 * Calls buildPricePayload() → writes Redis + Postgres.
 */

import cron               from 'node-cron'
import { buildPricePayload } from '../services/priceService.js'

let isRunning = false

/**
 * Start the price polling worker.
 * Safe to call multiple times — idempotent.
 */
export function startPriceWorker() {
  console.log('[PriceWorker] Starting — polling every 30s')

  // Run immediately on startup
  runPoll()

  // Then schedule every 30 seconds
  cron.schedule('*/30 * * * * *', runPoll)
}

async function runPoll() {
  if (isRunning) {
    console.log('[PriceWorker] Previous poll still running, skipping')
    return
  }

  isRunning = true
  const start = Date.now()

  try {
    const { prices, updatedAt } = await buildPricePayload()
    const tokenCount = Object.keys(prices).length
    const elapsed    = Date.now() - start
    console.log(
      `[PriceWorker] Updated ${tokenCount} prices at ${updatedAt} (${elapsed}ms)`
    )
  } catch (err) {
    console.error('[PriceWorker] Poll failed:', err.message)
  } finally {
    isRunning = false
  }
}
