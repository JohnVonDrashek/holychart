import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { BoxElement, TextElement } from '../store/types'

function genId() { return Math.random().toString(36).slice(2, 10) }

const RADIUS = 56
const BTN = 38

export function ConnectCreateMenu() {
  const {
    connectCreateMenuPos,
    closeConnectCreateMenu,
    openIconSearch,
    openTextInput,
    addElement,
    setSelected,
    setPendingConnectionFrom,
    defaultFontSize,
  } = useAppStore()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      closeConnectCreateMenu()
    }
  }, [closeConnectCreateMenu])

  useEffect(() => {
    if (!connectCreateMenuPos) return
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [connectCreateMenuPos, handleOutside])

  if (!connectCreateMenuPos) return null

  const { screenX, screenY, worldX, worldY, fromId } = connectCreateMenuPos
  const containerSize = (RADIUS + BTN / 2 + 8) * 2

  const items: Array<{ label: string; angle: number; action: () => void; content: React.ReactNode }> = [
    {
      label: 'Add icon',
      angle: 210,
      action: () => {
        setPendingConnectionFrom(fromId)
        closeConnectCreateMenu()
        openIconSearch({ x: worldX, y: worldY })
      },
      content: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      ),
    },
    {
      label: 'Add text',
      angle: 270,
      action: () => {
        setPendingConnectionFrom(fromId)
        closeConnectCreateMenu()
        openTextInput(screenX, screenY)
      },
      content: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
        </svg>
      ),
    },
    {
      label: 'Add box',
      angle: 330,
      action: () => {
        setPendingConnectionFrom(fromId)
        closeConnectCreateMenu()
        const el: BoxElement = {
          id: genId(), type: 'box',
          x: worldX - 120, y: worldY - 80,
          width: 240, height: 160,
          text: '', fontSize: Math.max(11, defaultFontSize - 2),
        }
        addElement(el)
        setSelected(el.id)
      },
      content: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
      ),
    },
  ]

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
        create<br/>&amp; connect
      </div>

      {/* Items */}
      {items.map((item) => {
        const rad = (item.angle * Math.PI) / 180
        const ox = Math.round(RADIUS * Math.cos(rad))
        const oy = Math.round(RADIUS * Math.sin(rad))
        return (
          <button
            key={item.label}
            title={item.label}
            onClick={item.action}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(calc(${ox}px - 50%), calc(${oy}px - 50%))`,
              width: BTN,
              height: BTN,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-overlay)',
              border: '1px solid var(--border-muted)',
              color: 'var(--text-secondary)',
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
              const b = e.currentTarget
              b.style.background = 'var(--surface-overlay)'
              b.style.borderColor = 'var(--border-muted)'
              b.style.color = 'var(--text-secondary)'
            }}
          >
            {item.content}
            <span style={{ fontSize: 8, fontFamily: 'var(--font-ui)', lineHeight: 1 }}>
              {item.label.split(' ')[1]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
