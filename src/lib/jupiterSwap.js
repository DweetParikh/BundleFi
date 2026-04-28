import { LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js'

const DEFAULT_SLIPPAGE_BPS = 50
const SOL_MINT = 'So11111111111111111111111111111111111111112'

const jupiterHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }
  const apiKey = import.meta.env.VITE_JUPITER_API_KEY
  if (apiKey) headers['x-api-key'] = apiKey
  return headers
}

const getBaseUrl = () => {
  return import.meta.env.VITE_JUPITER_API_BASE || 'https://lite-api.jup.ag/swap/v1'
}

export async function executeJupiterSwap({
  connection,
  publicKey,
  signTransaction,
  outputMint,
  inputAmountSol,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
}) {
  if (!publicKey) throw new Error('Connect a wallet before swapping.')
  if (!signTransaction) throw new Error('Connected wallet does not support transaction signing.')
  if (!outputMint) throw new Error('Missing output token mint for Jupiter swap.')

  const amountLamports = Math.floor(Number(inputAmountSol) * LAMPORTS_PER_SOL)
  if (!Number.isFinite(amountLamports) || amountLamports <= 0) {
    throw new Error('Swap amount is too small. Increase the amount and try again.')
  }

  const quoteParams = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint,
    amount: String(amountLamports),
    slippageBps: String(slippageBps),
    instructionVersion: 'V2',
  })

  const baseUrl = getBaseUrl()
  const quoteRes = await fetch(`${baseUrl}/quote?${quoteParams.toString()}`, {
    headers: jupiterHeaders(),
  })

  if (!quoteRes.ok) {
    throw new Error(`Failed to fetch quote (${quoteRes.status}).`)
  }

  const quoteResponse = await quoteRes.json()

  if (!quoteResponse?.routePlan?.length) {
    throw new Error('No swap route found for selected token.')
  }

  const swapRes = await fetch(`${baseUrl}/swap`, {
    method: 'POST',
    headers: jupiterHeaders(),
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  })

  if (!swapRes.ok) {
    throw new Error(`Failed to build swap transaction (${swapRes.status}).`)
  }

  const swapResponse = await swapRes.json()

  if (!swapResponse?.swapTransaction) {
    throw new Error(swapResponse?.error || 'Jupiter did not return a transaction.')
  }

  const rawTx = Uint8Array.from(atob(swapResponse.swapTransaction), c => c.charCodeAt(0))
  const transaction = VersionedTransaction.deserialize(rawTx)

  const signedTx = await signTransaction(transaction)
  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    maxRetries: 3,
    skipPreflight: false,
  })

  await connection.confirmTransaction(signature, 'confirmed')

  return {
    signature,
    outAmount: quoteResponse.outAmount,
  }
}
