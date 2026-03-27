import React from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, PlusCircle, BarChart2, Activity } from 'lucide-react'
import { useApp }    from '../context/AppContext'
import { usePrices } from '../context/PriceContext'
import { formatCurrency, formatPercent, formatPrice } from '../data/mockData'
import MiniChart from './MiniChart'

export default function Portfolio() {
  const { portfolio, totalInvested, totalCurrentValue, totalPnL, totalPnLPct } = useApp()
  const { lastUpdated, loading } = usePrices()

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'40px 24px' }}>
      <div style={{ marginBottom:36, animation:'fadeUp .4s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:8 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)', letterSpacing:'0.1em' }}>PORTFOLIO / OVERVIEW</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)' }}>
            <Activity size={10} color={loading ? 'var(--amber)' : 'var(--green)'} />
            {loading ? 'Fetching live prices…' : lastUpdated ? `Live · ${lastUpdated.toLocaleTimeString()}` : ''}
          </div>
        </div>
        <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(26px,4vw,40px)' }}>Your Portfolio</h1>
        <p style={{ color:'var(--text-2)', marginTop:6, fontSize:14 }}>Values calculated using live market prices.</p>
      </div>

      {portfolio.length === 0 ? <EmptyState /> : (
        <>
          {/* Summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:36, animation:'fadeUp .4s .05s ease both' }}>
            {[
              { label:'TOTAL INVESTED',  value:`$${totalInvested.toFixed(2)}`,     sub:`${portfolio.length} position${portfolio.length!==1?'s':''}`, color:'var(--text-1)', Icon:Wallet },
              { label:'LIVE VALUE',      value:`$${totalCurrentValue.toFixed(2)}`,  sub:'Based on live prices',                                       color:'var(--cyan)',   Icon:BarChart2 },
              { label:'TOTAL P&L',       value:`${totalPnL>=0?'+':''}$${Math.abs(totalPnL).toFixed(2)}`, sub:formatPercent(totalPnLPct), color:totalPnL>=0?'var(--green)':'var(--red)', Icon:totalPnL>=0?TrendingUp:TrendingDown },
            ].map(s => (
              <div key={s.label} style={{ padding:'22px 24px', borderRadius:'var(--r-lg)', background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text-3)', fontFamily:'var(--font-mono)', marginBottom:8, letterSpacing:'0.07em' }}>{s.label}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontWeight:600, fontSize:24, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4, fontFamily:'var(--font-mono)' }}>{s.sub}</div>
                  </div>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <s.Icon size={16} color={s.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Positions */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {portfolio.map((pos, i) => <PositionCard key={pos.bundleId} pos={pos} index={i} />)}
          </div>
        </>
      )}
    </div>
  )
}

function PositionCard({ pos, index }) {
  const { getPrice, getChange24h } = usePrices()
  const { bundle } = pos
  if (!bundle) return null

  const pnl    = pos.currentValue - pos.invested
  const pnlPct = pos.invested > 0 ? (pnl / pos.invested) * 100 : 0

  // Live token prices for this bundle
  const liveTokens = bundle.tokens.slice(0, 4).map(t => ({
    ...t,
    livePrice: getPrice(t.symbol),
    change24h: getChange24h(t.symbol),
  }))

  return (
    <div style={{
      padding:24, borderRadius:'var(--r-lg)',
      background:'var(--bg-card)', border:'1px solid var(--border)',
      animation:`fadeUp .4s ${0.05*index+0.1}s ease both`,
      transition:'border-color .2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor=`${bundle.color||'var(--cyan)'}55`}
    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:16 }}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:bundle.color||'var(--cyan)' }} />
            <Link to={`/bundle/${bundle.id}`} style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, color:'var(--text-1)', textDecoration:'none', transition:'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--cyan)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text-1)'}
            >{bundle.name}</Link>
            {!bundle.isOfficial && <span style={{ padding:'2px 8px', borderRadius:999, fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-3)', background:'var(--bg-hover)', border:'1px solid var(--border)' }}>CUSTOM</span>}
          </div>
          {/* Live token prices row */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {liveTokens.map(t => (
              <div key={t.symbol} style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font-mono)', fontSize:11 }}>
                <span style={{ color:t.color||'var(--text-2)' }}>{t.icon} {t.symbol}</span>
                <span style={{ color:'var(--text-1)' }}>{formatPrice(t.livePrice)}</span>
                {t.change24h != null && (
                  <span style={{ color:t.change24h>=0?'var(--green)':'var(--red)', fontSize:10 }}>
                    {t.change24h>=0?'+':''}{t.change24h.toFixed(1)}%
                  </span>
                )}
              </div>
            ))}
            {bundle.tokens.length > 4 && <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>+{bundle.tokens.length-4} more</span>}
          </div>
        </div>

        {/* Mini chart */}
        {bundle.chartData?.length > 0 && (
          <div style={{ width:120, height:44 }}>
            <MiniChart data={bundle.chartData} color={pnl>=0 ? bundle.color||'#00ff88' : '#ff4466'} />
          </div>
        )}

        {/* P&L numbers */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, padding:'14px 18px', borderRadius:'var(--r)', background:'var(--bg-card2)', border:'1px solid var(--border)', fontFamily:'var(--font-mono)' }}>
          {[
            { label:'INVESTED',      value:`$${pos.invested.toFixed(2)}`,     color:'var(--text-1)' },
            { label:'LIVE VALUE',    value:`$${pos.currentValue.toFixed(2)}`,  color:'var(--cyan)'   },
            { label:'P&L',           value:`${pnl>=0?'+':''}$${Math.abs(pnl).toFixed(2)}\n${pnlPct>=0?'+':''}${pnlPct.toFixed(1)}%`, color:pnl>=0?'var(--green)':'var(--red)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:13, fontWeight:600, color:s.color, whiteSpace:'pre-line', lineHeight:1.4 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'50vh', gap:16, textAlign:'center', animation:'fadeUp .4s ease both' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--bg-card)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
        <Wallet size={32} color="var(--text-3)" />
      </div>
      <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:22 }}>No Investments Yet</h2>
      <p style={{ color:'var(--text-2)', maxWidth:400, lineHeight:1.7 }}>Explore curated bundles or create your own to start building your crypto portfolio.</p>
      <div style={{ display:'flex', gap:12, marginTop:8 }}>
        <Link to="/" style={{ textDecoration:'none', padding:'12px 24px', borderRadius:'var(--r)', background:'var(--cyan-dim)', border:'1px solid rgba(0,212,255,0.3)', color:'var(--cyan)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
          <BarChart2 size={15} /> Explore Bundles
        </Link>
        <Link to="/create" style={{ textDecoration:'none', padding:'12px 24px', borderRadius:'var(--r)', background:'var(--bg-card)', border:'1px solid var(--border-md)', color:'var(--text-2)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
          <PlusCircle size={15} /> Create Bundle
        </Link>
      </div>
    </div>
  )
}