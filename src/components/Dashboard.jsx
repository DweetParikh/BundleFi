import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Search, Activity, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { usePrices } from '../context/PriceContext'
import { formatCurrency, formatPercent, formatPrice, RISK_COLORS, CATEGORY_COLORS, TOP_PERFORMERS } from '../data/mockData'
import MiniChart from './MiniChart'
import InvestModal from './InvestModal'

const CATEGORIES = ['All','Growth','DeFi','Meme','Conservative','Thematic','Custom']

export default function Dashboard() {
  const { allBundles }  = useApp()
  const { getPrice, getChange24h, lastUpdated, loading } = usePrices()
  const [search,        setSearch]        = useState('')
  const [cat,           setCat]           = useState('All')
  const [investBundle,  setInvestBundle]  = useState(null)

  const filtered = allBundles.filter(b => {
    const ms = b.name.toLowerCase().includes(search.toLowerCase()) ||
               b.description.toLowerCase().includes(search.toLowerCase())
    return ms && (cat === 'All' || b.category === cat)
  })

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom:36, animation:'fadeUp .4s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <TrendingUp size={20} color="var(--cyan)" />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)', letterSpacing:'0.1em' }}>EXPLORE / ALL BUNDLES</span>
          </div>
          {/* Live indicator */}
          <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)' }}>
            <Activity size={11} color={loading ? 'var(--amber)' : 'var(--green)'} />
            {loading ? 'Fetching live prices…' : lastUpdated ? `Prices updated ${lastUpdated.toLocaleTimeString()}` : ''}
          </div>
        </div>
        <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(28px,4vw,44px)' }}>Crypto Bundles</h1>
        <p style={{ color:'var(--text-2)', marginTop:8 }}>Curated baskets of top-performing tokens. Invest in one or build your own.</p>
      </div>

      {/* Top 10 live bar */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'16px 20px', marginBottom:28, overflow:'hidden', animation:'fadeUp .4s .05s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:'0.08em' }}>TOP 10 PERFORMERS — LIVE PRICES</span>
          {!loading && <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)' }} />}
        </div>
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
          {TOP_PERFORMERS.map(t => {
            const lp  = getPrice(t.symbol)
            const ch  = getChange24h(t.symbol)
            return (
              <div key={t.symbol} style={{ flexShrink:0, padding:'10px 14px', borderRadius:8, background:'var(--bg-card2)', border:'1px solid var(--border)', textAlign:'center', minWidth:96 }}>
                <div style={{ fontSize:18, marginBottom:2 }}>{t.icon}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:t.color, fontWeight:600 }}>{t.symbol}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-1)', fontWeight:700, marginTop:2 }}>{formatPrice(lp)}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color: ch == null ? 'var(--green)' : ch >= 0 ? 'var(--green)' : 'var(--red)', marginTop:1 }}>
                  {ch != null ? `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%` : `+${t.change6m}% 6M`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', animation:'fadeUp .4s .1s ease both' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bundles…"
            style={{ width:'100%', padding:'10px 12px 10px 36px', background:'var(--bg-input)', border:'1px solid var(--border-md)', borderRadius:'var(--r)', color:'var(--text-1)', fontFamily:'var(--font-body)', fontSize:14, outline:'none' }} />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding:'8px 14px', borderRadius:'var(--r)', cursor:'pointer',
              background: cat===c ? 'var(--cyan-dim)' : 'var(--bg-card)',
              color: cat===c ? 'var(--cyan)' : 'var(--text-2)',
              border:`1px solid ${cat===c ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
              fontFamily:'var(--font-display)', fontWeight:600, fontSize:12, transition:'all .15s',
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Bundle grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
        {filtered.map((bundle, i) => (
          <BundleCard key={bundle.id} bundle={bundle} index={i} onInvest={() => setInvestBundle(bundle)} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'var(--text-3)' }}>No bundles found.</div>
        )}
      </div>

      {investBundle && <InvestModal bundle={investBundle} onClose={() => setInvestBundle(null)} />}
    </div>
  )
}

function BundleCard({ bundle, index, onInvest }) {
  const { portfolio } = useApp()
  const { getPrice, getChange24h } = usePrices()
  const isInvested = portfolio.some(p => p.bundleId === bundle.id)
  const catColor   = CATEGORY_COLORS[bundle.category] || 'var(--cyan)'

  const liveTokens = bundle.tokens.map(t => ({
    ...t,
    livePrice:  getPrice(t.symbol),
    change24h:  getChange24h(t.symbol),
  }))

  const avgChange24h = (() => {
    const known = liveTokens.filter(t => t.change24h != null)
    if (!known.length) return null
    return known.reduce((s, t) => s + (t.change24h * t.weight / 100), 0)
  })()

  return (
    <div style={{
      background:'var(--bg-card)', border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)', overflow:'hidden',
      animation:`fadeUp .4s ${0.05*index}s ease both`,
      transition:'border-color .2s, transform .2s, box-shadow .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor=`${bundle.color || '#00d4ff'}55`; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.4)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
    >
      <div style={{ height:3, background:`linear-gradient(90deg, ${bundle.color || 'var(--cyan)'}, transparent)` }} />
      <div style={{ padding:24 }}>
        {/* Title row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' }}>
              <span style={{ padding:'2px 9px', borderRadius:999, fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600, letterSpacing:'0.05em', background:`${catColor}18`, color:catColor, border:`1px solid ${catColor}30` }}>{bundle.category}</span>
              {bundle.isOfficial && <span style={{ padding:'2px 9px', borderRadius:999, fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600, background:'rgba(153,69,255,0.12)', color:'var(--purple)', border:'1px solid rgba(153,69,255,0.25)' }}>✦ OFFICIAL</span>}
              {isInvested && <span style={{ padding:'2px 9px', borderRadius:999, fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600, background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(0,255,136,0.25)' }}>● INVESTED</span>}
            </div>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17 }}>{bundle.name}</h3>
          </div>
          <div style={{ textAlign:'right', fontFamily:'var(--font-mono)' }}>
            <div style={{ fontSize:20, fontWeight:600, color: bundle.apy ? 'var(--green)' : 'var(--text-3)' }}>
              {bundle.apy ? `+${bundle.apy.toFixed(1)}%` : 'N/A'}
            </div>
            <div style={{ fontSize:10, color:'var(--text-3)' }}>6M RETURN</div>
            {avgChange24h != null && (
              <div style={{ fontSize:11, color: avgChange24h >= 0 ? 'var(--green)' : 'var(--red)', marginTop:2 }}>
                {avgChange24h >= 0 ? '▲' : '▼'} {Math.abs(avgChange24h).toFixed(2)}% 24H
              </div>
            )}
          </div>
        </div>

        <p style={{ color:'var(--text-2)', fontSize:13, lineHeight:1.6, marginBottom:16 }}>{bundle.description}</p>

        {bundle.chartData?.length > 0 && (
          <div style={{ marginBottom:16, height:60 }}>
            <MiniChart data={bundle.chartData} color={bundle.color || '#00d4ff'} />
          </div>
        )}

        {/* Live token chips */}
        <div style={{ display:'flex', gap:5, marginBottom:16, flexWrap:'wrap' }}>
          {liveTokens.slice(0,6).map(t => (
            <div key={t.symbol} style={{
              padding:'4px 8px', borderRadius:6, fontSize:10,
              fontFamily:'var(--font-mono)', fontWeight:500,
              background:'var(--bg-card2)', border:'1px solid var(--border)',
              color: t.color || 'var(--text-2)',
            }}>
              {t.icon} {t.symbol} {t.weight}%
              <span style={{ color:'var(--text-3)', marginLeft:4 }}>{formatPrice(t.livePrice)}</span>
            </div>
          ))}
          {bundle.tokens.length > 6 && (
            <div style={{ padding:'4px 8px', borderRadius:6, fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-3)', background:'var(--bg-card2)', border:'1px solid var(--border)' }}>
              +{bundle.tokens.length - 6}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16, padding:12, borderRadius:'var(--r)', background:'var(--bg-card2)', border:'1px solid var(--border)' }}>
          {[
            { label:'AUM',       value: bundle.aum > 0 ? formatCurrency(bundle.aum) : '—' },
            { label:'7D',        value: bundle.change7d != null ? formatPercent(bundle.change7d) : '—', green: (bundle.change7d ?? 0) > 0 },
            { label:'INVESTORS', value: bundle.investors },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600, color: s.green ? 'var(--green)' : 'var(--text-1)' }}>{s.value}</div>
              <div style={{ fontSize:10, color:'var(--text-3)', fontFamily:'var(--font-mono)', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Risk + min */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>RISK</span>
            <span style={{ padding:'2px 10px', borderRadius:999, fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600, color:RISK_COLORS[bundle.risk]||'var(--text-2)', background:`${RISK_COLORS[bundle.risk]||'#fff'}18`, border:`1px solid ${RISK_COLORS[bundle.risk]||'#fff'}30` }}>{bundle.risk||'—'}</span>
          </div>
          <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>MIN ${bundle.minInvestment}</span>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8 }}>
          <Link to={`/bundle/${bundle.id}`} style={{
            flex:1, textDecoration:'none', padding:'10px', borderRadius:'var(--r)', textAlign:'center',
            background:'var(--bg-hover)', border:'1px solid var(--border-md)',
            color:'var(--text-2)', fontFamily:'var(--font-display)', fontWeight:600, fontSize:13, transition:'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color='var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-2)'}
          >Details</Link>
          <button onClick={onInvest} style={{
            flex:2, padding:'10px', borderRadius:'var(--r)', cursor:'pointer',
            background:`linear-gradient(135deg, ${bundle.color||'#00d4ff'}33, ${bundle.color||'#00d4ff'}18)`,
            border:`1px solid ${bundle.color||'#00d4ff'}55`,
            color:bundle.color||'var(--cyan)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, transition:'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity='.85'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}
          >Invest Now →</button>
        </div>
      </div>
    </div>
  )
}