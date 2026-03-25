import React from 'react'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function Notification({ message, type = 'success' }) {
  const config = {
    success: { icon: CheckCircle, color: 'var(--green)',  bg: 'var(--green-dim)',  border: 'rgba(0,255,136,0.25)' },
    error:   { icon: AlertCircle, color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(255,68,102,0.25)' },
    info:    { icon: Info,        color: 'var(--cyan)',   bg: 'var(--cyan-dim)',   border: 'rgba(0,212,255,0.25)' },
  }[type] || config?.success

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 300,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 'var(--r-lg)',
      background: config.bg,
      border: `1px solid ${config.border}`,
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      color: config.color,
      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
      maxWidth: 320,
      animation: 'notifSlide .3s ease both',
    }}>
      <config.icon size={16} style={{ flexShrink: 0 }} />
      {message}
    </div>
  )
}