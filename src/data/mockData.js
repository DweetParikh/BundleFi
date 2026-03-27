function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateChartData(start, totalGrowthPct, seed = 42) {
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

export const TOKEN_META = {
  SOL:    { coingeckoId: 'solana',                  solanaMint: 'So11111111111111111111111111111111111111112',   fallbackPrice: 178.42   },
  JUP:    { coingeckoId: 'jupiter-exchange-solana', solanaMint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', fallbackPrice: 1.24     },
  WIF:    { coingeckoId: 'dogwifcoin',              solanaMint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',fallbackPrice: 2.87     },
  BONK:   { coingeckoId: 'bonk',                    solanaMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',fallbackPrice: 0.000041 },
  PYTH:   { coingeckoId: 'pyth-network',            solanaMint: 'HZ1JovNiVvGrGs7LVPLq8H4ZZuH3FtyJGJ3eFo8CupkF',fallbackPrice: 0.612    },
  RENDER: { coingeckoId: 'render-token',            solanaMint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', fallbackPrice: 8.94     },
  HNT:    { coingeckoId: 'helium',                  solanaMint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', fallbackPrice: 7.31     },
  MNGO:   { coingeckoId: 'mango-markets',           solanaMint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', fallbackPrice: 0.182    },
  RAY:    { coingeckoId: 'raydium',                 solanaMint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',fallbackPrice: 3.47     },
  ORCA:   { coingeckoId: 'orca',                    solanaMint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', fallbackPrice: 3.91     },
  BTC:    { coingeckoId: 'bitcoin',                 solanaMint: null,                                            fallbackPrice: 67420    },
  ETH:    { coingeckoId: 'ethereum',                solanaMint: null,                                            fallbackPrice: 3521     },
  BNB:    { coingeckoId: 'binancecoin',             solanaMint: null,                                            fallbackPrice: 412.30   },
  XRP:    { coingeckoId: 'ripple',                  solanaMint: null,                                            fallbackPrice: 0.623    },
  ADA:    { coingeckoId: 'cardano',                 solanaMint: null,                                            fallbackPrice: 0.512    },
  AVAX:   { coingeckoId: 'avalanche-2',             solanaMint: null,                                            fallbackPrice: 38.70    },
  DOGE:   { coingeckoId: 'dogecoin',                solanaMint: null,                                            fallbackPrice: 0.162    },
  DOT:    { coingeckoId: 'polkadot',                solanaMint: null,                                            fallbackPrice: 9.18     },
  MATIC:  { coingeckoId: 'matic-network',           solanaMint: null,                                            fallbackPrice: 0.912    },
  LINK:   { coingeckoId: 'chainlink',               solanaMint: null,                                            fallbackPrice: 18.40    },
  UNI:    { coingeckoId: 'uniswap',                 solanaMint: null,                                            fallbackPrice: 10.72    },
  ATOM:   { coingeckoId: 'cosmos',                  solanaMint: null,                                            fallbackPrice: 10.18    },
  LTC:    { coingeckoId: 'litecoin',                solanaMint: null,                                            fallbackPrice: 94.20    },
  SUI:    { coingeckoId: 'sui',                     solanaMint: null,                                            fallbackPrice: 1.82     },
  APT:    { coingeckoId: 'aptos',                   solanaMint: null,                                            fallbackPrice: 9.42     },
  ARB:    { coingeckoId: 'arbitrum',                solanaMint: null,                                            fallbackPrice: 1.14     },
  OP:     { coingeckoId: 'optimism',                solanaMint: null,                                            fallbackPrice: 2.48     },
  INJ:    { coingeckoId: 'injective-protocol',      solanaMint: null,                                            fallbackPrice: 34.20    },
  TIA:    { coingeckoId: 'celestia',                solanaMint: null,                                            fallbackPrice: 8.91     },
  SEI:    { coingeckoId: 'sei-network',             solanaMint: null,                                            fallbackPrice: 0.612    },
  MYRO:   { coingeckoId: 'myro',                    solanaMint: 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg',  fallbackPrice: 0.048    },
  POPCAT: { coingeckoId: 'popcat',                  solanaMint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',  fallbackPrice: 0.832    },
}

export const TOP_PERFORMERS = [
  { symbol: 'SOL',    name: 'Solana',        change6m: 312.4, weight: 18, color: '#9945FF'},
  { symbol: 'JUP',    name: 'Jupiter',       change6m: 287.1, weight: 14, color: '#00C2FF'},
  { symbol: 'WIF',    name: 'dogwifhat',     change6m: 241.8, weight: 12, color: '#FF6B35'},
  { symbol: 'BONK',   name: 'Bonk',          change6m: 198.3, weight: 11, color: '#FFB800'},
  { symbol: 'PYTH',   name: 'Pyth Network',  change6m: 176.5, weight: 10, color: '#8B5CF6'},
  { symbol: 'RENDER', name: 'Render',        change6m: 154.2, weight: 9,  color: '#EC4899'},
  { symbol: 'HNT',    name: 'Helium',        change6m: 143.7, weight: 8,  color: '#00D4FF'},
  { symbol: 'MNGO',   name: 'Mango Markets', change6m: 138.9, weight: 7,  color: '#FF8C00'},
  { symbol: 'RAY',    name: 'Raydium',       change6m: 127.4, weight: 6,  color: '#00FF88'},
  { symbol: 'ORCA',   name: 'Orca',          change6m: 119.8, weight: 5,  color: '#00E0D3'},
]

export const ALL_CRYPTOS = [
  { symbol: 'BTC',    name: 'Bitcoin',        color: '#F7931A', icon: '₿'  },
  { symbol: 'ETH',    name: 'Ethereum',       color: '#627EEA', icon: 'Ξ'  },
  { symbol: 'SOL',    name: 'Solana',         color: '#9945FF', icon: '◎'  },
  { symbol: 'BNB',    name: 'BNB',            color: '#F3BA2F', icon: '⬡'  },
  { symbol: 'XRP',    name: 'XRP',            color: '#00AAE4', icon: '✕'  },
  { symbol: 'ADA',    name: 'Cardano',        color: '#0033AD', icon: '₳'  },
  { symbol: 'AVAX',   name: 'Avalanche',      color: '#E84142', icon: '▲'  },
  { symbol: 'DOGE',   name: 'Dogecoin',       color: '#C2A633', icon: 'Ð'  },
  { symbol: 'DOT',    name: 'Polkadot',       color: '#E6007A', icon: '●'  },
  { symbol: 'MATIC',  name: 'Polygon',        color: '#8247E5', icon: '⬟'  },
  { symbol: 'LINK',   name: 'Chainlink',      color: '#375BD2', icon: '⬡'  },
  { symbol: 'UNI',    name: 'Uniswap',        color: '#FF007A', icon: '🦄'  },
  { symbol: 'ATOM',   name: 'Cosmos',         color: '#6F7390', icon: '⚛'  },
  { symbol: 'LTC',    name: 'Litecoin',       color: '#BFBBBB', icon: 'Ł'  },
  { symbol: 'JUP',    name: 'Jupiter',        color: '#00C2FF', icon: '♃'  },
  { symbol: 'WIF',    name: 'dogwifhat',      color: '#FF6B35', icon: '🎩'  },
  { symbol: 'BONK',   name: 'Bonk',           color: '#FFB800', icon: '🔨'  },
  { symbol: 'PYTH',   name: 'Pyth Network',   color: '#8B5CF6', icon: '⚡'  },
  { symbol: 'RENDER', name: 'Render',         color: '#EC4899', icon: '🖥'   },
  { symbol: 'HNT',    name: 'Helium',         color: '#00D4FF', icon: '📡'  },
  { symbol: 'RAY',    name: 'Raydium',        color: '#00FF88', icon: '⚗'   },
  { symbol: 'ORCA',   name: 'Orca',           color: '#00E0D3', icon: '🐋'  },
  { symbol: 'SUI',    name: 'Sui',            color: '#4DA2FF', icon: '💧'  },
  { symbol: 'APT',    name: 'Aptos',          color: '#00B4B4', icon: '◈'   },
  { symbol: 'MNGO',   name: 'Mango Markets',  color: '#FF8C00', icon: '🥭'  },
  { symbol: 'ARB',    name: 'Arbitrum',       color: '#28A0F0', icon: 'Ⓐ'   },
  { symbol: 'OP',     name: 'Optimism',       color: '#FF0420', icon: '⭕'  },
  { symbol: 'INJ',    name: 'Injective',      color: '#00B2FF', icon: '💉'  },
  { symbol: 'TIA',    name: 'Celestia',       color: '#7B2FBE', icon: '🌌'  },
  { symbol: 'SEI',    name: 'Sei',            color: '#9D1D20', icon: '🔱'  },
]

export const CURATED_BUNDLES = [
  {
    id: 'top10-performers',
    name: 'Top 10 Performers',
    description: 'The 10 best-performing crypto assets of the last 6 months, rebalanced monthly by market momentum.',
    category: 'Growth', risk: 'High',
    aum: 4_820_000, apy: 284.6, change7d: 12.4, change30d: 48.7,
    tokens: TOP_PERFORMERS,
    isOfficial: true, color: '#00FF88',
    chartData: generateChartData(100, 284.6, 1),
    investors: 3841, minInvestment: 10, inception: '2024-01-15',
  },
  {
    id: 'solana-defi',
    name: 'Solana DeFi Pack',
    description: 'Top DeFi protocols native to Solana — DEXs, lending protocols, and yield aggregators.',
    category: 'DeFi', risk: 'Medium',
    aum: 2_340_000, apy: 142.3, change7d: 8.1, change30d: 31.2,
    tokens: [
      { symbol: 'RAY',  name: 'Raydium',      change6m: 127.4, weight: 22, color: '#00FF88'},
      { symbol: 'ORCA', name: 'Orca',          change6m: 119.8, weight: 20, color: '#00E0D3'},
      { symbol: 'JUP',  name: 'Jupiter',       change6m: 287.1, weight: 22, color: '#00C2FF'},
      { symbol: 'MNGO', name: 'Mango Markets', change6m: 138.9, weight: 16, color: '#FF8C00'},
      { symbol: 'PYTH', name: 'Pyth Network',  change6m: 176.5, weight: 20, color: '#8B5CF6'},
    ],
    isOfficial: true, color: '#00C2FF',
    chartData: generateChartData(100, 142.3, 2),
    investors: 2104, minInvestment: 5, inception: '2024-02-01',
  },
  {
    id: 'meme-lords',
    name: 'Meme Lords Bundle',
    description: 'High-conviction meme coins with proven community traction. High risk, potentially astronomical rewards.',
    category: 'Meme', risk: 'Very High',
    aum: 891_000, apy: 421.8, change7d: 18.9, change30d: 87.4,
    tokens: [
      { symbol: 'WIF',    name: 'dogwifhat', change6m: 241.8, weight: 30, color: '#FF6B35'},
      { symbol: 'BONK',   name: 'Bonk',      change6m: 198.3, weight: 30, color: '#FFB800'},
      { symbol: 'MYRO',   name: 'Myro',      change6m: 189.2, weight: 20, color: '#FF3366'},
      { symbol: 'POPCAT', name: 'Popcat',    change6m: 162.4, weight: 20, color: '#FF9F00'},
    ],
    isOfficial: true, color: '#FFB800',
    chartData: generateChartData(100, 421.8, 3),
    investors: 5612, minInvestment: 1, inception: '2024-03-10',
  },
  {
    id: 'blue-chip',
    name: 'Blue Chip Crypto',
    description: 'Large-cap cryptos with proven track records. Lower volatility, steady long-term accumulation.',
    category: 'Conservative', risk: 'Low',
    aum: 7_210_000, apy: 68.4, change7d: 3.2, change30d: 14.1,
    tokens: [
      { symbol: 'BTC', name: 'Bitcoin',  change6m: 68.4,  weight: 40, color: '#F7931A'},
      { symbol: 'ETH', name: 'Ethereum', change6m: 52.1,  weight: 30, color: '#627EEA'},
      { symbol: 'SOL', name: 'Solana',   change6m: 312.4, weight: 20, color: '#9945FF'},
      { symbol: 'BNB', name: 'BNB',      change6m: 43.7,  weight: 10, color: '#F3BA2F'},
    ],
    isOfficial: true, color: '#9945FF',
    chartData: generateChartData(100, 68.4, 4),
    investors: 8921, minInvestment: 20, inception: '2023-12-01',
  },
  {
    id: 'ai-infra',
    name: 'AI & Infra Bundle',
    description: 'Crypto projects powering decentralized AI compute, data feeds, and cloud infrastructure.',
    category: 'Thematic', risk: 'High',
    aum: 1_650_000, apy: 198.7, change7d: 9.8, change30d: 42.3,
    tokens: [
      { symbol: 'RENDER', name: 'Render',       change6m: 154.2, weight: 30, color: '#EC4899'},
      { symbol: 'HNT',    name: 'Helium',       change6m: 143.7, weight: 25, color: '#00D4FF'},
      { symbol: 'PYTH',   name: 'Pyth Network', change6m: 176.5, weight: 25, color: '#8B5CF6'},
      { symbol: 'INJ',    name: 'Injective',    change6m: 121.3, weight: 20, color: '#00B2FF'},
    ],
    isOfficial: true, color: '#EC4899',
    chartData: generateChartData(100, 198.7, 5),
    investors: 1872, minInvestment: 10, inception: '2024-02-15',
  },
]

export const formatPrice = (n) => {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1_000)  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  if (n >= 1)      return `$${n.toFixed(2)}`
  if (n >= 0.01)   return `$${n.toFixed(4)}`
  if (n >= 0.0001) return `$${n.toFixed(6)}`
  return `$${n.toExponential(2)}`
}

export const formatCurrency = (n) => {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  if (n < 0.001)      return `$${n.toFixed(6)}`
  if (n < 1)          return `$${n.toFixed(4)}`
  return `$${n.toFixed(2)}`
}

export const formatPercent = (n, showSign = true) => {
  if (n == null || isNaN(n)) return '—'
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
  'Growth':       '#00FF88',
  'DeFi':         '#00C2FF',
  'Meme':         '#FFB800',
  'Conservative': '#9945FF',
  'Thematic':     '#EC4899',
  'Custom':       '#00D4FF',
}