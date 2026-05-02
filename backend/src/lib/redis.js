import Redis from 'ioredis'
import 'dotenv/config'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let client

function getRedis() {
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    })

    client.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })

    client.on('connect', () => {
      console.log('[Redis] Connected to', REDIS_URL.replace(/:[^@]+@/, ':***@'))
    })
  }
  return client
}

export default getRedis()
export { getRedis }
