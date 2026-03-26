import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { ConnectionStyle } from '../store/types'

const RADIUS = 56
const BTN = 38

function angleToOffset(angle: number) {
  const rad = (angle * Math.PI) / 180
  return { ox: Math.round(RADIUS * Math.cos(rad)), oy: Math.round(RADIUS * Math.sin(rad)) }
}

function evenAngles(count: number) {
  return Array.from({ length: count }, (_, i) => -90 + (360 / count) * i)
}

function Label({ text }: { text: string }) {
  return (
    <span style={{ fontSize: 8, fontFamily: 'var(--font-ui)', lineHeight: 1 }}>
      {text}
    </span>
  )
}

const STYLES: { key: ConnectionStyle; label: string; content: React.ReactNode }[] = [
  {
    key: 'solid', label: 'Solid',
    content: (
      <svg width="20" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="2" y1="8" x2="22" y2="8" />
        <polyline points="17,3 22,8 17,13" fill="none" />
      </svg>
    ),
  },
  {
    key: 'dashed', label: 'Dashed',
    content: (
      <svg width="20" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3">
        <line x1="2" y1="8" x2="22" y2="8" />
        <polyline points="17,3 22,8 17,13" fill="none" strokeDasharray="none" />
      </svg>
    ),
  },
  {
    key: 'animated', label: 'Animated',
    content: (
      <svg width="20" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3">
        <line x1="2" y1="8" x2="22" y2="8">
          <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="0.6s" repeatCount="indefinite" />
        </line>
        <polyline points="17,3 22,8 17,13" fill="none" strokeDasharray="none" />
      </svg>
    ),
  },
]

export function ConnectionStyleMenu() {
  const {
    connectionStyleMenuPos,
    closeConnectionStyleMenu,
    connections,
    updateConnection,
    pendingConnectionStyle,
    setPendingConnectionStyle,
  } = useAppStore()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      closeConnectionStyleMenu()
    }
  }, [closeConnectionStyleMenu])

  useEffect(() => {
    if (!connectionStyleMenuPos) return
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [connectionStyleMenuPos, handleOutside])

  useEffect(() => {
    if (!connectionStyleMenuPos) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConnectionStyleMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [connectionStyleMenuPos, closeConnectionStyleMenu])

  if (!connectionStyleMenuPos) return null

  const { screenX, screenY, connectionId } = connectionStyleMenuPos
  const isPending = connectionId === null
  const conn = isPending ? null : connections.find((c) => c.id === connectionId)
  if (!isPending && !conn) return null

  const currentStyle = isPending ? pendingConnectionStyle : (conn!.style ?? 'solid')
  const containerSize = (RADIUS + BTN / 2 + 8) * 2
  const angles = evenAngles(STYLES.length)

  const applyStyle = (style: ConnectionStyle) => {
    if (isPending) {
      setPendingConnectionStyle(style)
    } else {
      updateConnection(connectionId!, { style })
    }
    closeConnectionStyleMenu()
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: screenX,
        top: screenY,
        transform: 'translate(-50%, -50%)',
        zIndex: 200,
        width: containerSize,
        height: containerSize,
        pointerEvents: 'none',
      }}
    >
      {/* Glass circle background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'var(--surface-glass)',
        border: '1px solid var(--border)',
        backdropFilter: 'var(--backdrop-blur)',
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'all',
      }} />

      {/* Center label */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 9,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-ui)',
        textAlign: 'center',
        pointerEvents: 'none',
        lineHeight: 1.2,
      }}>
        style
      </div>

      {STYLES.map((s, i) => {
        const { ox, oy } = angleToOffset(angles[i])
        const isActive = s.key === currentStyle
        return (
          <button
            key={s.key}
            title={s.label}
            onClick={() => applyStyle(s.key)}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(calc(${ox}px - 50%), calc(${oy}px - 50%))`,
              width: BTN,
              height: BTN,
              borderRadius: 'var(--radius-md)',
              background: isActive ? 'var(--accent-bg-subtle)' : 'var(--surface-overlay)',
              border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-muted)',
              color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 0,
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              boxShadow: 'var(--shadow-md)',
              transition: 'background 0.1s, border-color 0.1s, color 0.1s',
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget
              b.style.background = 'var(--accent-bg-subtle)'
              b.style.borderColor = 'var(--accent)'
              b.style.color = 'var(--accent-light)'
            }}
            onMouseLeave={(e) => {
              if (isActive) return
              const b = e.currentTarget
              b.style.background = 'var(--surface-overlay)'
              b.style.borderColor = 'var(--border-muted)'
              b.style.color = 'var(--text-secondary)'
            }}
          >
            {s.content}
            <Label text={s.label.toLowerCase()} />
          </button>
        )
      })}
    </div>
  )
}
