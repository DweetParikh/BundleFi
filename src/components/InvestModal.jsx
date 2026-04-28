/**
 * InvestModal.jsx
 *
 * Entry point for bundle investments.
 * Renders the full Jupiter Swap flow (JupiterSwapModal) which handles:
 *   - devnet SOL airdrop
 *   - Jupiter quote fetching per token
 *   - wallet signing + devnet broadcast
 *   - transaction confirmation / simulation result
 */

import React from 'react'
import JupiterSwapModal from './JupiterSwapModal'

export default function InvestModal({ bundle, onClose }) {
  return <JupiterSwapModal bundle={bundle} onClose={onClose} />
}
