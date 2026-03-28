import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Tooltip } from './Tooltip'
import { useAppStore } from '../store/useAppStore'

const PIP_WINDOW_SIZE = { width: 440, height: 320 }

export function PictureInPictureButton() {
  const theme = useAppStore((s) => s.theme)
  const systemTheme = useAppStore((s) => s.systemTheme)
  const activeDiagramName = useAppStore((s) => s.diagrams.find((diagram) => diagram.id === s.activeDiagramId)?.name ?? 'Current chart')
  const supported = typeof window !== 'undefined' && typeof window.documentPictureInPicture?.requestWindow === 'function'
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  const [isOpen, setIsOpen] = useState(false)
  const pipWindowRef = useRef<Window | null>(null)
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const titleRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<number | null>(null)

  const palette = useMemo(() => {
    if (typeof window === 'undefined') return null
    const styles = getComputedStyle(document.documentElement)
    return {
      bg: styles.getPropertyValue('--bg').trim() || '#0f1115',
      surface: styles.getPropertyValue('--surface-overlay').trim() || '#161a22',
      border: styles.getPropertyValue('--border-muted').trim() || 'rgba(255,255,255,0.16)',
      text: styles.getPropertyValue('--text').trim() || '#f5f7fb',
      muted: styles.getPropertyValue('--text-muted').trim() || 'rgba(255,255,255,0.68)',
      accent: styles.getPropertyValue('--accent').trim() || '#7bc4ff',
    }
  }, [resolvedTheme])

  const stopMirroring = useCallback(() => {
    const pipWindow = pipWindowRef.current
    if (frameRef.current !== null) {
      ;(pipWindow ?? window).cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  const resizePiPCanvas = useCallback(() => {
    const pipWindow = pipWindowRef.current
    const canvas = pipCanvasRef.current
    if (!pipWindow || !canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = pipWindow.devicePixelRatio || 1
    const nextWidth = Math.max(1, Math.round(rect.width * dpr))
    const nextHeight = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth
      canvas.height = nextHeight
    }
  }, [])

  const mirrorFrame = useCallback(() => {
    const pipWindow = pipWindowRef.current
    const canvas = pipCanvasRef.current
    const sourceCanvas = document.querySelector('canvas')
    if (!pipWindow || !canvas || !(sourceCanvas instanceof HTMLCanvasElement)) return

    resizePiPCanvas()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bg = palette?.bg || '#0f1115'
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
      const scale = Math.min(canvas.width / sourceCanvas.width, canvas.height / sourceCanvas.height)
      const drawWidth = sourceCanvas.width * scale
      const drawHeight = sourceCanvas.height * scale
      const offsetX = (canvas.width - drawWidth) / 2
      const offsetY = (canvas.height - drawHeight) / 2
      ctx.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight)
    }

    frameRef.current = pipWindow.requestAnimationFrame(mirrorFrame)
  }, [palette?.bg, resizePiPCanvas])

  const closePiP = useCallback(() => {
    stopMirroring()
    const pipWindow = pipWindowRef.current
    pipCanvasRef.current = null
    titleRef.current = null
    pipWindowRef.current = null
    setIsOpen(false)
    if (pipWindow && !pipWindow.closed) pipWindow.close()
  }, [stopMirroring])

  const syncPiPTheme = useCallback(() => {
    const pipWindow = pipWindowRef.current
    if (!pipWindow || !palette) return

    pipWindow.document.documentElement.style.height = '100%'
    pipWindow.document.documentElement.style.overflow = 'hidden'
    pipWindow.document.body.style.margin = '0'
    pipWindow.document.body.style.height = '100%'
    pipWindow.document.body.style.overflow = 'hidden'
    pipWindow.document.body.style.background = palette.bg
    pipWindow.document.body.style.color = palette.text
    pipWindow.document.body.style.fontFamily = 'var(--font-ui, system-ui, sans-serif)'
  }, [palette])

  const openPiP = useCallback(async () => {
    if (!supported || !window.documentPictureInPicture) return

    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: PIP_WINDOW_SIZE.width,
      height: PIP_WINDOW_SIZE.height,
      disallowReturnToOpener: false,
      preferInitialWindowPlacement: true,
    })

    pipWindowRef.current = pipWindow
    pipWindow.document.title = 'HolyChart Picture-in-Picture'
    pipWindow.document.body.innerHTML = ''

    const root = pipWindow.document.createElement('div')
    root.style.height = '100%'
    root.style.display = 'grid'
    root.style.gridTemplateRows = 'auto 1fr'
    root.style.background = palette?.bg || '#0f1115'
    root.style.overflow = 'hidden'

    const header = pipWindow.document.createElement('div')
    header.style.display = 'flex'
    header.style.alignItems = 'center'
    header.style.justifyContent = 'space-between'
    header.style.gap = '12px'
    header.style.padding = '10px 12px'
    header.style.borderBottom = `1px solid ${palette?.border || 'rgba(255,255,255,0.16)'}`
    header.style.background = palette?.surface || '#161a22'

    const titleGroup = pipWindow.document.createElement('div')
    titleGroup.style.minWidth = '0'

    const eyebrow = pipWindow.document.createElement('div')
    eyebrow.textContent = 'HolyChart preview'
    eyebrow.style.fontSize = '10px'
    eyebrow.style.fontWeight = '700'
    eyebrow.style.letterSpacing = '0.08em'
    eyebrow.style.textTransform = 'uppercase'
    eyebrow.style.color = palette?.accent || '#7bc4ff'

    const title = pipWindow.document.createElement('div')
    title.textContent = activeDiagramName
    title.style.fontSize = '13px'
    title.style.fontWeight = '600'
    title.style.color = palette?.text || '#f5f7fb'
    title.style.whiteSpace = 'nowrap'
    title.style.overflow = 'hidden'
    title.style.textOverflow = 'ellipsis'
    titleRef.current = title

    const note = pipWindow.document.createElement('div')
    note.textContent = 'Live canvas mirror'
    note.style.fontSize = '11px'
    note.style.color = palette?.muted || 'rgba(255,255,255,0.68)'
    note.style.flexShrink = '0'

    titleGroup.append(eyebrow, title)
    header.append(titleGroup, note)

    const content = pipWindow.document.createElement('div')
    content.style.minHeight = '0'
    content.style.padding = '10px'
    content.style.boxSizing = 'border-box'
    content.style.background = palette?.bg || '#0f1115'
    content.style.display = 'flex'

    const canvas = pipWindow.document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.flex = '1'
    canvas.style.minHeight = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.boxSizing = 'border-box'
    canvas.style.borderRadius = '14px'
    canvas.style.border = `1px solid ${palette?.border || 'rgba(255,255,255,0.16)'}`
    canvas.style.background = palette?.bg || '#0f1115'
    canvas.style.boxShadow = '0 18px 40px rgba(0, 0, 0, 0.28)'
    pipCanvasRef.current = canvas

    content.appendChild(canvas)
    root.append(header, content)
    pipWindow.document.body.appendChild(root)

    syncPiPTheme()
    resizePiPCanvas()
    stopMirroring()
    frameRef.current = pipWindow.requestAnimationFrame(mirrorFrame)
    setIsOpen(true)

    const handleClose = () => {
      stopMirroring()
      pipCanvasRef.current = null
      titleRef.current = null
      pipWindowRef.current = null
      setIsOpen(false)
    }

    pipWindow.addEventListener('pagehide', handleClose, { once: true })
    pipWindow.addEventListener('resize', resizePiPCanvas)
  }, [activeDiagramName, mirrorFrame, palette, resizePiPCanvas, stopMirroring, supported, syncPiPTheme])

  useEffect(() => {
    if (titleRef.current) titleRef.current.textContent = activeDiagramName
  }, [activeDiagramName])

  useEffect(() => {
    syncPiPTheme()
  }, [syncPiPTheme])

  useEffect(() => () => {
    stopMirroring()
    const pipWindow = pipWindowRef.current
    if (pipWindow && !pipWindow.closed) pipWindow.close()
  }, [stopMirroring])

  if (!supported) return null

  return (
    <Tooltip content={isOpen ? 'Close Picture-in-Picture preview' : 'Open Picture-in-Picture preview'}>
      <button
        onClick={() => {
          if (isOpen) {
            closePiP()
            return
          }
          void openPiP().catch(() => {
            alert('Could not open Picture-in-Picture.')
          })
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: isOpen ? 'var(--accent-bg-subtle)' : 'transparent',
          border: isOpen ? '1px solid var(--accent-border)' : '1px solid transparent',
          borderRadius: 'var(--radius-md)',
          color: isOpen ? 'var(--accent-light)' : 'var(--text-kbd)',
          padding: '3px 8px', cursor: 'pointer', fontSize: 12, transition: 'all 0.12s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.background = isOpen ? 'var(--accent-bg)' : 'var(--hover-bg)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.background = isOpen ? 'var(--accent-bg-subtle)' : 'transparent'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7" />
          <path d="M8 19H4a2 2 0 0 1-2-2v-6" />
          <rect x="9" y="10" width="8" height="6" rx="1.5" />
        </svg>
        PiP
      </button>
    </Tooltip>
  )
}
