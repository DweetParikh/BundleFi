import React, { useEffect, useRef } from 'react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { TrendingUp, Shield, Zap, ArrowRight, BarChart2 } from 'lucide-react'
import { TOP_PERFORMERS, formatPercent } from '../data/mockData'

const TICKER = [...TOP_PERFORMERS, ...TOP_PERFORMERS]

export default function Landing() {
  const { setVisible } = useWalletModal()

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}>

      {/* Hero */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'120px 24px 80px', textAlign:'center',
      }}>

        {/* Badge */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 16px', borderRadius:999,
          background:'var(--cyan-dim)', border:'1px solid rgba(0,212,255,0.3)',
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--cyan)',
          marginBottom:32, animation:'fadeUp .5s ease both',
          letterSpacing:'0.08em',
        }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--cyan)', animation:'blink 1.5s infinite' }} />
          SOON LIVE ON SOLANA
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily:'var(--font-display)', fontWeight:800,
          fontSize:'clamp(42px, 7vw, 88px)', lineHeight:1.05,
          color:'var(--text-1)', marginBottom:24,
          animation:'fadeUp .5s .1s ease both',
        }}>
          Crypto Bundles.<br />
          <span style={{
            backgroundImage:'linear-gradient(90deg, var(--cyan) 0%, var(--purple) 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>Mutual Fund Simple.</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize:'clamp(16px, 2vw, 20px)', color:'var(--text-2)', maxWidth:560,
          lineHeight:1.7, marginBottom:48,
          animation:'fadeUp .5s .2s ease both',
        }}>
          Invest in curated baskets of top-performing Solana tokens with one click.
          Or build your own custom bundle. No CEX. No KYC. Just your wallet.
        </p>

        {/* CTA */}
        <div style={{
          display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center',
          animation:'fadeUp .5s .3s ease both',
        }}>
          <button onClick={() => setVisible(true)} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'14px 32px', borderRadius:12, cursor:'pointer',
            background:'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(153,69,255,0.2))',
            border:'1px solid rgba(0,212,255,0.4)',
            color:'var(--cyan)', fontFamily:'var(--font-display)',
            fontWeight:700, fontSize:15,
            boxShadow:'0 0 30px rgba(0,212,255,0.15)',
            transition:'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 40px rgba(0,212,255,0.35)'; e.currentTarget.style.borderColor='rgba(0,212,255,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 30px rgba(0,212,255,0.15)'; e.currentTarget.style.borderColor='rgba(0,212,255,0.4)'; }}
          >
            Connect Wallet
            <ArrowRight size={16} />
          </button>
          <button style={{
            padding:'14px 32px', borderRadius:12, cursor:'pointer',
            background:'var(--bg-card)', border:'1px solid var(--border-md)',
            color:'var(--text-2)', fontFamily:'var(--font-display)', fontWeight:600, fontSize:15,
            transition:'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color='var(--text-1)'; e.currentTarget.style.borderColor='var(--border-bright)'; }}
          onMouseLeave={e => { e.currentTarget.style.color='var(--text-2)'; e.currentTarget.style.borderColor='var(--border-md)'; }}
          >
            View Bundles ↗
          </button>
        </div>

        {/* Stats row */}
        <div style={{
          display:'flex', gap:48, marginTop:80, flexWrap:'wrap', justifyContent:'center',
          animation:'fadeUp .5s .4s ease both',
        }}>
          {[
            { label:'Total AUM',    value:'$',  sub:'across all bundles' },
            { label:'Avg 6M Return',value:'%', sub:'top performer bundle', green:true },
            { label:'Bundles Live', value:'5+',      sub:'curated & custom'   }
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:'clamp(22px,3vw,30px)', fontWeight:600,
                color: s.green ? 'var(--green)' : 'var(--text-1)',
              }}>{s.value}</div>
              <div style={{ color:'var(--text-3)', fontSize:11, marginTop:2, fontFamily:'var(--font-mono)' }}>{s.label}</div>
              <div style={{ color:'var(--text-3)', fontSize:10 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticker tape */}
      <div style={{
        overflow:'hidden', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)',
        background:'rgba(0,0,0,0.3)', padding:'10px 0',
      }}>
        <div style={{
          display:'flex', gap:48,
          animation:'ticker 40s linear infinite',
          whiteSpace:'nowrap',
        }}>
          {TICKER.map((t, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:8,
              fontFamily:'var(--font-mono)', fontSize:12,
            }}>
              <span style={{ color:t.color }}>{t.icon} {t.symbol}</span>
              <span style={{ color:'var(--text-2)' }}>${t.price < 0.001 ? t.price.toFixed(6) : t.price.toFixed(2)}</span>
              <span style={{ color:'var(--green)' }}>+{t.change6m.toFixed(1)}% 6M</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',
        gap:20, padding:'64px 32px 80px', maxWidth:900, margin:'0 auto', width:'100%',
      }}>
        {[
          { icon:TrendingUp, color:'var(--green)',  title:'Top Performers Bundle',  desc:'Auto-curated from the 10 best assets over the last 6 months. Rebalanced monthly.' },
          { icon:BarChart2,  color:'var(--cyan)',   title:'Build Your Own Bundle',  desc:'Pick any crypto, set custom weights. Deploy your strategy on-chain in seconds.' },
          { icon:Shield,     color:'var(--purple)', title:'Non-Custodial & Trustless', desc:'Your keys, your crypto. Smart contracts handle allocation. Zero custody risk.' },
          { icon:Zap,        color:'var(--amber)',  title:'Solana Speed',           desc:'Transactions confirm in under a second with sub-cent fees. DeFi as it should be.' },
        ].map((f, i) => (
          <div key={i} style={{
            padding:28, borderRadius:'var(--r-lg)',
            background:'var(--bg-card)', border:'1px solid var(--border)',
            animation:`fadeUp .5s ${0.1 * i + 0.5}s ease both`,
            transition:'border-color .2s, transform .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-bright)'; e.currentTarget.style.transform='translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'; }}
          >
            <div style={{
              width:40, height:40, borderRadius:10, marginBottom:16,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:`rgba(${f.color === 'var(--green)' ? '0,255,136' : f.color === 'var(--cyan)' ? '0,212,255' : f.color === 'var(--purple)' ? '153,69,255' : '255,184,0'},0.1)`,
            }}>
              <f.icon size={20} color={f.color} />
            </div>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:8, color:'var(--text-1)' }}>
              {f.title}
            </h3>
            <p style={{ color:'var(--text-2)', fontSize:13, lineHeight:1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        borderTop:'1px solid var(--border)', padding:'20px 32px',
        display:'flex', justifyContent: 'center',
        color:'var(--text-3)', fontSize:12, fontFamily:'var(--font-mono)',
        flexWrap:'wrap', gap:12,
      }}>
        <span>© 2026 BundleFi — Built on Solana</span>
      </div>
    </div>
  )
}