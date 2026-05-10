import React from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, PlusCircle, BarChart2, Activity, RefreshCw } from 'lucide-react'
import { useApp }    from '../context/AppContext'
import { usePrices } from '../context/PriceContext'
import { formatCurrency, formatPercent, formatPrice } from '../data/mockData'
import MiniChart from './MiniChart'

export default function Portfolio() {
  const { portfolio, totalInvested, totalCurrentValue, totalPnL, totalPnLPct } = useApp()
  const { lastUpdated, loading } = usePrices()

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36, animation: 'fadeUp .4s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em' }}>
            PORTFOLIO / OVERVIEW
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
            {loading
              ? <><RefreshCw size={10} color="var(--amber)" style={{ animation: 'spin 1s linear infinite' }} /> Fetching live prices…</>
              : <><Activity size={10} color="var(--green)" /> Live · {lastUpdated?.toLocaleTimeString()}</>
            }
          </div>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)' }}>Your Portfolio</h1>
        <p style={{ color: 'var(--text-2)', marginTop: 6, fontSize: 14 }}>Values calculated using live market prices from Jupiter &amp; CoinGecko.</p>
      </div>

      {portfolio.length === 0 ? <EmptyState /> : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 36, animation: 'fadeUp .4s .05s ease both' }}>
            {[
              { label: 'TOTAL INVESTED',  value: `$${totalInvested.toFixed(2)}`,      sub: `${portfolio.length} position${portfolio.length !== 1 ? 's' : ''}`, color: 'var(--text-1)', Icon: Wallet },
              { label: 'LIVE VALUE',      value: `$${totalCurrentValue.toFixed(2)}`,   sub: 'Based on live prices',                                              color: 'var(--cyan)',   Icon: BarChart2 },
              { label: 'TOTAL P&L',       value: `${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL).toFixed(2)}`, sub: formatPercent(totalPnLPct),              color: totalPnL >= 0 ? 'var(--green)' : 'var(--red)', Icon: totalPnL >= 0 ? TrendingUp : TrendingDown },
            ].map(s => (
              <div key={s.label} style={{ padding: '22px 24px', borderRadius: 'var(--r-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: '0.07em' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 24, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{s.sub}</div>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.Icon size={16} color={s.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Positions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {portfolio.map((pos, i) => <PositionCard key={pos.bundleId} pos={pos} index={i} />)}
          </div>
        </>
      )}
    </div>
  )
}

function PositionCard({ pos, index }) {
  const { getPrice, getChange24h, getChange7d } = usePrices()
  const { bundle } = pos
  if (!bundle) return null

  const pnl    = pos.currentValue - pos.invested
  const pnlPct = pos.invested > 0 ? (pnl / pos.invested) * 100 : 0

  // Enrich tokens with live prices + 24h + 7d changes
  const liveTokens = bundle.tokens.map(t => ({
    ...t,
    livePrice: getPrice(t.symbol),
    change24h: getChange24h(t.symbol),
    change7d:  getChange7d(t.symbol),
  }))

  // Weighted bundle-level 7d return (live)
  const bundleChange7d = (() => {
    const known = liveTokens.filter(t => t.change7d != null)
    if (!known.length) return null
    return known.reduce((s, t) => s + (t.change7d * t.weight / 100), 0)
  })()

  // Weighted 6M from static per-token change6m
  const bundleChange6m = (() => {
    const known = liveTokens.filter(t => t.change6m != null)
    if (!known.length) return null
    return known.reduce((s, t) => s + (t.change6m * t.weight / 100), 0)
  })()

  return (
    <div
      style={{
        padding: 24, borderRadius: 'var(--r-lg)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        animation: `fadeUp .4s ${0.05 * index + 0.1}s ease both`,
        transition: 'border-color .2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${bundle.color || 'var(--cyan)'}55`}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Top row: bundle name + live period returns */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: bundle.color || 'var(--cyan)' }} />
            <Link
              to={`/bundle/${bundle.id}`}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-1)', textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-1)'}
            >{bundle.name}</Link>
            {!bundle.isOfficial && (
              <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>CUSTOM</span>
            )}
          </div>

          {/* Period return badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {bundleChange6m != null && (
              <span style={{
                padding: '3px 10px', borderRadius: 999, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                background: bundleChange6m >= 0 ? 'var(--green-dim)' : 'rgba(255,51,102,0.1)',
                color: bundleChange6m >= 0 ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${bundleChange6m >= 0 ? 'rgba(0,255,136,0.25)' : 'rgba(255,51,102,0.25)'}`,
              }}>
                {bundleChange6m >= 0 ? '▲' : '▼'} {Math.abs(bundleChange6m).toFixed(1)}% <span style={{ opacity: 0.7, fontSize: 9 }}>6M</span>
              </span>
            )}
            {bundleChange7d != null && (
              <span style={{
                padding: '3px 10px', borderRadius: 999, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                background: bundleChange7d >= 0 ? 'var(--green-dim)' : 'rgba(255,51,102,0.1)',
                color: bundleChange7d >= 0 ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${bundleChange7d >= 0 ? 'rgba(0,255,136,0.25)' : 'rgba(255,51,102,0.25)'}`,
              }}>
                {bundleChange7d >= 0 ? '▲' : '▼'} {Math.abs(bundleChange7d).toFixed(2)}% <span style={{ opacity: 0.7, fontSize: 9 }}>7D LIVE</span>
              </span>
            )}
          </div>

          {/* Live token price chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {liveTokens.slice(0, 5).map(t => (
              <div key={t.symbol} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 6,
                background: 'var(--bg-card2)', border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)', fontSize: 10,
              }}>
                <span style={{ color: t.color || 'var(--text-2)' }}>{t.icon} {t.symbol}</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatPrice(t.livePrice)}</span>
                {t.change24h != null && (
                  <span style={{ color: t.change24h >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 9 }}>
                    {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(1)}%
                  </span>
                )}
              </div>
            ))}
            {liveTokens.length > 5 && (
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', alignSelf: 'center' }}>
                +{liveTokens.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Mini chart */}
        {bundle.chartData?.length > 0 && (
          <div style={{ width: 120, height: 44 }}>
            <MiniChart data={bundle.chartData} color={pnl >= 0 ? bundle.color || '#00ff88' : '#ff4466'} />
          </div>
        )}

        {/* P&L numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: '14px 18px', borderRadius: 'var(--r)', background: 'var(--bg-card2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
          {[
            { label: 'INVESTED',   value: `$${pos.invested.toFixed(2)}`,                                               color: 'var(--text-1)' },
            { label: 'LIVE VALUE', value: `$${pos.currentValue.toFixed(2)}`,                                            color: 'var(--cyan)'   },
            { label: 'P&L',        value: `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}\n${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%`, color: pnl >= 0 ? 'var(--green)' : 'var(--red)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.color, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded token table */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: 10, letterSpacing: '0.07em' }}>TOKEN BREAKDOWN — LIVE PRICES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {liveTokens.map(t => (
            <div key={t.symbol} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--r)',
              background: 'var(--bg-card2)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: t.color || 'var(--text-1)' }}>{t.symbol}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{formatPrice(t.livePrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{t.weight}% of bundle</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {t.change24h != null && (
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: t.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}% 24H
                      </span>
                    )}
                    {t.change7d != null && (
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: t.change7d >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {t.change7d >= 0 ? '+' : ''}{t.change7d.toFixed(2)}% 7D
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16, textAlign: 'center', animation: 'fadeUp .4s ease both' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Wallet size={32} color="var(--text-3)" />
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>No Investments Yet</h2>
      <p style={{ color: 'var(--text-2)', maxWidth: 400, lineHeight: 1.7 }}>Explore curated bundles or create your own to start building your crypto portfolio.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <Link to="/" style={{ textDecoration: 'none', padding: '12px 24px', borderRadius: 'var(--r)', background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={15} /> Explore Bundles
        </Link>
        <Link to="/create" style={{ textDecoration: 'none', padding: '12px 24px', borderRadius: 'var(--r)', background: 'var(--bg-card)', border: '1px solid var(--border-md)', color: 'var(--text-2)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusCircle size={15} /> Create Bundle
        </Link>
      </div>
    </div>
  )
}