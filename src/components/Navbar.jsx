import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { LayoutDashboard, Layers, PlusCircle, Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'

const LINKS = [
  { to: '/',          icon: LayoutDashboard, label: 'Explore'   },
  { to: '/portfolio', icon: Wallet,          label: 'Portfolio' },
  { to: '/create',    icon: PlusCircle,      label: 'Create Bundle' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const { totalCurrentValue } = useApp()

  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const addr = publicKey?.toBase58() ?? ''
  const short = addr ? `${addr.slice(0,4)}…${addr.slice(-4)}` : ''

  const copyAddr = () => {
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: scrolled ? 'rgba(4,4,10,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all .3s',
      display: 'flex', alignItems: 'center', padding: '0 32px',
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, marginRight:40 }}>
        <div style={{
          width:34, height:34, borderRadius:9,
          background:'linear-gradient(135deg, #00d4ff 0%, #9945ff 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-mono)', fontWeight:700, fontSize:13, color:'#fff',
          boxShadow:'0 0 16px rgba(0,212,255,0.4)',
          flexShrink:0,
        }}>B</div>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18, color:'var(--text-1)' }}>
          Bundle<span style={{ color:'var(--cyan)' }}>Fi</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display:'flex', gap:4, flex:1 }}>
        {LINKS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to
          return (
            <Link key={to} to={to} style={{
              textDecoration:'none',
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 14px', borderRadius:8,
              fontFamily:'var(--font-display)', fontWeight:600, fontSize:13,
              color: active ? 'var(--cyan)'  : 'var(--text-2)',
              background: active ? 'var(--cyan-dim)' : 'transparent',
              border: `1px solid ${active ? 'rgba(0,212,255,0.25)' : 'transparent'}`,
              transition:'all .2s',
            }}>
              <Icon size={14} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Portfolio value */}
      {totalCurrentValue > 0 && (
        <div style={{
          marginRight:16, padding:'6px 14px', borderRadius:8,
          background:'var(--green-dim)', border:'1px solid rgba(0,255,136,0.18)',
          fontFamily:'var(--font-mono)', fontSize:12, color:'var(--green)',
        }}>
          ↑ ${totalCurrentValue.toFixed(2)}
        </div>
      )}

      {/* Wallet button */}
      <div style={{ position:'relative' }}>
        <button onClick={() => setMenuOpen(v => !v)} style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'8px 16px', borderRadius:9, cursor:'pointer',
          background:'var(--bg-card2)', border:'1px solid var(--border-md)',
          color:'var(--text-1)', fontFamily:'var(--font-display)', fontWeight:600, fontSize:13,
          transition:'all .2s',
        }}>
          <div style={{
            width:8, height:8, borderRadius:'50%', background:'var(--green)',
            boxShadow:'0 0 6px var(--green)',
          }}/>
          {short}
          <ChevronDown size={12} style={{ color:'var(--text-2)' }} />
        </button>

        {menuOpen && (
          <div style={{
            position:'absolute', top:'calc(100% + 8px)', right:0,
            background:'var(--bg-card2)', border:'1px solid var(--border-md)',
            borderRadius:10, minWidth:200, overflow:'hidden',
            boxShadow:'0 16px 40px rgba(0,0,0,0.5)',
            animation:'fadeUp .15s ease both',
          }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4, fontFamily:'var(--font-mono)' }}>CONNECTED WALLET</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-2)' }}>{short}</div>
            </div>
            <button onClick={copyAddr} style={{
              width:'100%', padding:'10px 16px', background:'transparent', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', gap:8,
              color:'var(--text-2)', fontSize:13, fontFamily:'var(--font-body)',
              transition:'background .15s',
            }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
               onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
            <button onClick={() => { disconnect(); setMenuOpen(false) }} style={{
              width:'100%', padding:'10px 16px', background:'transparent', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', gap:8,
              color:'var(--red)', fontSize:13, fontFamily:'var(--font-body)',
              transition:'background .15s',
            }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
               onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:-1 }} />
      )}
    </nav>
  )
}