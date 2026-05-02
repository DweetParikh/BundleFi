/**
 * authService.js
 * Wallet-signature-based auth: nonce generation, ed25519 verification, JWT issuance.
 */

import { PublicKey } from '@solana/web3.js'
import nacl          from 'tweetnacl'
import { createSigner, createVerifier } from 'fast-jwt'
import prisma from '../lib/prisma.js'
import redis  from '../lib/redis.js'

const JWT_SECRET  = process.env.JWT_SECRET || 'changeme-32-chars-minimum-secret!'
const NONCE_TTL   = 5 * 60   // 5 minutes in seconds

// fast-jwt signers (synchronous)
const sign   = createSigner({ key: JWT_SECRET, expiresIn: '7d' })
const verify = createVerifier({ key: JWT_SECRET })

// ─── Nonce ────────────────────────────────────────────────────────────────────

/**
 * Generate and store a human-readable nonce for the given wallet.
 * @param {string} wallet - base58 public key
 * @returns {Promise<string>} nonce
 */
export async function generateNonce(wallet) {
  const nonce = `Sign in to BundleFi: ${Date.now()}`
  await redis.set(`nonce:${wallet}`, nonce, 'EX', NONCE_TTL)
  return nonce
}

/**
 * Retrieve the stored nonce for a wallet.
 * Returns null if expired or not found.
 * @param {string} wallet
 * @returns {Promise<string|null>}
 */
export async function getNonce(wallet) {
  return redis.get(`nonce:${wallet}`)
}

/**
 * Delete the nonce after successful verification (replay protection).
 * @param {string} wallet
 */
export async function deleteNonce(wallet) {
  await redis.del(`nonce:${wallet}`)
}

// ─── Signature verification ───────────────────────────────────────────────────

/**
 * Verify a base64 ed25519 signature against a nonce using @solana/web3.js + tweetnacl.
 * @param {string} wallet    - base58 public key
 * @param {string} signature - base64-encoded signature
 * @param {string} nonce     - plaintext message that was signed
 * @returns {boolean}
 */
export function verifyWalletSignature(wallet, signature, nonce) {
  try {
    const pubKey   = new PublicKey(wallet)
    const msgBytes = new TextEncoder().encode(nonce)
    const sigBytes = Buffer.from(signature, 'base64')
    return nacl.sign.detached.verify(msgBytes, sigBytes, pubKey.toBytes())
  } catch {
    return false
  }
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

/**
 * Issue a JWT for an authenticated wallet.
 * @param {{ userId: string, wallet: string }} payload
 * @returns {string} token
 */
export function issueJwt(payload) {
  return sign(payload)
}

/**
 * Verify and decode a JWT.
 * Throws if invalid or expired.
 * @param {string} token
 * @returns {{ userId: string, wallet: string }}
 */
export function verifyJwt(token) {
  return verify(token)
}

// ─── User upsert ──────────────────────────────────────────────────────────────

/**
 * Find or create a user by wallet address.
 * @param {string} wallet
 * @returns {Promise<{ id: string, wallet: string, createdAt: Date }>}
 */
export async function upsertUser(wallet) {
  return prisma.user.upsert({
    where:  { wallet },
    update: {},
    create: { wallet },
    select: { id: true, wallet: true, createdAt: true },
  })
}
