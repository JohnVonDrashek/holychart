import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { worldToScreen } from '../canvas/ViewportMatrix'
import { measureTextElement } from '../canvas/textMetrics'
import { FormatBar } from './FormatBar'
import { markdownToHtml, htmlToMarkdown } from '../utils/markdownHtml'

export function RenameInput() {
  const { renamingId, closeRename, elements, updateElement, viewport } = useAppStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState('')
  const committedRef = useRef(false)

  const el = renamingId ? elements.find((e) => e.id === renamingId) : null

  useEffect(() => {
    if (!el) return
    committedRef.current = false
    if (el.type === 'text') {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = markdownToHtml(el.text)
          editorRef.current.focus()
          // Select all
          const range = document.createRange()
          range.selectNodeContents(editorRef.current)
          window.getSelection()?.removeAllRanges()
          window.getSelection()?.addRange(range)
        }
      }, 30)
    } else {
      const current = el.type === 'box' ? el.text : (el.label ?? '')
      setValue(current)
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 30)
    }
  }, [renamingId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!el || !renamingId) return null

  const confirmText = () => {
    if (committedRef.current) return
    committedRef.current = true
    const md = htmlToMarkdown(editorRef.current?.innerHTML ?? '')
    if (md.trim()) {
      const { width, height } = measureTextElement(md, el.fontSize)
      updateElement(renamingId, { text: md, width, height } as never)
    }
    closeRename()
  }

  const confirmOther = () => {
    if (committedRef.current) return
    committedRef.current = true
    const trimmed = value.trim()
    if (el.type === 'box') {
      updateElement(renamingId, { text: trimmed } as never)
    } else {
      updateElement(renamingId, { label: trimmed || undefined })
    }
    closeRename()
  }

  const sharedInputStyle = {
    background: 'var(--surface-overlay)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text)',
    fontFamily: 'var(--font-ui)',
    outline: 'none',
    boxShadow: 'var(--shadow-input)',
  }

  if (el.type === 'text') {
    const screenPos = worldToScreen(el.x, el.y, viewport)
    return (
      <div style={{ position: 'fixed', left: screenPos.x, top: screenPos.y, zIndex: 200 }}>
        <FormatBar editorRef={editorRef} hint="⌘↵ confirm" />
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={(e) => {
            if (e.key === 'Escape') { closeRename(); return }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); confirmText(); return }
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); document.execCommand('bold'); return }
            if ((e.metaKey || e.ctrlKey) && e.key === 'i') { e.preventDefault(); document.execCommand('italic'); return }
          }}
          onBlur={confirmText}
          style={{
            ...sharedInputStyle,
            fontSize: el.fontSize,
            lineHeight: 1.5,
            padding: '8px 12px',
            width: 360,
            minHeight: 160,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowY: 'auto',
            cursor: 'text',
          }}
          data-placeholder="Edit text…"
        />
      </div>
    )
  }

  // Non-text elements: position above the element top-center
  const screenPos = worldToScreen(el.x + el.width / 2, el.y, viewport)
  return (
    <div style={{ position: 'fixed', left: screenPos.x, top: screenPos.y - 8, transform: 'translate(-50%, -100%)', zIndex: 200 }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') confirmOther()
          if (e.key === 'Escape') closeRename()
        }}
        onBlur={confirmOther}
        placeholder={el.type === 'icon' ? 'Label…' : 'Name…'}
        style={{
          ...sharedInputStyle,
          fontSize: 13,
          padding: '4px 10px',
          minWidth: 140,
          textAlign: 'center',
        }}
      />
    </div>
  )
}
