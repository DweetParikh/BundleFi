/**
 * seed.js
 * Inserts the 5 official curated bundles into Postgres.
 * Run with: npm run db:seed
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OFFICIAL_BUNDLES = [
  // ── 1. Top 10 Performers ──────────────────────────────────────────────────
  {
    id:           'top10-performers',
    name:         'Top 10 Performers',
    description:  'The 10 best-performing crypto assets of the last 6 months, rebalanced monthly by market momentum.',
    category:     'Growth',
    risk:         'High',
    color:        '#00FF88',
    isOfficial:   true,
    aum:          4_820_000,
    investorCount: 3841,
    apy30d:       284.6,
    change7d:     12.4,
    minInvestment: 10,
    inception:    '2024-01-15',
    tokens: [
      { symbol: 'SOL',    name: 'Solana',        weight: 18, color: '#9945FF', icon: '◎'  },
      { symbol: 'JUP',    name: 'Jupiter',        weight: 14, color: '#00C2FF', icon: '♃'  },
      { symbol: 'WIF',    name: 'dogwifhat',      weight: 12, color: '#FF6B35', icon: '🎩'  },
      { symbol: 'BONK',   name: 'Bonk',           weight: 11, color: '#FFB800', icon: '🔨'  },
      { symbol: 'PYTH',   name: 'Pyth Network',   weight: 10, color: '#8B5CF6', icon: '⚡'  },
      { symbol: 'RENDER', name: 'Render',          weight: 9,  color: '#EC4899', icon: '🖥'  },
      { symbol: 'HNT',    name: 'Helium',          weight: 8,  color: '#00D4FF', icon: '📡'  },
      { symbol: 'MNGO',   name: 'Mango Markets',   weight: 7,  color: '#FF8C00', icon: '🥭'  },
      { symbol: 'RAY',    name: 'Raydium',         weight: 6,  color: '#00FF88', icon: '⚗'   },
      { symbol: 'ORCA',   name: 'Orca',            weight: 5,  color: '#00E0D3', icon: '🐋'  },
    ],
  },

  // ── 2. Solana DeFi Pack ───────────────────────────────────────────────────
  {
    id:           'solana-defi',
    name:         'Solana DeFi Pack',
    description:  'Top DeFi protocols native to Solana — DEXs, lending protocols, and yield aggregators.',
    category:     'DeFi',
    risk:         'Medium',
    color:        '#00C2FF',
    isOfficial:   true,
    aum:          2_340_000,
    investorCount: 2104,
    apy30d:       142.3,
    change7d:     8.1,
    minInvestment: 5,
    inception:    '2024-02-01',
    tokens: [
      { symbol: 'RAY',  name: 'Raydium',       weight: 22, color: '#00FF88', icon: '⚗'  },
      { symbol: 'ORCA', name: 'Orca',           weight: 20, color: '#00E0D3', icon: '🐋' },
      { symbol: 'JUP',  name: 'Jupiter',        weight: 22, color: '#00C2FF', icon: '♃'  },
      { symbol: 'MNGO', name: 'Mango Markets',  weight: 16, color: '#FF8C00', icon: '🥭' },
      { symbol: 'PYTH', name: 'Pyth Network',   weight: 20, color: '#8B5CF6', icon: '⚡' },
    ],
  },

  // ── 3. Meme Lords Bundle ──────────────────────────────────────────────────
  {
    id:           'meme-lords',
    name:         'Meme Lords Bundle',
    description:  'High-conviction meme coins with proven community traction. High risk, potentially astronomical rewards.',
    category:     'Meme',
    risk:         'Very High',
    color:        '#FFB800',
    isOfficial:   true,
    aum:          891_000,
    investorCount: 5612,
    apy30d:       421.8,
    change7d:     18.9,
    minInvestment: 1,
    inception:    '2024-03-10',
    tokens: [
      { symbol: 'WIF',    name: 'dogwifhat', weight: 30, color: '#FF6B35', icon: '🎩' },
      { symbol: 'BONK',   name: 'Bonk',      weight: 30, color: '#FFB800', icon: '🔨' },
      { symbol: 'MYRO',   name: 'Myro',      weight: 20, color: '#FF3366', icon: '🐕' },
      { symbol: 'POPCAT', name: 'Popcat',    weight: 20, color: '#FF9F00', icon: '🐱' },
    ],
  },

  // ── 4. Blue Chip Crypto ───────────────────────────────────────────────────
  {
    id:           'blue-chip',
    name:         'Blue Chip Crypto',
    description:  'Large-cap cryptos with proven track records. Lower volatility, steady long-term accumulation.',
    category:     'Conservative',
    risk:         'Low',
    color:        '#9945FF',
    isOfficial:   true,
    aum:          7_210_000,
    investorCount: 8921,
    apy30d:       68.4,
    change7d:     3.2,
    minInvestment: 20,
    inception:    '2023-12-01',
    tokens: [
      { symbol: 'BTC', name: 'Bitcoin',  weight: 40, color: '#F7931A', icon: '₿'  },
      { symbol: 'ETH', name: 'Ethereum', weight: 30, color: '#627EEA', icon: 'Ξ'  },
      { symbol: 'SOL', name: 'Solana',   weight: 20, color: '#9945FF', icon: '◎'  },
      { symbol: 'BNB', name: 'BNB',      weight: 10, color: '#F3BA2F', icon: '⬡'  },
    ],
  },

  // ── 5. AI & Infra Bundle ──────────────────────────────────────────────────
  {
    id:           'ai-infra',
    name:         'AI & Infra Bundle',
    description:  'Crypto projects powering decentralized AI compute, data feeds, and cloud infrastructure.',
    category:     'Thematic',
    risk:         'High',
    color:        '#EC4899',
    isOfficial:   true,
    aum:          1_650_000,
    investorCount: 1872,
    apy30d:       198.7,
    change7d:     9.8,
    minInvestment: 10,
    inception:    '2024-02-15',
    tokens: [
      { symbol: 'RENDER', name: 'Render',       weight: 30, color: '#EC4899', icon: '🖥' },
      { symbol: 'HNT',    name: 'Helium',        weight: 25, color: '#00D4FF', icon: '📡' },
      { symbol: 'PYTH',   name: 'Pyth Network',  weight: 25, color: '#8B5CF6', icon: '⚡' },
      { symbol: 'INJ',    name: 'Injective',     weight: 20, color: '#00B2FF', icon: '💉' },
    ],
  },
]

async function seed() {
  console.log('🌱 Seeding BundleFi database...\n')

  let created = 0
  let skipped = 0

  for (const bundleData of OFFICIAL_BUNDLES) {
    const { tokens, ...bundle } = bundleData

    try {
      // Upsert the bundle (idempotent seed)
      const existing = await prisma.bundle.findUnique({ where: { id: bundle.id } })

      if (existing) {
        console.log(`  ⏭  Skipping "${bundle.name}" (already exists)`)
        skipped++
        continue
      }

      await prisma.bundle.create({
        data: {
          ...bundle,
          tokens: {
            create: tokens,
          },
        },
      })

      console.log(`  ✅  Created "${bundle.name}" (${tokens.length} tokens)`)
      created++
    } catch (err) {
      console.error(`  ❌  Failed to seed "${bundle.name}":`, err.message)
    }
  }

  console.log(`\n✨ Seed complete: ${created} created, ${skipped} skipped.`)
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
