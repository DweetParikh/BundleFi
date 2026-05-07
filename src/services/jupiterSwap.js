import {
  Connection,
  VersionedTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js'

const JUPITER_API = 'https://api.jup.ag/swap/v1'

export const SOLANA_NETWORK = 'devnet'
//export const SOLANA_NETWORK = 'mainnet-beta'

export const connection = new Connection(
  clusterApiUrl(SOLANA_NETWORK),
  'confirmed',
)

export const MAINNET_MINTS = {
  SOL:    'So11111111111111111111111111111111111111112',
  USDC:   'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  JUP:    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  WIF:    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  BONK:   'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  PYTH:   'HZ1JovNiVvGrGs7LVPLq8H4ZZuH3FtyJGJ3eFo8CupkF',
  RENDER: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  HNT:    'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
  RAY:    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA:   'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  MNGO:   'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  BTC:    '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
  ETH:    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  MYRO:   'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4',
  POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
  TRUMP:  '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
  PENGU:  '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv',
  TIA:    'secret1s9h6mrp4k9gll4zfv5h78ll68hdq8ml7jrnn20',
  SEI:    null,
  BNB:    null,
  XRP:    'Ga2AXHpfAF6mv2ekZwcsJFqu7wB4NV331qNH7fW9Nst8',
  ADA:    null,
  AVAX:   null,
  DOGE:   'AzZFACWtrLg1yMvS9n4t46qSRea22sM1n685511Wp247',
  DOT:    null,
  MATIC:  null,
  LINK:   null,
  UNI:    null,
  ATOM:   null,
  LTC:    null,
  SUI:    null,
  APT:    null,
  ARB:    null,
  OP:     null,
}

export const TOKEN_DECIMALS = {
  SOL:    9,
  USDC:   6,
  JUP:    6,
  WIF:    6,
  BONK:   5,
  PYTH:   6,
  RENDER: 8,
  HNT:    8,
  RAY:    6,
  ORCA:   6,
  MNGO:   6,
  BTC:    8,
  ETH:    8,
  MYRO:   9,
  POPCAT: 9,
}

export const solToLamports = (sol) => Math.floor(sol * LAMPORTS_PER_SOL)

export const lamportsToSol = (lam) => lam / LAMPORTS_PER_SOL

export function formatTokenAmount(rawAmount, symbol) {
  if (!rawAmount) return '0'
  const decimals = TOKEN_DECIMALS[symbol] ?? 6
  const num = Number(rawAmount) / Math.pow(10, decimals)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000)     return `${(num / 1_000).toFixed(2)}K`
  if (num >= 1)         return num.toFixed(4)
  if (num >= 0.0001)    return num.toFixed(6)
  return num.toExponential(2)
}

/**
 * Fetch the best route quote from Jupiter's Metis routing engine.
 * @param {object} opts
 * @param {string} opts.inputMint    - mainnet mint address
 * @param {string} opts.outputMint   - mainnet mint address
 * @param {number} opts.amount       - raw lamports / atomic units
 * @param {number} [opts.slippageBps=50] - basis points (50 = 0.5 %)
 * @returns {Promise<object>} quoteResponse
 */
export async function getJupiterQuote({
  inputMint,
  outputMint,
  amount,
  slippageBps = 50,
}) {
  if (!inputMint || !outputMint) {
    throw new Error('Token mint not available for this pair')
  }

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
    restrictIntermediateTokens: 'true',
    instructionVersion: 'V2',
  })

  const res = await fetch(`${JUPITER_API}/quote?${params}`)

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Jupiter quote error ${res.status}: ${body}`)
  }

  return res.json()
}

/**
 * Build a serialized VersionedTransaction from a Jupiter quote.
 * @param {object} opts
 * @param {object} opts.quoteResponse - result from getJupiterQuote()
 * @param {PublicKey|string} opts.userPublicKey
 * @returns {Promise<{swapTransaction:string, lastValidBlockHeight:number, prioritizationFeeLamports:number}>}
 */
export async function buildSwapTransaction({ quoteResponse, userPublicKey }) {
  const res = await fetch(`${JUPITER_API}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: userPublicKey.toString(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 1_000_000,
          priorityLevel: 'veryHigh',
        },
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Jupiter swap build error ${res.status}: ${body}`)
  }

  return res.json()
}

/**
 * Deserialise a base64-encoded versioned transaction returned by Jupiter.
 * @param {string} base64Tx
 * @returns {VersionedTransaction}
 */
export function deserializeTransaction(base64Tx) {
  const buf = Buffer.from(base64Tx, 'base64')
  return VersionedTransaction.deserialize(buf)
}

/**
 * Sign a VersionedTransaction with the wallet adapter and broadcast it.
 *
 * On devnet the tx will almost certainly fail because Jupiter's pools don't
 * exist there — the caller should handle the SimulationError / SendError
 * gracefully and treat it as a successful "devnet simulation" exercise.
 * @param {object} opts
 * @param {VersionedTransaction} opts.transaction
 * @param {object}  opts.wallet                  - Solana wallet adapter
 * @param {Connection} opts.conn
 * @param {number}  [opts.lastValidBlockHeight]
 * @returns {Promise<string>} signature
 */
export async function signAndSend({ transaction, wallet, conn, lastValidBlockHeight }) {
  const signed = await wallet.signTransaction(transaction)
  const signature = await conn.sendRawTransaction(signed.serialize(), {
    skipPreflight: true,
    maxRetries: 2,
  })
  try {
    const latest = await conn.getLatestBlockhash('confirmed')
    await conn.confirmTransaction(
      {
        signature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: lastValidBlockHeight ?? latest.lastValidBlockHeight,
      },
      'confirmed',
    )
  } catch {
  }

  return signature
}

/**
 * Fetch Jupiter quotes for every token in a bundle, splitting a total SOL
 * amount proportionally by weight.
 *
 * Tokens without a mainnet mint (non-Solana assets like BNB, XRP) are skipped.
 *
 * @param {object} opts
 * @param {Array}  opts.bundleTokens     - bundle.tokens array
 * @param {number} opts.totalSolLamports - total SOL to invest in lamports
 * @param {number} [opts.slippageBps=100]
 * @returns {Promise<Array>} Array of { token, solAmount, quote, error, skipped }
 */
export async function getBundleSwapQuotes({
  bundleTokens,
  totalSolLamports,
  slippageBps = 100,
}) {
  const results = await Promise.allSettled(
    bundleTokens.map(async (token) => {
      const weightFraction = token.weight / 100
      const solAmount = Math.floor(totalSolLamports * weightFraction)

      if (token.symbol === 'SOL') {
        return { token, solAmount, quote: null, isSOL: true }
      }

      const outputMint = MAINNET_MINTS[token.symbol]
      if (!outputMint) {
        return { token, solAmount, quote: null, skipped: true, reason: 'Not on Solana' }
      }

      if (solAmount < 5_000) {
        return { token, solAmount, quote: null, skipped: true, reason: 'Amount too small' }
      }

      const quote = await getJupiterQuote({
        inputMint:  MAINNET_MINTS.SOL,
        outputMint,
        amount:     solAmount,
        slippageBps,
      })

      return { token, solAmount, quote }
    }),
  )

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { token: bundleTokens[i], solAmount: 0, quote: null, error: r.reason?.message },
  )
}

/**
 * Request 1 SOL airdrop on devnet (rate-limited by the RPC).
 * @param {PublicKey} publicKey
 * @param {Connection} conn
 * @returns {Promise<string>} airdrop signature
 */
export async function requestDevnetAirdrop(publicKey, conn) {
  const sig = await conn.requestAirdrop(
    new PublicKey(publicKey.toString()),
    1 * LAMPORTS_PER_SOL,
  )
  const latest = await conn.getLatestBlockhash()
  await conn.confirmTransaction({
    signature: sig,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  })
  return sig
}

/**
 * Return the SOL balance of a wallet on devnet in SOL (not lamports).
 * @param {PublicKey|string} publicKey
 * @param {Connection} conn
 * @returns {Promise<number>}
 */
export async function getWalletBalance(publicKey, conn) {
  const lamports = await conn.getBalance(new PublicKey(publicKey.toString()))
  return lamportsToSol(lamports)
}

/**
 * Parse the priceImpactPct from a quote and return a severity label.
 * @param {string|number} pct
 * @returns {{ pct: number, label: string, color: string }}
 */
export function classifyPriceImpact(pct) {
  const n = parseFloat(pct ?? 0)
  if (n < 0.1)  return { pct: n, label: 'Minimal',  color: '#00ff88' }
  if (n < 1.0)  return { pct: n, label: 'Low',      color: '#00ff88' }
  if (n < 3.0)  return { pct: n, label: 'Medium',   color: '#ffb800' }
  if (n < 5.0)  return { pct: n, label: 'High',     color: '#ff6b35' }
  return               { pct: n, label: 'Very High', color: '#ff4466' }
}