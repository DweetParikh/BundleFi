import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Search, AlertCircle, CheckCircle, Sliders, Activity } from 'lucide-react'
import { ALL_CRYPTOS, RISK_COLORS, formatPrice, formatPercent } from '../data/mockData'
import { useApp }    from '../context/AppContext'
import { usePrices } from '../context/PriceContext'

const BUNDLE_COLORS = ['#00d4ff','#00ff88','#9945ff','#ffb800','#ff6b35','#ec4899','#4da2ff','#00e0d3']

export default function CreateBundle() {
  const navigate = useNavigate()
  const { createBundle }                      = useApp()
  const { getPrice, getChange24h, lastUpdated } = usePrices()

  const [name,      setName]      = useState('')
  const [desc,      setDesc]      = useState('')
  const [risk,      setRisk]      = useState('Medium')
  const [color,     setColor]     = useState(BUNDLE_COLORS[0])
  const [selected,  setSelected]  = useState([])
  const [search,    setSearch]    = useState('')
  const [err,       setErr]       = useState('')
  const [submitted, setSubmitted] = useState(false)

  const enriched = useMemo(() =>
    ALL_CRYPTOS.map(c => ({
      ...c,
      livePrice:  getPrice(c.symbol),
      change24h:  getChange24h(c.symbol),
    })), [getPrice, getChange24h])

  const filteredCryptos = useMemo(() =>
    enriched.filter(c =>
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
       c.symbol.toLowerCase().includes(search.toLowerCase())) &&
      !selected.find(s => s.symbol === c.symbol)
    ), [search, selected, enriched])

  const addToken = (crypto) => {
    if (selected.length >= 15) return setErr('Maximum 15 tokens per bundle')
    const w = Math.floor(100 / (selected.length + 1))
    setSelected(prev => [...prev.map(s => ({ ...s, weight: w })), { ...crypto, weight: w }])
    setErr('')
  }

  const removeToken = (symbol) => {
    setSelected(prev => {
      const next = prev.filter(s => s.symbol !== symbol)
      if (!next.length) return []
      const w = Math.floor(100 / next.length)
      return next.map(s => ({ ...s, weight: w }))
    })
  }

  const updateWeight = (symbol, val) =>
    setSelected(prev => prev.map(s => s.symbol === symbol ? { ...s, weight: Number(val) } : s))

  const totalWeight = selected.reduce((s, t) => s + (t.weight || 0), 0)
  const weightOk    = Math.abs(totalWeight - 100) <= 2

  const submit = () => {
    if (!name.trim())        return setErr('Bundle name is required')
    if (selected.length < 2) return setErr('Add at least 2 tokens')
    if (!weightOk)           return setErr(`Weights must sum to ~100% (currently ${totalWeight}%)`)

    const bundle = createBundle({
      name: name.trim(),
      description: desc.trim() || `Custom bundle with ${selected.length} tokens`,
      risk, color, tokens: selected,
    })
    setSubmitted(true)
    setTimeout(() => navigate(`/bundle/${bundle.id}`), 1500)
  }

  if (submitted) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16 }}>
      <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--green-dim)', border:'2px solid rgba(0,255,136,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <CheckCircle size={36} color="var(--green)" />
      </div>
      <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:22 }}>Bundle Created!</h2>
      <p style={{ color:'var(--text-2)' }}>Redirecting to your bundle…</p>
    </div>
  )

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 24px' }}>
      <div style={{ marginBottom:36, animation:'fadeUp .4s ease both' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)', marginBottom:8, letterSpacing:'0.1em' }}>CREATE / CUSTOM BUNDLE</div>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(26px,4vw,40px)' }}>Build Your Bundle</h1>
          {lastUpdated && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--green)', padding:'4px 10px', borderRadius:999, background:'var(--green-dim)', border:'1px solid rgba(0,255,136,0.2)' }}>
              <Activity size={10} /> PRICES LIVE
            </div>
          )}
        </div>
        <p style={{ color:'var(--text-2)', marginTop:8 }}>Pick any tokens, set allocation weights, and deploy your strategy. All prices are live.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:24, alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Bundle metadata */}
          <div style={{ padding:24, borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:'1px solid var(--border)', animation:'fadeUp .4s .05s ease both' }}>
            <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-3)', marginBottom:16, letterSpacing:'0.07em' }}>BUNDLE DETAILS</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)', display:'block', marginBottom:6 }}>BUNDLE NAME *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="My Solana Alpha Bundle"
                  style={{ width:'100%', padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border-md)', borderRadius:'var(--r)', color:'var(--text-1)', fontFamily:'var(--font-body)', fontSize:14, outline:'none' }}
                  onFocus={e => e.target.style.borderColor='rgba(0,212,255,0.4)'}
                  onBlur={e  => e.target.style.borderColor='var(--border-md)'}
                />
              </div>
              <div>
                <label style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)', display:'block', marginBottom:6 }}>RISK LEVEL</label>
                <select value={risk} onChange={e => setRisk(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border-md)', borderRadius:'var(--r)', color:'var(--text-1)', fontFamily:'var(--font-body)', fontSize:14, outline:'none' }}>
                  {['Low','Medium','High','Very High'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)', display:'block', marginBottom:6 }}>DESCRIPTION</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe your investment thesis…" rows={2}
                style={{ width:'100%', padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border-md)', borderRadius:'var(--r)', color:'var(--text-1)', fontFamily:'var(--font-body)', fontSize:14, outline:'none', resize:'vertical' }}
                onFocus={e => e.target.style.borderColor='rgba(0,212,255,0.4)'}
                onBlur={e  => e.target.style.borderColor='var(--border-md)'}
              />
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)', display:'block', marginBottom:8 }}>ACCENT COLOR</label>
              <div style={{ display:'flex', gap:8 }}>
                {BUNDLE_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ width:26, height:26, borderRadius:'50%', cursor:'pointer', background:c, border:color===c?'3px solid white':'3px solid transparent', boxShadow:color===c?`0 0 10px ${c}80`:'none', transition:'all .15s' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Token search with LIVE prices */}
          <div style={{ padding:24, borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:'1px solid var(--border)', animation:'fadeUp .4s .1s ease both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:'0.07em' }}>ADD TOKENS ({selected.length}/15)</div>
              {lastUpdated && <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--green)' }}>● LIVE PRICES</span>}
            </div>
            <div style={{ position:'relative', marginBottom:14 }}>
              <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or symbol…"
                style={{ width:'100%', padding:'9px 12px 9px 34px', background:'var(--bg-input)', border:'1px solid var(--border-md)', borderRadius:'var(--r)', color:'var(--text-1)', fontFamily:'var(--font-body)', fontSize:13, outline:'none' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:300, overflowY:'auto' }}>
              {filteredCryptos.slice(0,25).map(c => (
                <div key={c.symbol} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:'var(--r)', background:'var(--bg-card2)', border:'1px solid var(--border)', cursor:'pointer', transition:'border-color .15s' }}
                  onClick={() => addToken(c)}
                  onMouseEnter={e => e.currentTarget.style.borderColor=`${c.color}55`}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{c.icon}</span>
                    <div>
                      <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13 }}>{c.symbol}</span>
                      <span style={{ color:'var(--text-3)', fontSize:12, marginLeft:6 }}>{c.name}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {/* Live price */}
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-1)', fontWeight:600 }}>
                      {formatPrice(c.livePrice)}
                    </span>
                    {c.change24h != null ? (
                      <span style={{ fontSize:11, color:c.change24h>=0?'var(--green)':'var(--red)', fontFamily:'var(--font-mono)' }}>
                        {c.change24h>=0?'+':''}{c.change24h.toFixed(2)}%
                      </span>
                    ) : (
                      <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>24h —</span>
                    )}
                    <Plus size={14} color="var(--text-3)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: selected tokens + weights */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ padding:24, borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:'1px solid var(--border)', animation:'fadeUp .4s .08s ease both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:'0.07em' }}>YOUR BUNDLE ({selected.length})</div>
              {selected.length > 0 && (
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color: weightOk ? 'var(--green)' : 'var(--amber)' }}>
                  {totalWeight}% / 100%
                </div>
              )}
            </div>

            {selected.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-3)', fontSize:13, border:'1px dashed var(--border-md)', borderRadius:'var(--r)' }}>
                <Sliders size={24} style={{ margin:'0 auto 8px', display:'block' }} />
                Add tokens from the list
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {selected.map(t => {
                  const lp = getPrice(t.symbol)
                  const ch = getChange24h(t.symbol)
                  return (
                    <div key={t.symbol} style={{ padding:'10px 12px', borderRadius:'var(--r)', background:'var(--bg-card2)', border:'1px solid var(--border)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span>{t.icon}</span>
                          <div>
                            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, color:t.color||'var(--text-1)' }}>{t.symbol}</span>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-2)', marginLeft:6 }}>{formatPrice(lp)}</span>
                            {ch != null && (
                              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, marginLeft:4, color:ch>=0?'var(--green)':'var(--red)' }}>
                                {ch>=0?'+':''}{ch.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--cyan)', fontWeight:600 }}>{t.weight}%</span>
                          <button onClick={() => removeToken(t.symbol)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', padding:2, transition:'color .15s' }}
                            onMouseEnter={e => e.currentTarget.style.color='var(--red)'}
                            onMouseLeave={e => e.currentTarget.style.color='var(--text-3)'}
                          ><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <input type="range" min={1} max={99} value={t.weight} onChange={e => updateWeight(t.symbol, e.target.value)} style={{ accentColor:t.color||'var(--cyan)', width:'100%' }} />
                      <div style={{ height:2, background:'var(--border)', borderRadius:1, marginTop:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${t.weight}%`, borderRadius:1, background:t.color||'var(--cyan)', transition:'width .2s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {selected.length > 0 && !weightOk && (
              <div style={{ marginTop:12, padding:'8px 12px', borderRadius:'var(--r)', background:'var(--amber-dim)', border:'1px solid rgba(255,184,0,0.25)', display:'flex', gap:8, alignItems:'center', color:'var(--amber)', fontSize:12, fontFamily:'var(--font-mono)' }}>
                <AlertCircle size={13} /> Weights sum to {totalWeight}%. Adjust to ~100%.
              </div>
            )}
          </div>

          {/* Preview card */}
          {name && selected.length >= 2 && (
            <div style={{ padding:20, borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:`1px solid ${color}40`, animation:'fadeIn .3s ease both' }}>
              <div style={{ height:2, background:`linear-gradient(90deg, ${color}, transparent)`, borderRadius:1, marginBottom:14 }} />
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:4 }}>{name}</div>
              <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:10 }}>{selected.length} tokens · {risk} Risk</div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {selected.map(t => (
                  <span key={t.symbol} style={{ padding:'2px 7px', borderRadius:5, fontSize:11, fontFamily:'var(--font-mono)', color:t.color||'var(--text-2)', background:'var(--bg-card2)', border:'1px solid var(--border)' }}>
                    {t.symbol} {t.weight}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {err && (
            <div style={{ padding:'10px 14px', borderRadius:'var(--r)', background:'var(--red-dim)', border:'1px solid rgba(255,68,102,0.25)', display:'flex', gap:8, alignItems:'center', color:'var(--red)', fontSize:13 }}>
              <AlertCircle size={14} /> {err}
            </div>
          )}

          <button onClick={submit} style={{
            width:'100%', padding:'15px', borderRadius:'var(--r)', cursor:'pointer',
            background: selected.length>=2&&name ? `linear-gradient(135deg, ${color}40, ${color}20)` : 'var(--bg-hover)',
            border:`1px solid ${selected.length>=2&&name ? color+'60' : 'var(--border)'}`,
            color: selected.length>=2&&name ? color : 'var(--text-3)',
            fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, transition:'all .2s',
          }}>Deploy Bundle →</button>

          <p style={{ fontSize:11, color:'var(--text-3)', textAlign:'center', fontFamily:'var(--font-mono)' }}>Free to create · 0.5% fee on investments</p>
        </div>
      </div>
    </div>
  )
}