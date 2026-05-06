import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL }        from '@solana/web3.js'
import {
  X, Zap, AlertTriangle, CheckCircle, Loader, ChevronDown, ChevronUp,
  RefreshCw, Droplets, ArrowRight, Info, ExternalLink,
} from 'lucide-react'

import {
  connection as devnetConnection,
  getBundleSwapQuotes,
  requestDevnetAirdrop,
  getWalletBalance,
  formatTokenAmount,
  classifyPriceImpact,
  lamportsToSol,
  solToLamports,
  MAINNET_MINTS,
  TOKEN_DECIMALS,
} from '../services/jupiterSwap'

import {
  buildInvestTransaction,
  sendInvestTransaction,
} from '../services/solanaTransfer'

import { useApp }    from '../context/AppContext'
import { usePrices } from '../context/PriceContext'
import { formatPrice } from '../data/mockData'

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIPPAGE_OPTIONS = [0.5, 1, 2, 3]

const STEPS = {
  CONFIGURE: 'configure',
  FETCHING:  'fetching',
  REVIEW:    'review',
  SIGNING:   'signing',
  SENDING:   'sending',
  DONE:      'done',
}

// ─── JupiterSwapModal ─────────────────────────────────────────────────────────

export default function JupiterSwapModal({ bundle, onClose }) {
  const { publicKey, signTransaction } = useWallet()
  const { connection: walletConn }     = useConnection()
  const conn = walletConn ?? devnetConnection

  const { investInBundle, showNotif } = useApp()
  const { getPrice }                  = usePrices()

  // ── UI state ──────────────────────────────────────────────────────────────
  const [step,         setStep]         = useState(STEPS.CONFIGURE)
  const [solInput,     setSolInput]     = useState('')
  const [slippage,     setSlippage]     = useState(1)
  const [customSlip,   setCustomSlip]   = useState('')
  const [showSlipEdit, setShowSlipEdit] = useState(false)
  const [expanded,     setExpanded]     = useState({})
  const [error,        setError]        = useState('')

  // ── Wallet / balance state ────────────────────────────────────────────────
  const [solBalance,     setSolBalance]     = useState(null)
  const [airdropLoading, setAirdropLoading] = useState(false)
  const [airdropDone,    setAirdropDone]    = useState(false)

  // ── Quote + result state ──────────────────────────────────────────────────
  const [quoteResults,    setQuoteResults]    = useState([])
  const [investmentResult, setInvestmentResult] = useState(null) // { signature, virtualPositions, usdAmount }

  const abortRef = useRef(false)

  // ── Derived values ────────────────────────────────────────────────────────
  const activeSlipBps = Math.round((customSlip ? parseFloat(customSlip) : slippage) * 100)
  const solAmount     = parseFloat(solInput) || 0
  const lamports      = solToLamports(solAmount)
  const solPrice      = getPrice('SOL') || 0

  const swappableTokens = bundle.tokens.filter(
    t => t.symbol !== 'SOL' && MAINNET_MINTS[t.symbol],
  )
  const skippedTokens = bundle.tokens.filter(
    t => t.symbol !== 'SOL' && !MAINNET_MINTS[t.symbol],
  )

  // ── Balance polling ───────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!publicKey) return
    try {
      const bal = await getWalletBalance(publicKey, conn)
      setSolBalance(bal)
    } catch { /* ignore */ }
  }, [publicKey, conn])

  useEffect(() => {
    refreshBalance()
    const id = setInterval(refreshBalance, 10_000)
    return () => clearInterval(id)
  }, [refreshBalance])

  // ── Airdrop ───────────────────────────────────────────────────────────────
  const handleAirdrop = async () => {
    if (!publicKey || airdropLoading) return
    setAirdropLoading(true)
    setError('')
    try {
      await requestDevnetAirdrop(publicKey, conn)
      await refreshBalance()
      setAirdropDone(true)
      setTimeout(() => setAirdropDone(false), 3000)
    } catch (e) {
      setError(`Airdrop failed: ${e.message}. Wait 30s and try again (rate limited).`)
    } finally {
      setAirdropLoading(false)
    }
  }

  // ── Step 1 → 2: fetch Jupiter quotes ──────────────────────────────────────
  const fetchQuotes = async () => {
    if (!solAmount || solAmount <= 0) return setError('Enter a valid SOL amount')
    if (solBalance !== null && solAmount > solBalance * 0.98) {
      return setError(`Insufficient balance. You have ${solBalance?.toFixed(4)} SOL. Request an airdrop.`)
    }
    setError('')
    setStep(STEPS.FETCHING)
    abortRef.current = false

    try {
      const results = await getBundleSwapQuotes({
        bundleTokens:     bundle.tokens,
        totalSolLamports: lamports,
        slippageBps:      activeSlipBps,
      })
      if (abortRef.current) return
      setQuoteResults(results)
      setStep(STEPS.REVIEW)
    } catch (e) {
      if (!abortRef.current) {
        setError(`Quote failed: ${e.message}`)
        setStep(STEPS.CONFIGURE)
      }
    }
  }

  // ── Step 3 → 4+5: execute REAL SOL transfer + record virtual positions ────
  const executeInvestment = async () => {
    if (!publicKey || !signTransaction) return
    setError('')
    setStep(STEPS.SIGNING)

    try {
      // ── 1. Build the real SOL transfer transaction ───────────────────────
      //    SystemProgram.transfer: user wallet → VITE_TREASURY_WALLET
      let transaction, lastValidBlockHeight
      try {
        ;({ transaction, lastValidBlockHeight } = await buildInvestTransaction(
          publicKey,
          solAmount,
          conn,
        ))
      } catch (e) {
        setError(e.message)
        setStep(STEPS.CONFIGURE)
        return
      }

      // ── 2. Sign + broadcast + confirm on Solana Devnet ───────────────────
      //    Real SOL leaves the user's wallet here.
      let signature
      setStep(STEPS.SIGNING)

      try {
        signature = await sendInvestTransaction({
          transaction,
          lastValidBlockHeight,
          signTransaction,
          connection: conn,
        })
      } catch (e) {
        const msg = e?.message ?? ''

        if (msg === 'USER_REJECTED') {
          setError('Transaction cancelled.')
          setStep(STEPS.CONFIGURE)
          return
        }

        if (msg === 'INSUFFICIENT_BALANCE') {
          setError('Insufficient SOL balance. Request an airdrop first.')
          setStep(STEPS.CONFIGURE)
          return
        }

        if (msg.includes('timed out') || msg.includes('block height')) {
          setError('Transaction timed out. Check your connection and try again.')
          setStep(STEPS.REVIEW)
          return
        }

        setError(msg || 'Transaction failed. Please try again.')
        setStep(STEPS.REVIEW)
        return
      }

      setStep(STEPS.SENDING)

      // ── 3. Calculate virtual token positions from Jupiter quotes ──────────
      //    outAmount from each quote tells us exactly how many tokens the user
      //    "receives" at today's live prices — no second API call needed.
      const usdAmount = solAmount * solPrice

      const virtualPositions = quoteResults
        .filter(r => r.quote && !r.skipped && !r.isSOL)
        .map(r => {
          const decimals    = TOKEN_DECIMALS[r.token.symbol] ?? 6
          const tokenAmount = parseFloat(r.quote.outAmount) / Math.pow(10, decimals)
          const tokenUsd    = (solAmount * r.token.weight / 100) * solPrice

          return {
            symbol:       r.token.symbol,
            weight:       r.token.weight,
            solAmount:    lamportsToSol(r.solAmount),
            usdAmount:    tokenUsd,
            tokenAmount,                               // virtual token amount
            pricePerToken: tokenUsd / tokenAmount || 0, // implied price
          }
        })

      // ── 4. Refresh balance so navbar/modal reflects the spend ─────────────
      await refreshBalance()

      // ── 5. Record investment in AppContext ────────────────────────────────
      //    This updates Portfolio page with live P&L tracking.
      investInBundle(bundle.id, usdAmount, virtualPositions, signature)

      // ── 6. TODO: POST to backend /portfolio/invest (requires JWT auth) ────
      //    Uncomment and wire up once wallet-signature auth is implemented:
      //
      // const jwtToken = localStorage.getItem('bundlefi_token')
      // if (jwtToken) {
      //   await fetch('http://localhost:3001/portfolio/invest', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type':  'application/json',
      //       'Authorization': `Bearer ${jwtToken}`,
      //     },
      //     body: JSON.stringify({
      //       bundleId:     bundle.id,
      //       solAmount,
      //       usdAmount,
      //       transactions: virtualPositions.map(p => ({
      //         symbol:    p.symbol,
      //         signature,          // same SOL tx signature for all tokens
      //         simulated: false,   // it was a real SOL transfer
      //         weight:    p.weight,
      //         solAmount: p.solAmount,
      //         usdAmount: p.usdAmount,
      //       })),
      //     }),
      //   })
      // }

      // ── 7. Store result for DoneStep ──────────────────────────────────────
      setInvestmentResult({ signature, virtualPositions, usdAmount })
      setStep(STEPS.DONE)

    } catch (e) {
      console.error('[executeInvestment] Unexpected error:', e)
      setError(e?.message ?? 'An unexpected error occurred. Please try again.')
      setStep(STEPS.REVIEW)
    }
  }

  // ── Close + cleanup ───────────────────────────────────────────────────────
  const handleClose = () => {
    abortRef.current = true
    onClose()
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const successQuotes = quoteResults.filter(r => r.quote)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(4,4,10,0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn .2s ease both',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--bg-card2)',
        border: '1px solid var(--border-md)',
        borderRadius: 'var(--r-xl)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        animation: 'fadeUp .25s ease both',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>

        {/* Color stripe */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${bundle.color || '#00d4ff'}, #9945ff, transparent)`,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px 0',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 17, color: 'var(--text-1)',
              }}>
                Invest in Bundle
              </h2>
              
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {bundle.name} · {bundle.tokens.length} tokens
            </div>
          </div>
          <button onClick={handleClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', padding: 4,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* How it works banner */}
        <div style={{
          margin: '14px 22px 0',
          padding: '10px 14px',
          borderRadius: 'var(--r)',
          background: 'rgba(0,212,255,0.05)',
          border: '1px solid rgba(0,212,255,0.15)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <Info size={13} color="var(--cyan)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
            <b style={{ color: 'var(--cyan)' }}></b>{' '}
            Your SOL transfer is real and verifiable on Solana Explorer.
          </p>
        </div>

        <div style={{ padding: '18px 22px 24px' }}>

          {step === STEPS.CONFIGURE && (
            <ConfigureStep
              bundle={bundle}
              solInput={solInput}
              setSolInput={setSolInput}
              solBalance={solBalance}
              slippage={slippage}
              setSlippage={setSlippage}
              customSlip={customSlip}
              setCustomSlip={setCustomSlip}
              showSlipEdit={showSlipEdit}
              setShowSlipEdit={setShowSlipEdit}
              slippageOptions={SLIPPAGE_OPTIONS}
              airdropLoading={airdropLoading}
              airdropDone={airdropDone}
              onAirdrop={handleAirdrop}
              onRefreshBalance={refreshBalance}
              onNext={fetchQuotes}
              error={error}
              swappableCount={swappableTokens.length}
              skippedCount={skippedTokens.length}
              bundleColor={bundle.color}
              solPrice={solPrice}
            />
          )}

          {step === STEPS.FETCHING && (
            <FetchingStep tokens={bundle.tokens} />
          )}

          {step === STEPS.REVIEW && (
            <ReviewStep
              bundle={bundle}
              solAmount={solAmount}
              solPrice={solPrice}
              quoteResults={quoteResults}
              activeSlipBps={activeSlipBps}
              expanded={expanded}
              setExpanded={setExpanded}
              onBack={() => setStep(STEPS.CONFIGURE)}
              onConfirm={executeInvestment}
              error={error}
            />
          )}

          {(step === STEPS.SIGNING || step === STEPS.SENDING) && (
            <ExecutingStep step={step} />
          )}

          {step === STEPS.DONE && investmentResult && (
            <DoneStep
              bundle={bundle}
              solAmount={solAmount}
              investmentResult={investmentResult}
              onClose={handleClose}
            />
          )}

        </div>
      </div>
    </div>
  )
}

// ─── ConfigureStep ────────────────────────────────────────────────────────────

function ConfigureStep({
  bundle, solInput, setSolInput, solBalance,
  slippage, setSlippage, customSlip, setCustomSlip,
  showSlipEdit, setShowSlipEdit, slippageOptions,
  airdropLoading, airdropDone, onAirdrop, onRefreshBalance,
  onNext, error, swappableCount, skippedCount, bundleColor, solPrice,
}) {
  const solAmount = parseFloat(solInput) || 0
  const canInvest = solAmount > 0 && swappableCount > 0
  const usdValue  = solAmount * solPrice

  return (
    <>
      {/* SOL Balance row + airdrop */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, padding: '10px 14px', borderRadius: 'var(--r)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
            DEVNET SOL BALANCE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>
            {solBalance !== null ? `◎ ${solBalance.toFixed(4)}` : '…'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onRefreshBalance} title="Refresh" style={{
            padding: '6px 8px', borderRadius: 7, cursor: 'pointer',
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            color: 'var(--text-3)',
          }}>
            <RefreshCw size={12} />
          </button>
          <button onClick={onAirdrop} disabled={airdropLoading} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 7, cursor: airdropLoading ? 'not-allowed' : 'pointer',
            background: airdropDone ? 'var(--green-dim)' : 'rgba(255,184,0,0.1)',
            border: `1px solid ${airdropDone ? 'rgba(0,255,136,0.3)' : 'rgba(255,184,0,0.3)'}`,
            color: airdropDone ? 'var(--green)' : 'var(--amber)',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, transition: 'all .2s',
          }}>
            {airdropLoading
              ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
              : <Droplets size={11} />}
            {airdropDone ? 'Got 1 SOL!' : airdropLoading ? 'Requesting…' : 'Airdrop 1 SOL'}
          </button>
        </div>
      </div>

      {/* SOL amount input */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 7, letterSpacing: '0.07em' }}>
          INVEST AMOUNT (SOL)
          {solPrice > 0 && solAmount > 0 && (
            <span style={{ color: 'var(--text-3)', marginLeft: 8, fontWeight: 400 }}>
              ≈ ${usdValue.toFixed(2)} USD
            </span>
          )}
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'var(--font-mono)', fontSize: 18, color: '#9945FF',
          }}>◎</span>
          <input
            type="number"
            value={solInput}
            onChange={e => setSolInput(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            style={{
              width: '100%', padding: '13px 14px 13px 38px',
              background: 'var(--bg-input)', border: '1px solid var(--border-md)',
              borderRadius: 'var(--r)', color: 'var(--text-1)',
              fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(153,69,255,0.5)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-md)'}
          />
          {solBalance !== null && (
            <button
              onClick={() => setSolInput((solBalance * 0.95).toFixed(4))}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11,
              }}
            >MAX</button>
          )}
        </div>

        {/* Preset amounts */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {[0.1, 0.25, 0.5, 1].map(v => (
            <button key={v} onClick={() => setSolInput(v.toString())} style={{
              padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
              background: parseFloat(solInput) === v ? `${bundleColor || 'var(--cyan)'}22` : 'var(--bg-hover)',
              border: `1px solid ${parseFloat(solInput) === v ? `${bundleColor || 'var(--cyan)'}50` : 'var(--border)'}`,
              color: parseFloat(solInput) === v ? bundleColor || 'var(--cyan)' : 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
            }}>◎{v}</button>
          ))}
        </div>
      </div>

      {/* Slippage */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.07em' }}>
            SLIPPAGE TOLERANCE
          </label>
          <button onClick={() => setShowSlipEdit(s => !s)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: 11,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            {showSlipEdit ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Custom
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {slippageOptions.map(s => (
            <button key={s} onClick={() => { setSlippage(s); setCustomSlip('') }} style={{
              flex: 1, padding: '7px 0', borderRadius: 7, cursor: 'pointer',
              background: slippage === s && !customSlip ? 'var(--cyan-dim)' : 'var(--bg-hover)',
              border: `1px solid ${slippage === s && !customSlip ? 'rgba(0,212,255,0.35)' : 'var(--border)'}`,
              color: slippage === s && !customSlip ? 'var(--cyan)' : 'var(--text-3)',
              fontFamily: 'var(--font-mono)', fontSize: 12,
            }}>{s}%</button>
          ))}
        </div>
        {showSlipEdit && (
          <div style={{ position: 'relative', marginTop: 8 }}>
            <input
              value={customSlip}
              onChange={e => setCustomSlip(e.target.value)}
              placeholder="e.g. 1.5"
              type="number" step="0.1" min="0.1" max="50"
              style={{
                width: '100%', padding: '8px 40px 8px 12px',
                background: 'var(--bg-input)', border: '1px solid var(--border-md)',
                borderRadius: 'var(--r)', color: 'var(--text-1)',
                fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>%</span>
          </div>
        )}
      </div>

      {/* Bundle breakdown */}
      <div style={{
        padding: '12px 14px', borderRadius: 'var(--r)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 12,
      }}>
        <div style={{ color: 'var(--text-3)', marginBottom: 8, fontSize: 10, letterSpacing: '0.07em' }}>
          BUNDLE BREAKDOWN
        </div>
        {bundle.tokens.slice(0, 6).map(t => {
          const hasMint = !!MAINNET_MINTS[t.symbol]
          return (
            <div key={t.symbol} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
              <span style={{ color: t.color || 'var(--text-2)' }}>{t.icon} {t.symbol}</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: 'var(--text-3)' }}>{t.weight}%</span>
                {solAmount > 0 && (
                  <span style={{ color: 'var(--text-1)' }}>◎{(solAmount * t.weight / 100).toFixed(4)}</span>
                )}
                {!hasMint && (
                  <span style={{ color: 'var(--text-3)', fontSize: 10, opacity: 0.6 }}>skip</span>
                )}
              </div>
            </div>
          )
        })}
        {bundle.tokens.length > 6 && (
          <div style={{ color: 'var(--text-3)', fontSize: 10 }}>+{bundle.tokens.length - 6} more tokens</div>
        )}
        {skippedCount > 0 && (
          <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,184,0,0.06)', color: 'var(--amber)', fontSize: 10 }}>
            ⚠ {skippedCount} non-Solana token{skippedCount > 1 ? 's' : ''} will be skipped
          </div>
        )}
      </div>

      {error && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14,
          padding: '10px 14px', borderRadius: 'var(--r)',
          background: 'var(--red-dim)', border: '1px solid rgba(255,68,102,0.25)',
          color: 'var(--red)', fontSize: 12, fontFamily: 'var(--font-mono)',
        }}>
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canInvest}
        style={{
          width: '100%', padding: '14px', borderRadius: 'var(--r)',
          cursor: canInvest ? 'pointer' : 'not-allowed',
          background: canInvest
            ? `linear-gradient(135deg, ${bundleColor || '#00d4ff'}35, ${bundleColor || '#00d4ff'}15)`
            : 'var(--bg-hover)',
          border: `1px solid ${canInvest ? `${bundleColor || '#00d4ff'}60` : 'var(--border)'}`,
          color: canInvest ? bundleColor || 'var(--cyan)' : 'var(--text-3)',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
          transition: 'all .2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Zap size={15} />
        Get Jupiter Quotes →
      </button>
    </>
  )
}

// ─── FetchingStep ─────────────────────────────────────────────────────────────

function FetchingStep({ tokens }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <Loader size={48} color="var(--cyan)"
        style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px', display: 'block' }} />
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
        Fetching Jupiter Quotes
      </div>
      <div style={{ color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
        Getting live prices for {tokens.filter(t => MAINNET_MINTS[t.symbol] && t.symbol !== 'SOL').length} tokens…
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
        {tokens.slice(0, 8).map(t => (
          <div key={t.symbol} style={{
            padding: '3px 9px', borderRadius: 6, fontSize: 11,
            fontFamily: 'var(--font-mono)', color: t.color,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
          }}>
            {t.icon} {t.symbol}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ReviewStep ───────────────────────────────────────────────────────────────

function ReviewStep({
  bundle, solAmount, solPrice, quoteResults, activeSlipBps,
  expanded, setExpanded, onBack, onConfirm, error,
}) {
  const toggleExpand  = sym => setExpanded(p => ({ ...p, [sym]: !p[sym] }))
  const successQuotes = quoteResults.filter(r => r.quote)
  const usdTotal      = solAmount * solPrice

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.07em' }}>
            JUPITER QUOTES — {successQuotes.length} READY
          </div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>● LIVE</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quoteResults.map(item => {
            if (item.skipped) return (
              <div key={item.token.symbol} style={{
                padding: '10px 12px', borderRadius: 'var(--r)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                opacity: 0.5,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
                  {item.token.icon} {item.token.symbol} — {item.reason || 'Skipped'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>SKIP</span>
              </div>
            )

            if (item.error) return (
              <div key={item.token.symbol} style={{
                padding: '10px 12px', borderRadius: 'var(--r)',
                background: 'var(--red-dim)', border: '1px solid rgba(255,68,102,0.2)',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)' }}>
                  {item.token.icon} {item.token.symbol} — {item.error}
                </div>
              </div>
            )

            if (!item.quote) return null

            const impact   = classifyPriceImpact(item.quote.priceImpactPct)
            const isExpand = expanded[item.token.symbol]
            const outAmt   = formatTokenAmount(item.quote.outAmount, item.token.symbol)
            const minOut   = formatTokenAmount(item.quote.otherAmountThreshold, item.token.symbol)

            return (
              <div key={item.token.symbol} style={{
                borderRadius: 'var(--r)', background: 'var(--bg-card)',
                border: `1px solid ${item.token.color || 'var(--border)'}30`,
                overflow: 'hidden',
              }}>
                <div onClick={() => toggleExpand(item.token.symbol)} style={{
                  padding: '11px 14px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{item.token.icon}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: item.token.color || 'var(--text-1)' }}>
                        {item.token.symbol}{' '}
                        <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>{item.token.weight}%</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                        ◎{lamportsToSol(item.solAmount).toFixed(4)} SOL in
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>
                        ~{outAmt} {item.token.symbol}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: impact.color }}>
                        impact: {impact.pct.toFixed(3)}% {impact.label}
                      </div>
                    </div>
                    {isExpand ? <ChevronUp size={12} color="var(--text-3)" /> : <ChevronDown size={12} color="var(--text-3)" />}
                  </div>
                </div>

                {isExpand && (
                  <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {[
                        { label: 'Min Received', value: `${minOut} ${item.token.symbol}` },
                        { label: 'Slippage',     value: `${activeSlipBps / 100}%` },
                        { label: 'Route Hops',   value: item.quote.routePlan?.length ?? 1 },
                        { label: 'Time Taken',   value: item.quote.timeTaken ? `${(item.quote.timeTaken * 1000).toFixed(0)}ms` : '—' },
                      ].map(r => (
                        <div key={r.label}>
                          <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>{r.label}</div>
                          <div style={{ color: 'var(--text-1)' }}>{r.value}</div>
                        </div>
                      ))}
                    </div>

                    {item.quote.routePlan?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.05em' }}>ROUTE PLAN</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9945FF' }}>SOL</span>
                          {item.quote.routePlan.map((hop, i) => (
                            <React.Fragment key={i}>
                              <ArrowRight size={10} color="var(--text-3)" />
                              <span style={{
                                padding: '2px 7px', borderRadius: 5, fontSize: 10,
                                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                                color: 'var(--text-2)', fontFamily: 'var(--font-mono)',
                              }}>
                                {hop.swapInfo?.label || 'DEX'} {hop.percent < 100 ? `${hop.percent}%` : ''}
                              </span>
                            </React.Fragment>
                          ))}
                          <ArrowRight size={10} color="var(--text-3)" />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: item.token.color || 'var(--cyan)' }}>
                            {item.token.symbol}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div style={{
        padding: '12px 14px', borderRadius: 'var(--r)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        marginBottom: 14, fontFamily: 'var(--font-mono)', fontSize: 12,
      }}>
        {[
          { label: 'Total SOL In',   value: `◎${solAmount.toFixed(4)}`,                      color: 'var(--text-1)' },
          { label: 'USD Value',      value: solPrice > 0 ? `≈ $${usdTotal.toFixed(2)}` : '—', color: 'var(--cyan)'   },
          { label: 'Tokens Priced',  value: `${successQuotes.length} / ${bundle.tokens.length}`, color: 'var(--cyan)' },
          { label: 'Max Slippage',   value: `${activeSlipBps / 100}%`,                        color: 'var(--text-1)' },
          { label: 'Transfer To',    value: 'Bundle',                                color: 'var(--amber)'  },
          { label: 'Network',        value: 'Solana',                                  color: 'var(--amber)'  },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, color: 'var(--text-2)' }}>
            <span>{r.label}</span>
            <span style={{ color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--r)',
          background: 'var(--red-dim)', border: '1px solid rgba(255,68,102,0.25)',
          color: 'var(--red)', fontSize: 12, marginBottom: 12, fontFamily: 'var(--font-mono)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: '12px', borderRadius: 'var(--r)', cursor: 'pointer',
          background: 'var(--bg-hover)', border: '1px solid var(--border-md)',
          color: 'var(--text-2)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
        }}>← Back</button>

        <button onClick={onConfirm} disabled={successQuotes.length === 0} style={{
          flex: 2, padding: '12px', borderRadius: 'var(--r)', cursor: 'pointer',
          background: successQuotes.length > 0
            ? 'linear-gradient(135deg,rgba(0,255,136,0.25),rgba(0,255,136,0.1))'
            : 'var(--bg-hover)',
          border: `1px solid ${successQuotes.length > 0 ? 'rgba(0,255,136,0.4)' : 'var(--border)'}`,
          color: successQuotes.length > 0 ? 'var(--green)' : 'var(--text-3)',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Zap size={15} />
          Confirm &amp; Invest ◎{solAmount > 0 ? solAmount.toFixed(3) : '0'}
        </button>
      </div>
    </>
  )
}

// ─── ExecutingStep ────────────────────────────────────────────────────────────

function ExecutingStep({ step }) {
  const label = step === STEPS.SIGNING
    ? 'Waiting for wallet signature…'
    : 'Broadcasting to Solana Devnet…'

  const sub = step === STEPS.SIGNING
    ? 'Check your Phantom / Solflare wallet and approve the transaction.'
    : 'Your SOL transfer is being confirmed on-chain. This takes ~5s.'

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <Loader size={48} color="var(--cyan)"
        style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px', display: 'block' }} />
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
        {sub}
      </div>
    </div>
  )
}

// ─── DoneStep ─────────────────────────────────────────────────────────────────

function DoneStep({ bundle, solAmount, investmentResult, onClose }) {
  const { signature, virtualPositions, usdAmount } = investmentResult
  const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      {/* Success icon */}
      <div style={{
        width: 68, height: 68, borderRadius: '50%', margin: '0 auto 18px',
        background: 'var(--green-dim)',
        border: '2px solid rgba(0,255,136,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle size={34} color="var(--green)" />
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
        Investment Complete! 🎉
      </h3>

      <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 20, lineHeight: 1.7, fontFamily: 'var(--font-mono)' }}>
        <strong style={{ color: 'var(--green)' }}>◎{solAmount.toFixed(4)} SOL</strong>
        {usdAmount > 0 && (
          <span style={{ color: 'var(--text-3)' }}> (≈ ${usdAmount.toFixed(2)})</span>
        )}{' '}
        deducted from your wallet and invested across{' '}
        <strong style={{ color: bundle.color || 'var(--cyan)' }}>{bundle.name}</strong>
        {' '}at live market prices.
      </p>

      {/* Real SOL transfer tx — verifiable on Solana Explorer */}
      <div style={{
        padding: '12px 14px', borderRadius: 'var(--r)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        marginBottom: 14, fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'left',
      }}>
        <div style={{ color: 'var(--text-3)', marginBottom: 6, fontSize: 10, letterSpacing: '0.07em' }}>
          SOL TRANSFER — CONFIRMED ON DEVNET
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--cyan)', textDecoration: 'none',
            wordBreak: 'break-all', fontSize: 11,
          }}
        >
          <ExternalLink size={11} style={{ flexShrink: 0 }} />
          {signature.slice(0, 24)}…{signature.slice(-8)}
        </a>
      </div>

      {/* Virtual token positions */}
      {virtualPositions.length > 0 && (
        <div style={{ marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: '0.07em' }}>
            VIRTUAL TOKEN POSITIONS (LIVE PRICES)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {virtualPositions.map(p => (
              <div key={p.symbol} style={{
                padding: '9px 14px', borderRadius: 'var(--r)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--green)', fontSize: 13 }}>✓</span>
                  <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{p.symbol}</span>
                  <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{p.weight}%</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-1)', fontWeight: 600 }}>
                    ~{p.tokenAmount >= 1
                        ? p.tokenAmount.toFixed(4)
                        : p.tokenAmount.toFixed(6)
                      } {p.symbol}
                  </div>
                  <div style={{ color: 'var(--text-3)', fontSize: 10 }}>
                    ≈ ${p.usdAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onClose} style={{
        width: '100%', padding: '13px', borderRadius: 'var(--r)',
        cursor: 'pointer', border: 'none',
        background: 'var(--green)', color: 'var(--bg-void)',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
      }}>
        View Portfolio →
      </button>
    </div>
  )
}
