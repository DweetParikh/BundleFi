import React from 'react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { TrendingUp, Shield, Zap, ArrowRight, BarChart2 } from 'lucide-react'
import { TOP_PERFORMERS, formatPrice, formatPercent } from '../data/mockData'
import { usePrices } from '../context/PriceContext'

const DOUBLED = [...TOP_PERFORMERS, ...TOP_PERFORMERS]

export default function Landing() {
  const { setVisible }  = useWalletModal()
  const { getPrice, getChange24h, loading, sources } = usePrices()

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}>
      {/* Hero */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 24px 80px', textAlign:'center' }}>
        {/* Badge */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 16px', borderRadius:999,
          background:'var(--cyan-dim)', border:'1px solid rgba(0,212,255,0.3)',
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--cyan)',
          marginBottom:32, animation:'fadeUp .5s ease both', letterSpacing:'0.08em',
        }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--cyan)', animation:'blink 1.5s infinite' }} />
          SOON LIVE ON SOLANA
          {sources.coingecko || sources.jupiter ? (
            <span style={{ color:'var(--green)', marginLeft:4 }}>· PRICES LIVE</span>
          ) : loading ? (
            <span style={{ color:'var(--amber)', marginLeft:4 }}>· FETCHING PRICES…</span>
          ) : null}
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily:'var(--font-display)', fontWeight:800,
          fontSize:'clamp(42px, 7vw, 88px)', lineHeight:1.05,
          color:'var(--text-1)', marginBottom:24,
          animation:'fadeUp .5s .1s ease both',
        }}>
          Crypto Bundles.<br />
          <span style={{ backgroundImage:'linear-gradient(90deg, var(--cyan) 0%, var(--purple) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Mutual Fund Simple.
          </span>
        </h1>

        <p style={{ fontSize:'clamp(16px,2vw,20px)', color:'var(--text-2)', maxWidth:560, lineHeight:1.7, marginBottom:48, animation:'fadeUp .5s .2s ease both' }}>
          Invest in curated baskets of top-performing tokens with one click. Or build your own. No CEX. No KYC. Just your wallet.
        </p>

        {/* CTA */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center', animation:'fadeUp .5s .3s ease both' }}>
          <button onClick={() => setVisible(true)} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'14px 32px', borderRadius:12, cursor:'pointer',
            background:'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(153,69,255,0.2))',
            border:'1px solid rgba(0,212,255,0.4)', color:'var(--cyan)',
            fontFamily:'var(--font-display)', fontWeight:700, fontSize:15,
            boxShadow:'0 0 30px rgba(0,212,255,0.15)', transition:'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 40px rgba(0,212,255,0.35)'; e.currentTarget.style.borderColor='rgba(0,212,255,0.7)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 30px rgba(0,212,255,0.15)'; e.currentTarget.style.borderColor='rgba(0,212,255,0.4)' }}
          >
            Connect Wallet <ArrowRight size={16} />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:48, marginTop:80, flexWrap:'wrap', justifyContent:'center', animation:'fadeUp .5s .4s ease both' }}>
          {[
            { label:'AVG 6M RETURN', value:'+218%',   sub:'top performer bundle', green:true },
            { label:'LIVE PRICES',   value: sources.jupiter ? 'Jupiter' : sources.coingecko ? 'Jupiter' : '—', sub:'updated every 30s' },
            { label:'CHAIN',         value:'Solana',  sub:'<0.01s finality'      },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'clamp(22px,3vw,30px)', fontWeight:600, color: s.green ? 'var(--green)' : 'var(--text-1)' }}>
                {s.value}
              </div>
              <div style={{ color:'var(--text-3)', fontSize:11, marginTop:2, fontFamily:'var(--font-mono)', letterSpacing:'0.05em' }}>{s.label}</div>
              <div style={{ color:'var(--text-3)', fontSize:10 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Ticker Tape */}
      <div style={{ overflow:'hidden', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.3)', padding:'10px 0' }}>
        <div style={{ display:'flex', gap:48, animation:'ticker 40s linear infinite', whiteSpace:'nowrap' }}>
          {DOUBLED.map((t, i) => {
            const livePrice  = getPrice(t.symbol)
            const change     = getChange24h(t.symbol)
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-mono)', fontSize:12 }}>
                <span style={{ color:t.color }}>{t.icon} {t.symbol}</span>
                <span style={{ color:'var(--text-1)', fontWeight:600 }}>{formatPrice(livePrice)}</span>
                {change != null ? (
                  <span style={{ color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                  </span>
                ) : (
                  <span style={{ color:'var(--green)' }}>+{t.change6m}% 6M</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20, padding:'64px 32px 80px', maxWidth:900, margin:'0 auto', width:'100%' }}>
        {[
          { icon:TrendingUp, color:'var(--green)',  title:'Top Performers Bundle',  desc:'Auto-curated from the 10 best assets over the last 6 months. Rebalanced monthly.' },
          { icon:BarChart2,  color:'var(--cyan)',   title:'Build Your Own Bundle',  desc:'Pick any crypto, set custom weights. Deploy your strategy on-chain in seconds.' },
          { icon:Shield,     color:'var(--purple)', title:'Non-Custodial',          desc:'Your keys, your crypto. Smart contracts handle allocation. Zero custody risk.' },
          { icon:Zap,        color:'var(--amber)',  title:'Live Price Feeds',       desc:'Prices pulled from Jupiter (Solana) + CoinGecko every 30 seconds — always fresh.' },
        ].map((f, i) => (
          <div key={i} style={{
            padding:28, borderRadius:'var(--r-lg)',
            background:'var(--bg-card)', border:'1px solid var(--border)',
            animation:`fadeUp .5s ${0.1*i+0.5}s ease both`,
            transition:'border-color .2s, transform .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-bright)'; e.currentTarget.style.transform='translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none' }}
          >
            <div style={{ width:40, height:40, borderRadius:10, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center', background:`${f.color}18` }}>
              <f.icon size={20} color={f.color} />
            </div>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:8 }}>{f.title}</h3>
            <p style={{ color:'var(--text-2)', fontSize:13, lineHeight:1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ borderTop:'1px solid var(--border)', padding:'20px 32px', display:'flex', justifyContent:'center', color:'var(--text-3)', fontSize:12, fontFamily:'var(--font-mono)', flexWrap:'wrap', gap:12 }}>
        <span>© 2026 BundleFi — Built on Solana</span>
      </div>
    </div>
  )
}