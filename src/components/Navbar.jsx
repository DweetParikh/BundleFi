import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { LayoutDashboard, Wallet, PlusCircle, ChevronDown, LogOut, Copy, Check, Activity, Droplets } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { usePrices } from '../context/PriceContext'
import { formatPrice } from '../data/mockData'
import { getWalletBalance, requestDevnetAirdrop, SOLANA_NETWORK } from '../services/jupiterSwap'

const LINKS = [
  { to: '/',          icon: LayoutDashboard, label: 'Explore'       },
  { to: '/portfolio', icon: Wallet,          label: 'Portfolio'     },
  { to: '/create',    icon: PlusCircle,      label: 'Create Bundle' },
]

export default function Navbar() {
  const { pathname }              = useLocation()
  const { publicKey, disconnect } = useWallet()
  const { connection }            = useConnection()
  const { setVisible }            = useWalletModal()
  const { totalCurrentValue }     = useApp()
  const { getPrice, getChange24h, lastUpdated, loading } = usePrices()

  const [scrolled,        setScrolled]        = useState(false)
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [copied,          setCopied]          = useState(false)
  const [pulse,           setPulse]           = useState(false)
  const [devBalance,      setDevBalance]      = useState(null)
  const [airdropLoading,  setAirdropLoading]  = useState(false)
  const [airdropDone,     setAirdropDone]     = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (!lastUpdated) return
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 800)
    return () => clearTimeout(t)
  }, [lastUpdated])

  // Fetch devnet SOL balance
  useEffect(() => {
    if (!publicKey || SOLANA_NETWORK !== 'devnet') return

    const fetch = async () => {
      try {
        const bal = await getWalletBalance(publicKey, connection)
        setDevBalance(bal)
      } catch { /* ignore */ }
    }

    fetch()
    const id = setInterval(fetch, 12_000)
    return () => clearInterval(id)
  }, [publicKey, connection])

  const handleAirdrop = async () => {
    if (!publicKey || airdropLoading) return
    setAirdropLoading(true)
    try {
      await requestDevnetAirdrop(publicKey, connection)
      const bal = await getWalletBalance(publicKey, connection)
      setDevBalance(bal)
      setAirdropDone(true)
      setTimeout(() => setAirdropDone(false), 3000)
    } catch { /* rate limited */ }
    finally { setAirdropLoading(false) }
  }

  const addr  = publicKey?.toBase58() ?? ''
  const short = addr ? `${addr.slice(0,4)}…${addr.slice(-4)}` : ''

  const copyAddr = () => {
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const solPrice  = getPrice('SOL')
  const solChange = getChange24h('SOL')

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: scrolled ? 'rgba(4,4,10,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all .3s',
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: 12,
    }}>

      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginRight: 20, flexShrink: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'linear-gradient(135deg, #00d4ff 0%, #9945ff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: '#fff',
          boxShadow: '0 0 16px rgba(0,212,255,0.4)',
        }}>B</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
          Bundle<span style={{ color: 'var(--cyan)' }}>Fi</span>
        </span>
        {/* Devnet badge */}
        <span style={{
          padding: '2px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700,
          background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.3)',
          color: 'var(--amber)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
        }}>DEVNET</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {LINKS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to
          return (
            <Link key={to} to={to} style={{
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              color: active ? 'var(--cyan)' : 'var(--text-2)',
              background: active ? 'var(--cyan-dim)' : 'transparent',
              border: `1px solid ${active ? 'rgba(0,212,255,0.25)' : 'transparent'}`,
              transition: 'all .2s',
            }}>
              <Icon size={14} />{label}
            </Link>
          )
        })}
      </div>

      {/* SOL live price pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 8,
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-mono)', fontSize: 12,
        transition: 'background .3s',
        background: pulse ? 'rgba(0,212,255,0.08)' : 'var(--bg-card2)',
      }}>
        <span style={{ color: '#9945FF' }}>◎</span>
        <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatPrice(solPrice)}</span>
        {solChange != null && (
          <span style={{ color: solChange >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 11 }}>
            {solChange >= 0 ? '+' : ''}{solChange.toFixed(2)}%
          </span>
        )}
        <Activity size={11} color={loading ? 'var(--amber)' : 'var(--green)'} />
      </div>

      {/* Devnet balance + airdrop */}
      {SOLANA_NETWORK === 'devnet' && publicKey && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {devBalance !== null && (
            <div style={{
              padding: '5px 10px', borderRadius: 7,
              background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)',
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)',
            }}>
              ◎{devBalance.toFixed(3)}
            </div>
          )}
          <button
            onClick={handleAirdrop}
            disabled={airdropLoading}
            title="Request 1 devnet SOL airdrop"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
              background: airdropDone ? 'var(--green-dim)' : 'rgba(255,184,0,0.08)',
              border: `1px solid ${airdropDone ? 'rgba(0,255,136,0.3)' : 'rgba(255,184,0,0.25)'}`,
              color: airdropDone ? 'var(--green)' : 'var(--amber)',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
              transition: 'all .2s',
            }}
          >
            <Droplets size={10} />
            {airdropDone ? '+1 SOL!' : 'Airdrop'}
          </button>
        </div>
      )}

      {/* Portfolio value */}
      {totalCurrentValue > 0 && (
        <div style={{
          padding: '6px 12px', borderRadius: 8,
          background: 'var(--green-dim)', border: '1px solid rgba(0,255,136,0.18)',
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)',
        }}>
          ↑ ${totalCurrentValue.toFixed(2)}
        </div>
      )}

      {/* Wallet menu */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setMenuOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
          background: 'var(--bg-card2)', border: '1px solid var(--border-md)',
          color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
          transition: 'all .2s',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
          {short}
          <ChevronDown size={12} color="var(--text-2)" />
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'var(--bg-card2)', border: '1px solid var(--border-md)',
            borderRadius: 10, minWidth: 210, overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            animation: 'fadeUp .15s ease both',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
                CONNECTED WALLET · <span style={{ color: 'var(--amber)' }}>DEVNET</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{short}</div>
              {devBalance !== null && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)', marginTop: 4 }}>
                  Balance: ◎{devBalance.toFixed(4)}
                </div>
              )}
            </div>

            {/* Jupiter price source info */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
              <div style={{ marginBottom: 3 }}>PRICE SOURCES</div>
              <div style={{ color: 'var(--green)' }}>
                Jupiter + CoinGecko{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ''}
              </div>
              <div style={{ marginTop: 4, color: 'var(--cyan)' }}>
                Swap API: api.jup.ag/swap/v1
              </div>
            </div>

            <button onClick={copyAddr} style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font-body)', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            {SOLANA_NETWORK === 'devnet' && (
              <button onClick={handleAirdrop} disabled={airdropLoading} style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)', fontSize: 13, fontFamily: 'var(--font-body)', transition: 'background .15s', borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Droplets size={14} />
                {airdropLoading ? 'Requesting…' : airdropDone ? 'Got 1 SOL!' : 'Airdrop 1 devnet SOL'}
              </button>
            )}

            <button onClick={() => { disconnect(); setMenuOpen(false) }} style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', fontSize: 13, fontFamily: 'var(--font-body)', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        )}
      </div>

      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />}
    </nav>
  )
}
