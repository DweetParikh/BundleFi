import React, { useState } from 'react'
import { X, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

const PRESETS = [10, 25, 50, 100, 250, 500]

export default function InvestModal({ bundle, onClose }) {
  const { investInBundle } = useApp()
  const [amount,    setAmount]    = useState('')
  const [step,      setStep]      = useState('input') // input | confirm | loading | success
  const [err,       setErr]       = useState('')

  const numAmount = parseFloat(amount) || 0
  const fee       = numAmount * 0.005
  const net       = numAmount - fee
  const estimatedReturn = bundle.apy ? net * (1 + bundle.apy / 100) : net

  const validate = () => {
    if (numAmount < bundle.minInvestment) return setErr(`Minimum investment is $${bundle.minInvestment}`)
    if (numAmount > 100000)               return setErr('Maximum single investment is $100,000')
    setErr('')
    setStep('confirm')
  }

  const confirm = async () => {
    setStep('loading')
    // Simulate transaction delay
    await new Promise(r => setTimeout(r, 1800))
    investInBundle(bundle.id, numAmount)
    setStep('success')
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      background:'rgba(4,4,10,0.85)',
      backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24,
      animation:'fadeIn .2s ease both',
    }} onClick={e => { if(e.target===e.currentTarget) onClose() }}>

      <div style={{
        width:'100%', maxWidth:460,
        background:'var(--bg-card2)', border:'1px solid var(--border-md)',
        borderRadius:'var(--r-xl)',
        boxShadow:'0 24px 80px rgba(0,0,0,0.7)',
        overflow:'hidden',
        animation:'fadeUp .3s ease both',
      }}>

        {/* Header stripe */}
        <div style={{
          height:3,
          background:`linear-gradient(90deg, ${bundle.color || '#00d4ff'}, transparent)`,
        }} />

        {/* Modal header */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'20px 24px 0',
        }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--text-1)' }}>
              Invest in Bundle
            </h2>
            <div style={{ color:'var(--text-3)', fontSize:12, fontFamily:'var(--font-mono)', marginTop:2 }}>
              {bundle.name}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'var(--text-3)', padding:4, borderRadius:6,
            transition:'color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color='var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-3)'}
          ><X size={18} /></button>
        </div>

        <div style={{ padding:'20px 24px 24px' }}>

          {/* ── Step: Input ─────────────────────────────────────────────── */}
          {step === 'input' && (
            <>
              {/* Amount input */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)', letterSpacing:'0.07em', display:'block', marginBottom:8 }}>
                  INVESTMENT AMOUNT (USD)
                </label>
                <div style={{ position:'relative' }}>
                  <span style={{
                    position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                    fontFamily:'var(--font-mono)', fontSize:16, color:'var(--text-2)',
                  }}>$</span>
                  <input
                    type="number" value={amount} onChange={e => { setAmount(e.target.value); setErr('') }}
                    placeholder="0.00"
                    min={bundle.minInvestment}
                    style={{
                      width:'100%', padding:'14px 14px 14px 30px',
                      background:'var(--bg-input)', border:'1px solid var(--border-md)',
                      borderRadius:'var(--r)', color:'var(--text-1)',
                      fontFamily:'var(--font-mono)', fontSize:20, fontWeight:600, outline:'none',
                    }}
                    onFocus={e => e.target.style.borderColor='rgba(0,212,255,0.4)'}
                    onBlur={e  => e.target.style.borderColor='var(--border-md)'}
                  />
                </div>
              </div>

              {/* Presets */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setAmount(String(p))} style={{
                    padding:'6px 12px', borderRadius:7, cursor:'pointer',
                    background: numAmount===p ? 'var(--cyan-dim)' : 'var(--bg-hover)',
                    border:`1px solid ${numAmount===p ? 'rgba(0,212,255,0.35)' : 'var(--border)'}`,
                    color: numAmount===p ? 'var(--cyan)' : 'var(--text-2)',
                    fontFamily:'var(--font-mono)', fontSize:12,
                    transition:'all .15s',
                  }}>${p}</button>
                ))}
              </div>

              {/* Fee breakdown */}
              {numAmount > 0 && (
                <div style={{
                  padding:'14px', borderRadius:'var(--r)',
                  background:'var(--bg-card)', border:'1px solid var(--border)',
                  marginBottom:16,
                  fontFamily:'var(--font-mono)', fontSize:12,
                }}>
                  {[
                    { label:'Investment Amount', value:`$${numAmount.toFixed(2)}` },
                    { label:'Protocol Fee (0.5%)', value:`-$${fee.toFixed(2)}`, neg:true },
                    { label:'Net Invested',       value:`$${net.toFixed(2)}` },
                    { label:'Est. 6M Return',     value:`~$${estimatedReturn.toFixed(2)}`, green:true },
                  ].map(r => (
                    <div key={r.label} style={{
                      display:'flex', justifyContent:'space-between',
                      marginBottom:6, color: r.neg ? 'var(--red)' : r.green ? 'var(--green)' : 'var(--text-2)',
                    }}>
                      <span>{r.label}</span>
                      <span style={{ color: r.neg ? 'var(--red)' : r.green ? 'var(--green)' : 'var(--text-1)' }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {err && (
                <div style={{
                  display:'flex', gap:8, alignItems:'center', marginBottom:14,
                  padding:'10px 14px', borderRadius:'var(--r)',
                  background:'var(--red-dim)', border:'1px solid rgba(255,68,102,0.25)',
                  color:'var(--red)', fontSize:13,
                }}>
                  <AlertTriangle size={14} /> {err}
                </div>
              )}

              <button onClick={validate} style={{
                width:'100%', padding:'14px', borderRadius:'var(--r)', cursor:'pointer',
                background:`linear-gradient(135deg, ${bundle.color || '#00d4ff'}30, ${bundle.color || '#00d4ff'}18)`,
                border:`1px solid ${bundle.color || '#00d4ff'}60`,
                color: bundle.color || 'var(--cyan)',
                fontFamily:'var(--font-display)', fontWeight:700, fontSize:15,
                transition:'opacity .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity='.85'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
              >
                Continue →
              </button>
            </>
          )}

          {/* ── Step: Confirm ───────────────────────────────────────────── */}
          {step === 'confirm' && (
            <>
              <div style={{
                padding:16, borderRadius:'var(--r)',
                background:'var(--amber-dim)', border:'1px solid rgba(255,184,0,0.25)',
                marginBottom:20, display:'flex', gap:10, alignItems:'flex-start',
              }}>
                <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink:0, marginTop:2 }} />
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6 }}>
                  This will execute a transaction on Solana. Crypto investments carry risk.
                  Past performance does not guarantee future results.
                </p>
              </div>

              <div style={{
                padding:16, borderRadius:'var(--r)',
                background:'var(--bg-card)', border:'1px solid var(--border)',
                marginBottom:20, fontFamily:'var(--font-mono)', fontSize:13,
              }}>
                {[
                  { label:'Bundle',  value: bundle.name },
                  { label:'Network', value: 'Solana Mainnet' },
                  { label:'Amount',  value: `$${numAmount.toFixed(2)}` },
                  { label:'Fee',     value: `$${fee.toFixed(2)}` },
                ].map(r => (
                  <div key={r.label} style={{
                    display:'flex', justifyContent:'space-between',
                    marginBottom:8, color:'var(--text-2)',
                  }}>
                    <span>{r.label}</span>
                    <span style={{ color:'var(--text-1)' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep('input')} style={{
                  flex:1, padding:'12px', borderRadius:'var(--r)', cursor:'pointer',
                  background:'var(--bg-hover)', border:'1px solid var(--border-md)',
                  color:'var(--text-2)', fontFamily:'var(--font-display)', fontWeight:600, fontSize:14,
                }}>← Back</button>
                <button onClick={confirm} style={{
                  flex:2, padding:'12px', borderRadius:'var(--r)', cursor:'pointer', border:'none',
                  background:'var(--green)', color:'var(--bg-void)',
                  fontFamily:'var(--font-display)', fontWeight:700, fontSize:14,
                }}>Confirm & Invest</button>
              </div>
            </>
          )}

          {/* ── Step: Loading ───────────────────────────────────────────── */}
          {step === 'loading' && (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <Loader size={36} color="var(--cyan)" style={{ animation:'spin 1s linear infinite', marginBottom:16 }} />
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, color:'var(--text-1)', marginBottom:8 }}>
                Executing Transaction
              </div>
              <div style={{ color:'var(--text-3)', fontSize:13, fontFamily:'var(--font-mono)' }}>
                Confirming on Solana…
              </div>
            </div>
          )}

          {/* ── Step: Success ───────────────────────────────────────────── */}
          {step === 'success' && (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{
                width:64, height:64, borderRadius:'50%', margin:'0 auto 16px',
                background:'var(--green-dim)', border:'2px solid rgba(0,255,136,0.4)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <CheckCircle size={32} color="var(--green)" />
              </div>
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--text-1)', marginBottom:8 }}>
                Investment Successful!
              </h3>
              <p style={{ color:'var(--text-2)', fontSize:13, marginBottom:24 }}>
                You've invested <strong style={{ color:'var(--green)' }}>${numAmount.toFixed(2)}</strong> in {bundle.name}.
              </p>
              <div style={{
                padding:'12px 16px', borderRadius:'var(--r)',
                background:'var(--bg-card)', border:'1px solid var(--border)',
                fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-3)',
                marginBottom:20,
              }}>
                TX: {Array.from({length:12}, () => Math.floor(Math.random()*16).toString(16)).join('')}...
              </div>
              <button onClick={onClose} style={{
                width:'100%', padding:'12px', borderRadius:'var(--r)', cursor:'pointer', border:'none',
                background:'var(--green)', color:'var(--bg-void)',
                fontFamily:'var(--font-display)', fontWeight:700, fontSize:14,
              }}>Done ✓</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}