import type { DiagramElement, ViewportState, Theme, ConnectionElement, BoxElement } from '../store/types'
import { buildViewportMatrix } from './ViewportMatrix'
import { getIconImage, loadIcon, themeToHex } from '../icons/iconifyClient'
import { getThemeColors, type ThemeColors } from '../themes/themeColors'

const GRID_SIZE = 40

function drawGrid(ctx: CanvasRenderingContext2D, vp: ViewportState, cssW: number, cssH: number, tc: ThemeColors) {
  const matrix = buildViewportMatrix(vp)
  const inv = matrix.inverse()

  const corners = [
    new DOMPoint(0, 0),
    new DOMPoint(cssW, 0),
    new DOMPoint(0, cssH),
    new DOMPoint(cssW, cssH),
  ].map((p) => inv.transformPoint(p))

  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const startX = Math.floor(minX / GRID_SIZE) * GRID_SIZE
  const startY = Math.floor(minY / GRID_SIZE) * GRID_SIZE

  ctx.lineWidth = 1 / vp.zoom

  for (let x = startX; x <= maxX + GRID_SIZE; x += GRID_SIZE) {
    ctx.strokeStyle = x % (GRID_SIZE * 5) === 0 ? tc.canvasGridAccent : tc.canvasGrid
    ctx.beginPath()
    ctx.moveTo(x, minY - GRID_SIZE)
    ctx.lineTo(x, maxY + GRID_SIZE)
    ctx.stroke()
  }

  for (let y = startY; y <= maxY + GRID_SIZE; y += GRID_SIZE) {
    ctx.strokeStyle = y % (GRID_SIZE * 5) === 0 ? tc.canvasGridAccent : tc.canvasGrid
    ctx.beginPath()
    ctx.moveTo(minX - GRID_SIZE, y)
    ctx.lineTo(maxX + GRID_SIZE, y)
    ctx.stroke()
  }
}

function drawOriginMarker(ctx: CanvasRenderingContext2D, vp: ViewportState, tc: ThemeColors) {
  const s = 10 / vp.zoom
  const r = 3 / vp.zoom
  ctx.save()
  ctx.strokeStyle = tc.canvasOrigin
  ctx.fillStyle = tc.canvasOrigin
  ctx.lineWidth = 1.5 / vp.zoom
  ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke()
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawIconElement(
  ctx: CanvasRenderingContext2D,
  el: import('../store/types').IconElement,
  selected: boolean,
  showHandles: boolean,
  theme: Theme,
  fontSize: number,
  tc: ThemeColors
) {
  const colorKey = el.color ?? theme
  const img = getIconImage(el.iconName, colorKey)

  if (img) {
    ctx.drawImage(img, el.x, el.y, el.width, el.height)
  } else {
    loadIcon(el.iconName, colorKey)
    ctx.fillStyle = tc.canvasPlaceholderFill
    ctx.strokeStyle = tc.canvasPlaceholderStroke
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(el.x, el.y, el.width, el.height, 8)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = tc.canvasPlaceholderDot
    const cx = el.x + el.width / 2
    const cy = el.y + el.height / 2
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(cx - 8 + i * 8, cy, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (el.label) {
    ctx.fillStyle = el.color ?? tc.canvasLabelText
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(el.label, el.x + el.width / 2, el.y + el.height + 4)
  }

  if (selected) {
    ctx.strokeStyle = tc.accent
    ctx.lineWidth = 2 / 1
    ctx.setLineDash([4, 2])
    ctx.beginPath()
    ctx.roundRect(el.x - 3, el.y - 3, el.width + 6, el.height + 6, 6)
    ctx.stroke()
    ctx.setLineDash([])

    if (showHandles) {
      drawHandles(ctx, el, tc)
    }
  }
}

function drawBoxElement(
  ctx: CanvasRenderingContext2D,
  el: BoxElement,
  selected: boolean,
  showHandles: boolean,
  _theme: Theme,
  fontSize: number,
  tc: ThemeColors
) {
  const boxStyle = el.style ?? 'solid'
  const glowColor = el.color ?? tc.canvasBoxGlow
  const strokeColor = el.color ?? tc.canvasBoxStroke

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(el.x, el.y, el.width, el.height, 10)

  if (boxStyle === 'filled') {
    ctx.globalAlpha = el.color ? 0.15 : 1
    ctx.fillStyle = el.color ?? tc.canvasBoxFill
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.shadowColor = glowColor
    ctx.shadowBlur = el.color ? 14 : 6
    ctx.strokeStyle = el.color ?? strokeColor
    ctx.lineWidth = 1.5
    ctx.setLineDash([])
    ctx.stroke()
  } else {
    ctx.shadowColor = glowColor
    ctx.shadowBlur = el.color ? 14 : 6
    ctx.strokeStyle = el.color ?? strokeColor
    ctx.lineWidth = 1.5
    ctx.setLineDash(boxStyle === 'dashed' ? [6, 4] : [])
    ctx.stroke()
  }
  ctx.restore()

  if (el.text) {
    ctx.save()
    ctx.fillStyle = el.color ?? tc.canvasBoxText
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(el.text, el.x + 12, el.y + 10)
    ctx.restore()
  }

  if (selected) {
    ctx.strokeStyle = tc.accent
    ctx.lineWidth = 2
    ctx.setLineDash([4, 2])
    ctx.beginPath()
    ctx.roundRect(el.x - 3, el.y - 3, el.width + 6, el.height + 6, 13)
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (selected && showHandles) drawHandles(ctx, el, tc)
}

function drawTextElement(
  ctx: CanvasRenderingContext2D,
  el: import('../store/types').TextElement,
  selected: boolean,
  showHandles: boolean,
  _theme: Theme,
  fontSize: number,
  tc: ThemeColors
) {
  ctx.fillStyle = el.color ?? tc.canvasTextStrong
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(el.text, el.x, el.y)

  if (selected) {
    const metrics = ctx.measureText(el.text)
    const w = metrics.width
    const h = fontSize * 1.2
    ctx.strokeStyle = tc.accent
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 2])
    ctx.strokeRect(el.x - 4, el.y - 4, w + 8, h + 8)
    ctx.setLineDash([])

    if (showHandles) {
      drawHandles(ctx, { x: el.x - 4, y: el.y - 4, width: w + 8, height: h + 8 }, tc)
    }
  }
}

function drawHandles(
  ctx: CanvasRenderingContext2D,
  el: { x: number; y: number; width: number; height: number },
  tc: ThemeColors
) {
  const handleSize = 7
  const positions = [
    [el.x, el.y],
    [el.x + el.width / 2, el.y],
    [el.x + el.width, el.y],
    [el.x + el.width, el.y + el.height / 2],
    [el.x + el.width, el.y + el.height],
    [el.x + el.width / 2, el.y + el.height],
    [el.x, el.y + el.height],
    [el.x, el.y + el.height / 2],
  ]

  ctx.fillStyle = tc.handleFill
  ctx.strokeStyle = tc.accent
  ctx.lineWidth = 1.5

  for (const [hx, hy] of positions) {
    ctx.beginPath()
    ctx.arc(hx, hy, handleSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

// ── Connection rendering ──────────────────────────────────────────────────────

function elementCenter(el: DiagramElement) {
  return { x: el.x + el.width / 2, y: el.y + el.height / 2 }
}

function bboxEdgePoint(
  el: DiagramElement,
  from: { x: number; y: number }
): { x: number; y: number } {
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const dx = from.x - cx
  const dy = from.y - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  const hw = el.width / 2 + 4
  const hh = el.height / 2 + 4
  const sx = Math.abs(dx) > 0 ? hw / Math.abs(dx) : Infinity
  const sy = Math.abs(dy) > 0 ? hh / Math.abs(dy) : Infinity
  const t = Math.min(sx, sy)
  return { x: cx + dx * t, y: cy + dy * t }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string,
  connStyle: import('../store/types').ConnectionStyle = 'solid'
) {
  const headLen = 10
  const angle = Math.atan2(y2 - y1, x2 - x1)

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.5

  if (connStyle === 'dashed') {
    ctx.setLineDash([8, 5])
  } else if (connStyle === 'animated') {
    ctx.setLineDash([8, 5])
    ctx.lineDashOffset = -(performance.now() / 40) % 13
  }

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  ctx.setLineDash([])
  ctx.lineDashOffset = 0
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  connections: ConnectionElement[],
  elements: DiagramElement[],
  selectedConnectionId: string | null,
  _theme: string,
  fontSize: number,
  tc: ThemeColors
) {
  const elMap = new Map(elements.map((e) => [e.id, e]))

  for (const conn of connections) {
    const from = elMap.get(conn.fromId)
    const to = elMap.get(conn.toId)
    if (!from || !to) continue

    const start = bboxEdgePoint(from, elementCenter(to))
    const end = bboxEdgePoint(to, elementCenter(from))
    const selected = conn.id === selectedConnectionId
    const color = conn.color ?? (selected ? tc.accent : tc.canvasConnection)

    ctx.save()
    if (selected) {
      ctx.shadowColor = conn.color ?? tc.accent
      ctx.shadowBlur = 10
    }
    drawArrow(ctx, start.x, start.y, end.x, end.y, color, conn.style ?? 'solid')
    ctx.restore()

    if (conn.label) {
      const mx = (start.x + end.x) / 2
      const my = (start.y + end.y) / 2
      ctx.save()
      ctx.fillStyle = conn.color ?? tc.canvasLabelTextSecondary
      ctx.font = `${Math.max(10, fontSize - 2)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const tw = ctx.measureText(conn.label).width
      ctx.fillStyle = tc.canvasLabelBg
      ctx.beginPath()
      ctx.roundRect(mx - tw / 2 - 5, my - 10, tw + 10, 18, 4)
      ctx.fill()
      ctx.fillStyle = conn.color ?? tc.canvasLabelText
      ctx.fillText(conn.label, mx, my)
      ctx.restore()
    }
  }
}

function drawConnectionPreview(
  ctx: CanvasRenderingContext2D,
  fromEl: DiagramElement,
  previewPos: { x: number; y: number },
  _theme: string,
  tc: ThemeColors
) {
  const start = bboxEdgePoint(fromEl, previewPos)
  drawArrow(ctx, start.x, start.y, previewPos.x, previewPos.y, tc.canvasConnectionPreview, 'dashed')
}

function drawMarquee(
  ctx: CanvasRenderingContext2D,
  rect: { x1: number; y1: number; x2: number; y2: number },
  _theme: string,
  tc: ThemeColors
) {
  const { x1, y1, x2, y2 } = rect
  const x = Math.min(x1, x2)
  const y = Math.min(y1, y2)
  const w = Math.abs(x2 - x1)
  const h = Math.abs(y2 - y1)
  ctx.save()
  ctx.fillStyle = tc.canvasMarqueeFill
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = tc.accent
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y1)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1, y2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x2, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x1, y2)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

// ── Main render ───────────────────────────────────────────────────────────────

export function render(
  ctx: CanvasRenderingContext2D,
  elements: DiagramElement[],
  connections: ConnectionElement[],
  vp: ViewportState,
  selectedIds: string[],
  selectedConnectionId: string | null,
  connectingFromId: string | null,
  connectionPreviewPos: { x: number; y: number } | null,
  marqueeRect: { x1: number; y1: number; x2: number; y2: number } | null,
  boxDrawPreview: { x1: number; y1: number; x2: number; y2: number } | null,
  dpr: number,
  cssW: number,
  cssH: number,
  theme: string,
  defaultFontSize: number
) {
  const tc = getThemeColors()

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, cssW * dpr, cssH * dpr)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const m = buildViewportMatrix(vp)
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f)

  drawGrid(ctx, vp, cssW, cssH, tc)
  drawOriginMarker(ctx, vp, tc)

  drawConnections(ctx, connections, elements, selectedConnectionId, theme, defaultFontSize, tc)

  if (connectingFromId && connectionPreviewPos) {
    const fromEl = elements.find((e) => e.id === connectingFromId)
    if (fromEl) drawConnectionPreview(ctx, fromEl, connectionPreviewPos, theme, tc)
  }

  const selectedIdSet = new Set(selectedIds)
  const sorted = [...elements].sort((a, b) => {
    const aSelected = selectedIdSet.has(a.id) ? 1 : 0
    const bSelected = selectedIdSet.has(b.id) ? 1 : 0
    return aSelected - bSelected
  })

  for (const el of sorted) {
    ctx.save()
    const sel = selectedIds.includes(el.id)
    const showHandles = sel && selectedIds.length === 1
    if (el.type === 'icon') {
      drawIconElement(ctx, el, sel, showHandles, theme, defaultFontSize, tc)
    } else if (el.type === 'text') {
      drawTextElement(ctx, el, sel, showHandles, theme, defaultFontSize, tc)
    } else if (el.type === 'box') {
      drawBoxElement(ctx, el, sel, showHandles, theme, defaultFontSize, tc)
    }
    ctx.restore()
  }

  if (marqueeRect) drawMarquee(ctx, marqueeRect, theme, tc)
  if (boxDrawPreview) drawMarquee(ctx, boxDrawPreview, theme, tc)
}
