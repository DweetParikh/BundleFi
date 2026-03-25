function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateChartData(start, totalGrowthPct, seed = 42) {
  const rand = seededRand(seed)
  const points = 30
  const data = []
  let value = start
  for (let i = 0; i < points; i++) {
    const trend = (totalGrowthPct / 100 / points) * start
    const noise = (rand() - 0.42) * trend * 3
    value = Math.max(value + trend + noise, start * 0.4)
    data.push({ day: i, value: parseFloat(value.toFixed(2)) })
  }
  data[points - 1].value = parseFloat((start * (1 + totalGrowthPct / 100)).toFixed(2))
  return data
}

// ── Top 10 Performers (last 6 months) ────────────────────────────────────────
export const TOP_PERFORMERS = [
  { symbol: 'SOL',    name: 'Solana',        price: 178.42,    change6m: 312.4, weight: 18, color: '#9945FF', icon: '◎' },
  { symbol: 'JUP',    name: 'Jupiter',       price: 1.24,      change6m: 287.1, weight: 14, color: '#00C2FF', icon: '♃' },
  { symbol: 'WIF',    name: 'dogwifhat',     price: 2.87,      change6m: 241.8, weight: 12, color: '#FF6B35', icon: '🎩' },
  { symbol: 'BONK',   name: 'Bonk',          price: 0.000041,  change6m: 198.3, weight: 11, color: '#FFB800', icon: '🔨' },
  { symbol: 'PYTH',   name: 'Pyth Network',  price: 0.612,     change6m: 176.5, weight: 10, color: '#8B5CF6', icon: '⚡' },
  { symbol: 'RENDER', name: 'Render',        price: 8.94,      change6m: 154.2, weight: 9,  color: '#EC4899', icon: '🖥' },
  { symbol: 'HNT',    name: 'Helium',        price: 7.31,      change6m: 143.7, weight: 8,  color: '#00D4FF', icon: '📡' },
  { symbol: 'MNGO',   name: 'Mango Markets', price: 0.182,     change6m: 138.9, weight: 7,  color: '#FF8C00', icon: '🥭' },
  { symbol: 'RAY',    name: 'Raydium',       price: 3.47,      change6m: 127.4, weight: 6,  color: '#00FF88', icon: '⚗' },
  { symbol: 'ORCA',   name: 'Orca',          price: 3.91,      change6m: 119.8, weight: 5,  color: '#00E0D3', icon: '🐋' },
]

// ── Full crypto list for custom bundle builder ────────────────────────────────
export const ALL_CRYPTOS = [
  { symbol: 'BTC',    name: 'Bitcoin',        price: 67420,    change24h:  2.4,  color: '#F7931A', icon: '₿'  },
  { symbol: 'ETH',    name: 'Ethereum',       price: 3521,     change24h:  1.8,  color: '#627EEA', icon: 'Ξ'  },
  { symbol: 'SOL',    name: 'Solana',         price: 178.42,   change24h:  4.2,  color: '#9945FF', icon: '◎'  },
  { symbol: 'BNB',    name: 'BNB',            price: 412.30,   change24h: -0.8,  color: '#F3BA2F', icon: '⬡'  },
  { symbol: 'XRP',    name: 'XRP',            price: 0.623,    change24h:  3.1,  color: '#00AAE4', icon: '✕'  },
  { symbol: 'ADA',    name: 'Cardano',        price: 0.512,    change24h:  1.2,  color: '#0033AD', icon: '₳'  },
  { symbol: 'AVAX',   name: 'Avalanche',      price: 38.70,    change24h:  5.6,  color: '#E84142', icon: '▲'  },
  { symbol: 'DOGE',   name: 'Dogecoin',       price: 0.162,    change24h: -1.4,  color: '#C2A633', icon: 'Ð'  },
  { symbol: 'DOT',    name: 'Polkadot',       price: 9.18,     change24h:  2.7,  color: '#E6007A', icon: '●'  },
  { symbol: 'MATIC',  name: 'Polygon',        price: 0.912,    change24h:  3.8,  color: '#8247E5', icon: '⬟'  },
  { symbol: 'LINK',   name: 'Chainlink',      price: 18.40,    change24h:  4.1,  color: '#375BD2', icon: '⬡'  },
  { symbol: 'UNI',    name: 'Uniswap',        price: 10.72,    change24h:  2.3,  color: '#FF007A', icon: '🦄'  },
  { symbol: 'ATOM',   name: 'Cosmos',         price: 10.18,    change24h:  1.6,  color: '#6F7390', icon: '⚛'  },
  { symbol: 'LTC',    name: 'Litecoin',       price: 94.20,    change24h:  0.9,  color: '#BFBBBB', icon: 'Ł'  },
  { symbol: 'JUP',    name: 'Jupiter',        price: 1.24,     change24h:  8.4,  color: '#00C2FF', icon: '♃'  },
  { symbol: 'WIF',    name: 'dogwifhat',      price: 2.87,     change24h: 12.1,  color: '#FF6B35', icon: '🎩'  },
  { symbol: 'BONK',   name: 'Bonk',           price: 0.000041, change24h:  6.8,  color: '#FFB800', icon: '🔨'  },
  { symbol: 'PYTH',   name: 'Pyth Network',   price: 0.612,    change24h:  5.9,  color: '#8B5CF6', icon: '⚡'  },
  { symbol: 'RENDER', name: 'Render',         price: 8.94,     change24h:  7.2,  color: '#EC4899', icon: '🖥'  },
  { symbol: 'HNT',    name: 'Helium',         price: 7.31,     change24h:  4.8,  color: '#00D4FF', icon: '📡'  },
  { symbol: 'RAY',    name: 'Raydium',        price: 3.47,     change24h:  9.1,  color: '#00FF88', icon: '⚗'  },
  { symbol: 'ORCA',   name: 'Orca',           price: 3.91,     change24h:  6.3,  color: '#00E0D3', icon: '🐋'  },
  { symbol: 'SUI',    name: 'Sui',            price: 1.82,     change24h: 11.4,  color: '#4DA2FF', icon: '💧'  },
  { symbol: 'APT',    name: 'Aptos',          price: 9.42,     change24h:  3.7,  color: '#00B4B4', icon: '◈'  },
  { symbol: 'MNGO',   name: 'Mango Markets',  price: 0.182,    change24h:  2.1,  color: '#FF8C00', icon: '🥭'  },
  { symbol: 'ARB',    name: 'Arbitrum',       price: 1.14,     change24h:  4.9,  color: '#28A0F0', icon: 'Ⓐ'  },
  { symbol: 'OP',     name: 'Optimism',       price: 2.48,     change24h:  3.3,  color: '#FF0420', icon: '⭕'  },
  { symbol: 'INJ',    name: 'Injective',      price: 34.20,    change24h:  6.7,  color: '#00B2FF', icon: '💉'  },
  { symbol: 'TIA',    name: 'Celestia',       price: 8.91,     change24h:  5.2,  color: '#7B2FBE', icon: '🌌'  },
  { symbol: 'SEI',    name: 'Sei',            price: 0.612,    change24h:  8.8,  color: '#9D1D20', icon: '🔱'  },
]

// ── Curated Official Bundles ──────────────────────────────────────────────────
export const CURATED_BUNDLES = [
  {
    id: 'top10-performers',
    name: 'Top 10 Performers',
    description: 'The 10 best-performing crypto assets of the last 6 months, rebalanced monthly by market momentum.',
    category: 'Growth',
    risk: 'High',
    aum: 4_820_000,
    apy: 284.6,
    change7d: 12.4,
    change30d: 48.7,
    tokens: TOP_PERFORMERS,
    isOfficial: true,
    color: '#00FF88',
    chartData: generateChartData(100, 284.6, 1),
    investors: 3841,
    minInvestment: 10,
    inception: '2024-01-15',
  },
  {
    id: 'solana-defi',
    name: 'Solana DeFi Pack',
    description: 'Top DeFi protocols native to Solana — DEXs, lending protocols, and yield aggregators.',
    category: 'DeFi',
    risk: 'Medium',
    aum: 2_340_000,
    apy: 142.3,
    change7d: 8.1,
    change30d: 31.2,
    tokens: [
      { symbol: 'RAY',  name: 'Raydium',      price: 3.47,  change6m: 127.4, weight: 22, color: '#00FF88', icon: '⚗' },
      { symbol: 'ORCA', name: 'Orca',          price: 3.91,  change6m: 119.8, weight: 20, color: '#00E0D3', icon: '🐋' },
      { symbol: 'JUP',  name: 'Jupiter',       price: 1.24,  change6m: 287.1, weight: 22, color: '#00C2FF', icon: '♃' },
      { symbol: 'MNGO', name: 'Mango Markets', price: 0.182, change6m: 138.9, weight: 16, color: '#FF8C00', icon: '🥭' },
      { symbol: 'PYTH', name: 'Pyth Network',  price: 0.612, change6m: 176.5, weight: 20, color: '#8B5CF6', icon: '⚡' },
    ],
    isOfficial: true,
    color: '#00C2FF',
    chartData: generateChartData(100, 142.3, 2),
    investors: 2104,
    minInvestment: 5,
    inception: '2024-02-01',
  },
  {
    id: 'meme-lords',
    name: 'Meme Lords Bundle',
    description: 'High-conviction meme coins with proven community traction. High risk, potentially astronomical rewards.',
    category: 'Meme',
    risk: 'Very High',
    aum: 891_000,
    apy: 421.8,
    change7d: 18.9,
    change30d: 87.4,
    tokens: [
      { symbol: 'WIF',    name: 'dogwifhat', price: 2.87,     change6m: 241.8, weight: 30, color: '#FF6B35', icon: '🎩' },
      { symbol: 'BONK',   name: 'Bonk',      price: 0.000041, change6m: 198.3, weight: 30, color: '#FFB800', icon: '🔨' },
      { symbol: 'MYRO',   name: 'Myro',      price: 0.048,    change6m: 189.2, weight: 20, color: '#FF3366', icon: '🐶' },
      { symbol: 'POPCAT', name: 'Popcat',    price: 0.832,    change6m: 162.4, weight: 20, color: '#FF9F00', icon: '😺' },
    ],
    isOfficial: true,
    color: '#FFB800',
    chartData: generateChartData(100, 421.8, 3),
    investors: 5612,
    minInvestment: 1,
    inception: '2024-03-10',
  },
  {
    id: 'blue-chip',
    name: 'Blue Chip Crypto',
    description: 'Large-cap cryptos with proven track records. Lower volatility, steady long-term accumulation.',
    category: 'Conservative',
    risk: 'Low',
    aum: 7_210_000,
    apy: 68.4,
    change7d: 3.2,
    change30d: 14.1,
    tokens: [
      { symbol: 'BTC', name: 'Bitcoin',  price: 67420,  change6m: 68.4,  weight: 40, color: '#F7931A', icon: '₿' },
      { symbol: 'ETH', name: 'Ethereum', price: 3521,   change6m: 52.1,  weight: 30, color: '#627EEA', icon: 'Ξ' },
      { symbol: 'SOL', name: 'Solana',   price: 178.42, change6m: 312.4, weight: 20, color: '#9945FF', icon: '◎' },
      { symbol: 'BNB', name: 'BNB',      price: 412.30, change6m: 43.7,  weight: 10, color: '#F3BA2F', icon: '⬡' },
    ],
    isOfficial: true,
    color: '#9945FF',
    chartData: generateChartData(100, 68.4, 4),
    investors: 8921,
    minInvestment: 20,
    inception: '2023-12-01',
  },
  {
    id: 'ai-infra',
    name: 'AI & Infra Bundle',
    description: 'Crypto projects powering decentralized AI compute, data feeds, and cloud infrastructure.',
    category: 'Thematic',
    risk: 'High',
    aum: 1_650_000,
    apy: 198.7,
    change7d: 9.8,
    change30d: 42.3,
    tokens: [
      { symbol: 'RENDER', name: 'Render',       price: 8.94,  change6m: 154.2, weight: 30, color: '#EC4899', icon: '🖥' },
      { symbol: 'HNT',    name: 'Helium',       price: 7.31,  change6m: 143.7, weight: 25, color: '#00D4FF', icon: '📡' },
      { symbol: 'PYTH',   name: 'Pyth Network', price: 0.612, change6m: 176.5, weight: 25, color: '#8B5CF6', icon: '⚡' },
      { symbol: 'INJ',    name: 'Injective',    price: 34.20, change6m: 121.3, weight: 20, color: '#00B2FF', icon: '💉' },
    ],
    isOfficial: true,
    color: '#EC4899',
    chartData: generateChartData(100, 198.7, 5),
    investors: 1872,
    minInvestment: 10,
    inception: '2024-02-15',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
export const formatCurrency = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  if (n < 0.001)      return `$${n.toFixed(6)}`
  if (n < 1)          return `$${n.toFixed(4)}`
  return `$${n.toFixed(2)}`
}

export const formatPercent = (n, showSign = true) => {
  const sign = showSign && n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export const RISK_COLORS = {
  'Low':       '#00FF88',
  'Medium':    '#FFB800',
  'High':      '#FF6B35',
  'Very High': '#FF3366',
}

export const CATEGORY_COLORS = {
  'Growth':      '#00FF88',
  'DeFi':        '#00C2FF',
  'Meme':        '#FFB800',
  'Conservative':'#9945FF',
  'Thematic':    '#EC4899',
  'Custom':      '#00D4FF',
}