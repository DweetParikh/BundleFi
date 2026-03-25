import React from 'react'
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts'

export default function MiniChart({ data, color = '#00d4ff', height = 60 }) {
  if (!data || data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            return (
              <div style={{
                background:'var(--bg-card2)', border:'1px solid var(--border-md)',
                borderRadius:6, padding:'4px 10px',
                fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-1)',
              }}>
                ${payload[0].value.toFixed(2)}
              </div>
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${color.replace('#','')})`}
          dot={false}
          activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}