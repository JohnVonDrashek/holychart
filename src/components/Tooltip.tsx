import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: React.ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  const show = useCallback(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const below = r.top < window.innerHeight / 3
    setPos({
      x: Math.round(r.left + r.width / 2),
      y: Math.round(below ? r.bottom + 6 : r.top - 6),
      below,
    })
  }, [])

  const hide = useCallback(() => setPos(null), [])

  return (
    <span ref={ref} style={{ display: 'contents' }} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {pos && createPortal(
        <div
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            transform: pos.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            zIndex: 9999,
            background: 'var(--surface-overlay)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-md)',
            backdropFilter: 'var(--backdrop-blur)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </span>
  )
}
