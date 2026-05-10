import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy, TrendingUp, TrendingDown, Users, BarChart2,
  ChevronDown, ChevronUp, ChevronsUpDown, Flame, Star,
  Activity, ArrowRight, Shield,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { usePrices } from '../context/PriceContext'
import { formatCurrency, formatPercent, RISK_COLORS, CATEGORY_COLORS } from '../data/mockData'
import InvestModal from './InvestModal'

const SORT_FIELDS = [
  { key: 'apy',      label: '6M Return',  icon: TrendingUp },
  { key: 'change7d', label: '7D Change',  icon: Activity   },
  { key: 'change30d',label: '30D Change', icon: BarChart2  },
  { key: 'aum',      label: 'AUM',        icon: Shield     },
  { key: 'investors',label: 'Investors',  icon: Users      },
]

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg,#FFD700,#FFA500)', color: '#000', glow: '#FFD70066', label: '🥇' },
  { bg: 'linear-gradient(135deg,#C0C0C0,#A0A0A0)', color: '#000', glow: '#C0C0C066', label: '🥈' },
  { bg: 'linear-gradient(135deg,#CD7F32,#A0522D)', color: '#fff', glow: '#CD7F3266', label: '🥉' },
]

function SortHeader({ field, current, dir, onSort, children }) {
  const active = current === field
  return (
    <button
      onClick={() => onSort(field)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, background: 'none',
        border: 'none', cursor: 'pointer', padding: '4px 0',
        color: active ? 'var(--cyan)' : 'var(--text-3)',
        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.08em', whiteSpace: 'nowrap', transition: 'color .15s',
      }}
    >
      {children}
      {active
        ? (dir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)
        : <ChevronsUpDown size={10} color="var(--text-3)" />}
    </button>
  )
}

function RankBadge({ rank }) {
  if (rank <= 3) {
    const s = RANK_STYLES[rank - 1]
    return (
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: s.bg, color: s.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, boxShadow: `0 0 12px ${s.glow}`, flexShrink: 0,
      }}>
        {s.label}
      </div>
    )
  }
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: 'var(--bg-card2)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13,
      color: 'var(--text-3)', flexShrink: 0,
    }}>
      {rank}
    </div>
  )
}

function PerformancePill({ value, suffix = '%', size = 12 }) {
  if (value == null) return <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: size }}>—</span>
  const isPos = value >= 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 999,
      background: isPos ? 'var(--green-dim)' : 'rgba(255,51,102,0.1)',
      border: `1px solid ${isPos ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)'}`,
      color: isPos ? 'var(--green)' : 'var(--red)',
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: size,
    }}>
      {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {isPos ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  )
}

function TokenChips({ tokens }) {
  const shown = tokens.slice(0, 4)
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {shown.map(t => (
        <span key={t.symbol} style={{
          padding: '2px 7px', borderRadius: 5, fontSize: 10,
          fontFamily: 'var(--font-mono)', fontWeight: 600,
          background: `${t.color || '#fff'}14`,
          border: `1px solid ${t.color || '#fff'}28`,
          color: t.color || 'var(--text-2)',
        }}>
          {t.symbol}
        </span>
      ))}
      {tokens.length > 4 && (
        <span style={{
          padding: '2px 7px', borderRadius: 5, fontSize: 10,
          fontFamily: 'var(--font-mono)', color: 'var(--text-3)',
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
        }}>
          +{tokens.length - 4}
        </span>
      )}
    </div>
  )
}

export default function Leaderboard() {
  const { allBundles, portfolio } = useApp()
  const { loading, lastUpdated } = usePrices()
  const [sortBy, setSortBy] = useState('apy')
  const [sortDir, setSortDir] = useState('desc')
  const [filter, setFilter] = useState('All')   // All | Official | Community
  const [investBundle, setInvestBundle] = useState(null)

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  const ranked = useMemo(() => {
    let list = allBundles
    if (filter === 'Official')   list = list.filter(b => b.isOfficial)
    if (filter === 'Community')  list = list.filter(b => !b.isOfficial)

    return [...list].sort((a, b) => {
      const av = a[sortBy] ?? -Infinity
      const bv = b[sortBy] ?? -Infinity
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [allBundles, sortBy, sortDir, filter])

  // Stats for header tiles
  const totalAUM         = allBundles.reduce((s, b) => s + (b.aum || 0), 0)
  const topBundle        = [...allBundles].sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))[0]
  const communityBundles = allBundles.filter(b => !b.isOfficial).length

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36, animation: 'fadeUp .4s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Trophy size={20} color="var(--amber)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em' }}>
            LEADERBOARD / PERFORMANCE RANKINGS
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
            <Activity size={11} color={loading ? 'var(--amber)' : 'var(--green)'} />
            {loading ? 'Fetching live prices…' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}
          </div>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)' }}>
          Bundle Leaderboard
        </h1>
        <p style={{ color: 'var(--text-2)', marginTop: 8 }}>
          All curated and community-created bundles ranked by performance. Updated live.
        </p>
      </div>

      {/* ── Stat tiles ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32, animation: 'fadeUp .4s .05s ease both' }}>
        {[
          {
            icon: Trophy, iconColor: 'var(--amber)',
            label: 'Top Performer',
            value: topBundle?.name ?? '—',
            sub: topBundle?.apy != null ? `+${topBundle.apy.toFixed(1)}% 6M` : '—',
            subColor: 'var(--green)',
          },
          {
            icon: BarChart2, iconColor: 'var(--cyan)',
            label: 'Total AUM',
            value: formatCurrency(totalAUM),
            sub: `across ${allBundles.length} bundles`,
            subColor: 'var(--text-3)',
          },
          {
            icon: Star, iconColor: '#9945FF',
            label: 'Official Bundles',
            value: allBundles.filter(b => b.isOfficial).length,
            sub: 'curated by BundleFi',
            subColor: 'var(--text-3)',
          },
          {
            icon: Users, iconColor: 'var(--green)',
            label: 'Community Bundles',
            value: communityBundles,
            sub: 'created by users',
            subColor: 'var(--text-3)',
          },
        ].map(({ icon: Icon, iconColor, label, value, sub, subColor }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon size={14} color={iconColor} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>{label.toUpperCase()}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-1)', marginBottom: 4 }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: subColor }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap', animation: 'fadeUp .4s .1s ease both' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginRight: 4 }}>FILTER</span>
        {['All', 'Official', 'Community'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 'var(--r)', cursor: 'pointer',
            background: filter === f ? 'var(--cyan-dim)' : 'var(--bg-card)',
            color: filter === f ? 'var(--cyan)' : 'var(--text-2)',
            border: `1px solid ${filter === f ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, transition: 'all .15s',
          }}>{f}</button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>SORT BY</span>
          {SORT_FIELDS.map(({ key, label }) => (
            <button key={key} onClick={() => handleSort(key)} style={{
              padding: '6px 12px', borderRadius: 'var(--r)', cursor: 'pointer',
              background: sortBy === key ? 'rgba(153,69,255,0.12)' : 'var(--bg-card)',
              color: sortBy === key ? 'var(--purple)' : 'var(--text-2)',
              border: `1px solid ${sortBy === key ? 'rgba(153,69,255,0.3)' : 'var(--border)'}`,
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {label}
              {sortBy === key && (sortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Leaderboard table ───────────────────────────────────────────── */}
      <div style={{ animation: 'fadeUp .4s .15s ease both' }}>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '56px 1fr 120px 90px 160px 90px 90px 90px 110px',
          gap: 0,
          padding: '8px 20px',
          borderBottom: '1px solid var(--border)',
          marginBottom: 4,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>RANK</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>BUNDLE</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>TOKENS</span>
          <SortHeader field="aum"       current={sortBy} dir={sortDir} onSort={handleSort}>AUM</SortHeader>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', paddingLeft: 4 }}>INVESTORS / RISK</span>
          <SortHeader field="change7d"  current={sortBy} dir={sortDir} onSort={handleSort}>7D</SortHeader>
          <SortHeader field="change30d" current={sortBy} dir={sortDir} onSort={handleSort}>30D</SortHeader>
          <SortHeader field="apy"       current={sortBy} dir={sortDir} onSort={handleSort}>6M RETURN</SortHeader>
          <span />
        </div>

        {/* Rows */}
        {ranked.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            No bundles to display.
          </div>
        )}

        {ranked.map((bundle, i) => (
          <LeaderboardRow
            key={bundle.id}
            bundle={bundle}
            rank={i + 1}
            index={i}
            isInvested={portfolio.some(p => p.bundleId === bundle.id)}
            onInvest={() => setInvestBundle(bundle)}
          />
        ))}
      </div>

      {investBundle && <InvestModal bundle={investBundle} onClose={() => setInvestBundle(null)} />}
    </div>
  )
}

function LeaderboardRow({ bundle, rank, index, isInvested, onInvest }) {
  const [hovered, setHovered] = useState(false)
  const catColor  = CATEGORY_COLORS[bundle.category] || 'var(--cyan)'
  const riskColor = RISK_COLORS[bundle.risk] || 'var(--text-2)'

  const isTop3   = rank <= 3
  const rowGlow  = isTop3 ? RANK_STYLES[rank - 1].glow : null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '56px 1fr 120px 90px 160px 90px 90px 90px 110px',
        gap: 0,
        alignItems: 'center',
        padding: '14px 20px',
        borderRadius: 'var(--r-lg)',
        marginBottom: 6,
        background: hovered
          ? 'var(--bg-card2)'
          : isTop3
            ? `${rowGlow ? rowGlow.replace('66', '10') : 'transparent'}`
            : 'var(--bg-card)',
        border: `1px solid ${hovered ? (bundle.color || 'var(--cyan)') + '44' : isTop3 ? (rowGlow || 'var(--border)') : 'var(--border)'}`,
        transition: 'all .2s',
        animation: `fadeUp .35s ${0.04 * index}s ease both`,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top-3 accent bar */}
      {isTop3 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: RANK_STYLES[rank - 1].bg,
          borderRadius: '3px 0 0 3px',
        }} />
      )}

      {/* Rank */}
      <div style={{ paddingLeft: isTop3 ? 6 : 0 }}>
        <RankBadge rank={rank} />
      </div>

      {/* Bundle info */}
      <div style={{ minWidth: 0, paddingRight: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{
            padding: '1px 7px', borderRadius: 999, fontSize: 9,
            fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em',
            background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30`,
          }}>{bundle.category}</span>
          {bundle.isOfficial && (
            <span style={{
              padding: '1px 7px', borderRadius: 999, fontSize: 9,
              fontFamily: 'var(--font-mono)', fontWeight: 700,
              background: 'rgba(153,69,255,0.12)', color: 'var(--purple)',
              border: '1px solid rgba(153,69,255,0.25)',
            }}>✦ OFFICIAL</span>
          )}
          {isInvested && (
            <span style={{
              padding: '1px 7px', borderRadius: 999, fontSize: 9,
              fontFamily: 'var(--font-mono)', fontWeight: 700,
              background: 'var(--green-dim)', color: 'var(--green)',
              border: '1px solid rgba(0,255,136,0.25)',
            }}>● INVESTED</span>
          )}
          {!bundle.isOfficial && (
            <span style={{
              padding: '1px 7px', borderRadius: 999, fontSize: 9,
              fontFamily: 'var(--font-mono)', fontWeight: 700,
              background: 'rgba(0,212,255,0.08)', color: 'var(--cyan)',
              border: '1px solid rgba(0,212,255,0.2)',
            }}>👤 COMMUNITY</span>
          )}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
          color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{bundle.name}</div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)',
          marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{bundle.description?.slice(0, 60)}{bundle.description?.length > 60 ? '…' : ''}</div>
      </div>

      {/* Token chips */}
      <div>
        <TokenChips tokens={bundle.tokens} />
      </div>

      {/* AUM */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>
          {bundle.aum > 0 ? formatCurrency(bundle.aum) : '—'}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 2 }}>TOTAL AUM</div>
      </div>

      {/* Investors + Risk */}
      <div style={{ paddingLeft: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <Users size={10} color="var(--text-3)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-1)', fontWeight: 600 }}>
            {bundle.investors ?? 0}
          </span>
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: 999, fontSize: 9,
          fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: riskColor, background: `${riskColor}18`, border: `1px solid ${riskColor}30`,
        }}>
          {bundle.risk ?? '—'}
        </span>
      </div>

      {/* 7D */}
      <div><PerformancePill value={bundle.change7d} /></div>

      {/* 30D */}
      <div><PerformancePill value={bundle.change30d} /></div>

      {/* 6M APY — most prominent */}
      <div>
        {bundle.apy != null ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16,
              color: 'var(--green)',
            }}>+{bundle.apy.toFixed(1)}%</span>
            {rank === 1 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--amber)' }}>
                <Flame size={9} /> TOP
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>New</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Link
          to={`/bundle/${bundle.id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '7px 10px', borderRadius: 'var(--r)', textDecoration: 'none',
            background: 'var(--bg-hover)', border: '1px solid var(--border-md)',
            color: 'var(--text-2)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11,
            transition: 'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
        >
          Details <ArrowRight size={10} />
        </Link>
        <button
          onClick={onInvest}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '7px 10px', borderRadius: 'var(--r)', cursor: 'pointer',
            background: `linear-gradient(135deg, ${bundle.color || '#00d4ff'}33, ${bundle.color || '#00d4ff'}18)`,
            border: `1px solid ${bundle.color || '#00d4ff'}55`,
            color: bundle.color || 'var(--cyan)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
            transition: 'opacity .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Invest →
        </button>
      </div>
    </div>
  )
}
