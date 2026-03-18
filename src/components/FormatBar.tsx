import { useState, useEffect } from 'react'

interface FormatBarProps {
  editorRef: React.RefObject<HTMLDivElement>
  hint?: string
}

export function FormatBar({ editorRef, hint }: FormatBarProps) {
  const [boldActive, setBoldActive] = useState(false)
  const [italicActive, setItalicActive] = useState(false)

  useEffect(() => {
    const update = () => {
      setBoldActive(document.queryCommandState('bold'))
      setItalicActive(document.queryCommandState('italic'))
    }
    document.addEventListener('selectionchange', update)
    document.addEventListener('keyup', update)
    return () => {
      document.removeEventListener('selectionchange', update)
      document.removeEventListener('keyup', update)
    }
  }, [])

  const apply = (e: React.MouseEvent, cmd: string) => {
    e.preventDefault()
    editorRef.current?.focus()
    document.execCommand(cmd)
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--accent-bg)' : 'none',
    border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '2px 8px',
    fontSize: 13,
    lineHeight: '20px',
    fontFamily: 'var(--font-ui)',
    transition: 'all 0.1s',
  })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 6px',
        background: 'var(--surface-overlay)',
        border: '1px solid var(--border-muted)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 4,
        backdropFilter: 'var(--backdrop-blur)',
      }}
    >
      <button style={{ ...btnStyle(boldActive), fontWeight: 700 }} onMouseDown={(e) => apply(e, 'bold')} title="Bold (⌘B)">B</button>
      <button style={{ ...btnStyle(italicActive), fontStyle: 'italic' }} onMouseDown={(e) => apply(e, 'italic')} title="Italic (⌘I)"><em>I</em></button>
      {hint && (
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-ui)', paddingLeft: 8 }}>
          {hint}
        </span>
      )}
    </div>
  )
}
