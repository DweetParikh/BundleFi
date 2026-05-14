export const MAINNET_MINTS = {
  SOL:    'So11111111111111111111111111111111111111112',
  JUP:    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  WIF:    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  BONK:   'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  PYTH:   'HZ1JovNiVvGrGs7LVPLq8H4ZZuH3FtyJGJ3eFo8CupkF',
  RENDER: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  HNT:    'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
  MNGO:   'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  RAY:    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA:   'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  BTC:    '3NZ9JMVqFvM4175E71uJ5sP2G1J93z3F9z5d6t95N7q',
  ETH:    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  MYRO:   'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg',
  POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
}

export const MINT_TO_SYMBOL = Object.fromEntries(
  Object.entries(MAINNET_MINTS).map(([sym, mint]) => [mint, sym])
)

export const COINGECKO_IDS = {
  SOL:    'solana',
  JUP:    'jupiter-exchange-solana',
  WIF:    'dogwifhat',
  BONK:   'bonk',
  PYTH:   'pyth-network',
  RENDER: 'render-token',
  HNT:    'helium',
  MNGO:   'mango-markets',
  RAY:    'raydium',
  ORCA:   'orca',
  BTC:    'bitcoin',
  ETH:    'ethereum',
  BNB:    'binancecoin',
  XRP:    'ripple',
  ADA:    'cardano',
  AVAX:   'avalanche-2',
  DOGE:   'dogecoin',
  DOT:    'polkadot',
  MATIC:  'matic-network',
  LINK:   'chainlink',
  UNI:    'uniswap',
  ATOM:   'cosmos',
  LTC:    'litecoin',
  SUI:    'sui',
  APT:    'aptos',
  ARB:    'arbitrum',
  OP:     'optimism',
  INJ:    'injective-protocol',
  TIA:    'celestia',
  SEI:    'sei-network',
  MYRO:   'myro',
  POPCAT: 'popcat',
}

export const CG_ID_TO_SYMBOL = Object.fromEntries(
  Object.entries(COINGECKO_IDS).map(([sym, id]) => [id, sym])
)

export const FALLBACK_PRICES = {
  SOL:    178.42,
  JUP:    1.24,
  WIF:    2.87,
  BONK:   0.000041,
  PYTH:   0.612,
  RENDER: 8.94,
  HNT:    7.31,
  MNGO:   0.182,
  RAY:    3.47,
  ORCA:   3.91,
  BTC:    67420,
  ETH:    3521,
  BNB:    412.30,
  XRP:    0.623,
  ADA:    0.512,
  AVAX:   38.70,
  DOGE:   0.162,
  DOT:    9.18,
  MATIC:  0.912,
  LINK:   18.40,
  UNI:    10.72,
  ATOM:   10.18,
  LTC:    94.20,
  SUI:    1.82,
  APT:    9.42,
  ARB:    1.14,
  OP:     2.48,
  INJ:    34.20,
  TIA:    8.91,
  SEI:    0.612,
  MYRO:   0.048,
  POPCAT: 0.832,
}

export const TOKEN_META = Object.fromEntries(
  Object.keys(FALLBACK_PRICES).map((sym) => [
    sym,
    {
      symbol:       sym,
      solanaMint:   MAINNET_MINTS[sym] ?? null,
      coingeckoId:  COINGECKO_IDS[sym] ?? null,
      fallbackPrice: FALLBACK_PRICES[sym],
    },
  ])
)

export const SOLANA_TOKEN_MINTS = Object.values(MAINNET_MINTS)

export const ALL_CG_IDS = Object.values(COINGECKO_IDS).join(',')