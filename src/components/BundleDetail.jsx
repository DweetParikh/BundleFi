import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Users, Shield, Activity } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useApp } from '../context/AppContext'
import { usePrices } from '../context/PriceContext'
import { formatCurrency, formatPercent, formatPrice, RISK_COLORS } from '../data/mockData'
import InvestModal from './InvestModal'

export default function BundleDetail() {
  const { id }       = useParams()
  const { allBundles, portfolio } = useApp()
  const { getPrice, getChange24h, lastUpdated } = usePrices()
  const navigate     = useNavigate()
  const [investing, setInvesting] = useState(false)

  const bundle   = allBundles.find(b => b.id === id)
  const position = portfolio.find(p => p.bundleId === id)

  if (!bundle) return (
    <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--text-2)' }}>
      Bundle not found. <Link to="/" style={{ color:'var(--cyan)' }}>← Back</Link>
    </div>
  )

  // Enrich tokens with live prices
  const liveTokens = bundle.tokens.map(t => ({
    ...t,
    livePrice:  getPrice(t.symbol),
    change24h:  getChange24h(t.symbol),
  }))

  const weightedChange24h = (() => {
    const known = liveTokens.filter(t => t.change24h != null)
    if (!known.length) return null
    return known.reduce((s, t) => s + (t.change24h * t.weight / 100), 0)
  })()

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 24px' }}>
      <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:28, background:'none', border:'none', cursor:'pointer', color:'var(--text-2)', fontFamily:'var(--font-display)', fontWeight:600, fontSize:13, transition:'color .15s' }}
        onMouseEnter={e => e.currentTarget.style.color='var(--text-1)'}
        onMouseLeave={e => e.currentTarget.style.color='var(--text-2)'}
      ><ArrowLeft size={14} /> Back to Explore</button>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:20, marginBottom:32 }}>
        <div style={{ animation:'fadeUp .4s ease both' }}>
          <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ padding:'3px 12px', borderRadius:999, fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600, background:`${bundle.color||'var(--cyan)'}18`, color:bundle.color||'var(--cyan)', border:`1px solid ${bundle.color||'var(--cyan)'}30` }}>{bundle.category}</span>
            {bundle.isOfficial && <span style={{ padding:'3px 12px', borderRadius:999, fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600, background:'rgba(153,69,255,0.12)', color:'var(--purple)', border:'1px solid rgba(153,69,255,0.25)' }}>✦ OFFICIAL BUNDLE</span>}
            {position && <span style={{ padding:'3px 12px', borderRadius:999, fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600, background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(0,255,136,0.25)' }}>● YOU'RE INVESTED</span>}
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(26px,4vw,40px)', marginBottom:8 }}>{bundle.name}</h1>
          <p style={{ color:'var(--text-2)', fontSize:14, maxWidth:560, lineHeight:1.7 }}>{bundle.description}</p>
          {lastUpdated && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)' }}>
              <Activity size={10} color="var(--green)" />
              Prices live · Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button onClick={() => setInvesting(true)} style={{
          padding:'14px 32px', borderRadius:'var(--r)', cursor:'pointer',
          background:`linear-gradient(135deg, ${bundle.color||'#00d4ff'}30, ${bundle.color||'#00d4ff'}15)`,
          border:`1px solid ${bundle.color||'#00d4ff'}60`,
          color:bundle.color||'var(--cyan)',
          fontFamily:'var(--font-display)', fontWeight:700, fontSize:15,
          boxShadow:`0 0 24px ${bundle.color||'#00d4ff'}20`,
          transition:'all .2s', flexShrink:0,
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow=`0 0 36px ${bundle.color||'#00d4ff'}40`}
        onMouseLeave={e => e.currentTarget.style.boxShadow=`0 0 24px ${bundle.color||'#00d4ff'}20`}
        >Invest in Bundle →</button>
      </div>

      {/* Stats cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:12, marginBottom:32, animation:'fadeUp .4s .05s ease both' }}>
        {[
          { label:'6M RETURN',  value: bundle.apy != null ? formatPercent(bundle.apy) : '—', green: (bundle.apy??0)>0 },
          { label:'24H BUNDLE', value: weightedChange24h != null ? formatPercent(weightedChange24h) : '—', green: (weightedChange24h??0)>0 },
          { label:'7D RETURN',  value: bundle.change7d != null ? formatPercent(bundle.change7d) : '—', green: (bundle.change7d??0)>0 },
          { label:'TOTAL AUM',  value: formatCurrency(bundle.aum) },
          { label:'INVESTORS',  value: bundle.investors },
          { label:'RISK',       value: bundle.risk||'—', riskColor: RISK_COLORS[bundle.risk] },
        ].map(s => (
          <div key={s.label} style={{ padding:'18px 20px', borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:10, color:'var(--text-3)', fontFamily:'var(--font-mono)', marginBottom:6, letterSpacing:'0.07em' }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontWeight:600, fontSize:20, color:s.riskColor||(s.green?'var(--green)':'var(--text-1)') }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {/* Performance chart */}
          {bundle.chartData?.length > 0 && (
            <div style={{ padding:24, borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:'1px solid var(--border)', animation:'fadeUp .4s .1s ease both' }}>
              <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-3)', marginBottom:16, letterSpacing:'0.07em' }}>PERFORMANCE (30 DAYS)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={bundle.chartData}>
                  <defs>
                    <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={bundle.color||'#00d4ff'} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={bundle.color||'#00d4ff'} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fontFamily:'var(--font-mono)', fontSize:10, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily:'var(--font-mono)', fontSize:10, fill:'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active||!payload?.length) return null
                    return (
                      <div style={{ background:'var(--bg-card2)', border:'1px solid var(--border-md)', borderRadius:8, padding:'8px 14px', fontFamily:'var(--font-mono)', fontSize:12 }}>
                        <div style={{ color:'var(--text-3)', fontSize:10 }}>Day {payload[0].payload.day}</div>
                        <div>${payload[0].value.toFixed(2)}</div>
                      </div>
                    )
                  }} />
                  <Area type="monotone" dataKey="value" stroke={bundle.color||'#00d4ff'} strokeWidth={2} fill="url(#detailGrad)" dot={false} activeDot={{ r:4, fill:bundle.color||'#00d4ff', strokeWidth:0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Token breakdown with LIVE prices */}
          <div style={{ padding:24, borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:'1px solid var(--border)', animation:'fadeUp .4s .15s ease both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:'0.07em' }}>BUNDLE COMPOSITION — LIVE PRICES</div>
              {lastUpdated && <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--green)' }}>● LIVE</span>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {liveTokens.map(t => (
                <div key={t.symbol} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:'var(--r)', background:'var(--bg-card2)', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{t.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>
                        {t.symbol} <span style={{ color:'var(--text-3)', fontWeight:400, fontSize:12 }}>{t.name}</span>
                      </span>
                      <div style={{ display:'flex', gap:12, fontFamily:'var(--font-mono)', fontSize:12 }}>
                        {/* Live price — highlighted */}
                        <span style={{ color:'var(--text-1)', fontWeight:700 }}>{formatPrice(t.livePrice)}</span>
                        {t.change24h != null && (
                          <span style={{ color: t.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%
                          </span>
                        )}
                        {t.change6m != null && (
                          <span style={{ color:'var(--text-3)', fontSize:11 }}>+{t.change6m}% 6M</span>
                        )}
                        <span style={{ color:t.color||'var(--cyan)', fontWeight:600 }}>{t.weight}%</span>
                      </div>
                    </div>
                    <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:2, width:`${t.weight}%`, background:`linear-gradient(90deg, ${t.color||'#00d4ff'}, ${t.color||'#00d4ff'}88)`, transition:'width .5s' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Pie */}
          <div style={{ padding:24, borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:'1px solid var(--border)', animation:'fadeUp .4s .1s ease both' }}>
            <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-3)', marginBottom:12, letterSpacing:'0.07em' }}>ALLOCATION</div>
            <PieChart width={280} height={200}>
              <Pie data={bundle.tokens} dataKey="weight" nameKey="symbol" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {bundle.tokens.map(t => <Cell key={t.symbol} fill={t.color||'#00d4ff'} stroke="var(--bg-card)" strokeWidth={2} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active||!payload?.length) return null
                const t = payload[0].payload
                const lp = getPrice(t.symbol)
                return (
                  <div style={{ background:'var(--bg-card2)', border:'1px solid var(--border-md)', borderRadius:6, padding:'6px 12px', fontFamily:'var(--font-mono)', fontSize:11 }}>
                    <span style={{ color:t.color }}>{t.icon} {t.symbol}</span>
                    <span style={{ color:'var(--text-1)', marginLeft:8 }}>{t.weight}%</span>
                    <div style={{ color:'var(--text-2)', marginTop:2 }}>{formatPrice(lp)}</div>
                  </div>
                )
              }} />
            </PieChart>
          </div>

          {/* Your position */}
          {position && (
            <div style={{ padding:24, borderRadius:'var(--r-lg)', background:'var(--green-dim)', border:'1px solid rgba(0,255,136,0.2)', animation:'fadeUp .4s .15s ease both' }}>
              <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--green)', marginBottom:14, letterSpacing:'0.07em' }}>YOUR POSITION</div>
              {[
                { label:'Invested',      value:`$${position.invested.toFixed(2)}` },
                { label:'Current Value', value:`$${position.currentValue.toFixed(2)}` },
                { label:'P&L',           value:`${position.currentValue >= position.invested ? '+' : ''}$${(position.currentValue - position.invested).toFixed(2)}`, green: position.currentValue >= position.invested },
                { label:'Shares',        value: position.shares.toFixed(4) },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:10, paddingBottom:10, borderBottom:'1px solid rgba(0,255,136,0.1)' }}>
                  <span style={{ color:'var(--text-2)', fontSize:13 }}>{r.label}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600, color:r.green?'var(--green)':'var(--text-1)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div style={{ padding:20, borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:'1px solid var(--border)', animation:'fadeUp .4s .2s ease both' }}>
            <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-3)', marginBottom:12, letterSpacing:'0.07em' }}>BUNDLE INFO</div>
            {[
              { label:'Min Investment', value:`$${bundle.minInvestment}` },
              { label:'Network',        value:'Solana Mainnet'          },
              { label:'Price Source',   value:'Jupiter + CoinGecko'    },
              { label:'Rebalancing',    value:'Monthly'                 },
              { label:'Inception',      value:bundle.inception||'2024'  },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
                <span style={{ color:'var(--text-2)' }}>{r.label}</span>
                <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-1)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {investing && <InvestModal bundle={bundle} onClose={() => setInvesting(false)} />}
    </div>
  )
}
