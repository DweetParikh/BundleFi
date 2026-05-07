import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'

function getTreasuryPublicKey() {
  const addr = import.meta.env.VITE_TREASURY_WALLET
  if (!addr) {
    throw new Error(
      'VITE_TREASURY_WALLET is not set in your .env file. ' +
      'Create a second Phantom wallet on devnet and paste its address there.'
    )
  }
  try {
    return new PublicKey(addr)
  } catch {
    throw new Error(
      `VITE_TREASURY_WALLET "${addr}" is not a valid Solana public key. ` +
      'Check your .env file.'
    )
  }
}

/**
 * Build a legacy SOL transfer Transaction from the user's wallet
 * to the BundleFi treasury wallet.
 *
 * Uses a legacy Transaction (not VersionedTransaction) because it is
 * simpler to construct, sign with wallet adapters, and confirm on devnet.
 *
 * @param {PublicKey}  fromPubkey  - User's connected wallet public key
 * @param {number}     solAmount   - Amount to transfer in SOL (e.g. 0.5)
 * @param {Connection} connection  - Active Solana connection (devnet)
 * @returns {Promise<{ transaction: Transaction, lastValidBlockHeight: number }>}
 */
export async function buildInvestTransaction(fromPubkey, solAmount, connection) {
  if (!fromPubkey) throw new Error('Wallet not connected')
  if (!solAmount || solAmount <= 0) throw new Error('Invalid SOL amount')

  const treasury = getTreasuryPublicKey()
  const lamports  = Math.floor(solAmount * LAMPORTS_PER_SOL)

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash('confirmed')

  const transaction = new Transaction()

  transaction.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey:  treasury,
      lamports,
    })
  )

  transaction.recentBlockhash      = blockhash
  transaction.lastValidBlockHeight = lastValidBlockHeight
  transaction.feePayer             = fromPubkey

  return { transaction, lastValidBlockHeight }
}

/**
 * Sign the SOL transfer transaction with the user's wallet adapter,
 * broadcast it to Solana Devnet, and wait for confirmation.
 *
 * This sends REAL devnet SOL — the transaction is permanently on-chain
 * and verifiable at https://explorer.solana.com?cluster=devnet
 *
 * @param {object}     opts
 * @param {Transaction} opts.transaction         - Built by buildInvestTransaction
 * @param {number}      opts.lastValidBlockHeight - From buildInvestTransaction
 * @param {Function}    opts.signTransaction      - Wallet adapter signTransaction
 * @param {Connection}  opts.connection           - Active Solana connection
 * @returns {Promise<string>} The confirmed transaction signature
 * @throws On user rejection, insufficient funds, or network errors
 */
export async function sendInvestTransaction({
  transaction,
  lastValidBlockHeight,
  signTransaction,
  connection,
}) {
  let signedTx
  try {
    signedTx = await signTransaction(transaction)
  } catch (e) {
    const msg = e?.message ?? ''
    if (
      msg.includes('User rejected') ||
      msg.includes('rejected the request') ||
      msg.includes('cancelled') ||
      msg.includes('Transaction cancelled')
    ) {
      throw new Error('USER_REJECTED')
    }
    throw e
  }
  let signature
  try {
    signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight:       false,
      maxRetries:          3,
      preflightCommitment: 'confirmed',
    })
  } catch (e) {
    const msg = e?.message ?? ''
    if (msg.includes('0x1') || msg.includes('insufficient')) {
      throw new Error('INSUFFICIENT_BALANCE')
    }
    throw e
  }

  const { blockhash } = await connection.getLatestBlockhash('confirmed')

  try {
    const result = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    )

    if (result.value.err) {
      throw new Error(
        `Transaction landed but failed on-chain: ${JSON.stringify(result.value.err)}`
      )
    }
  } catch (e) {
    if (e?.message?.includes('block height exceeded') || e?.name === 'TransactionExpiredBlockheightExceededError') {
      console.warn('[solanaTransfer] Confirmation timed out — tx may still land:', signature)
      return signature
    }
    throw new Error(`Transaction timed out. Check your connection and try again.`)
  }

  return signature
}

/**
 * Format a SOL amount in lamports to a human-readable SOL string.
 * @param {number} lamports
 * @returns {string}
 */
export function lamportsToSolDisplay(lamports) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(6)
}