/**
 * Reads CSS custom properties from the current theme and returns them
 * as plain strings for use in canvas rendering contexts.
 * Cached per data-theme value so getComputedStyle is called at most once per theme switch.
 */

export interface ThemeColors {
  // Canvas
  canvasBg: string
  canvasGrid: string
  canvasGridAccent: string
  canvasBoxStroke: string
  canvasBoxFill: string
  canvasBoxGlow: string
  canvasBoxText: string
  canvasConnection: string
  canvasConnectionPreview: string
  canvasConnectCandidate: string
  canvasLabelBg: string
  canvasLabelText: string
  canvasLabelTextSecondary: string
  canvasPlaceholderFill: string
  canvasPlaceholderStroke: string
  canvasPlaceholderDot: string
  canvasMarqueeFill: string
  canvasOrigin: string
  canvasTextStrong: string
  canvasGlowBlur: number
  canvasTextBg: string
  canvasStrokeWidth: number
  // Gradient stops: array of [offset, color] or null for flat fills
  canvasBoxBase: string
  canvasBoxSeparator: string
  canvasIconBg: string
  canvasConnectionSeparator: string
  canvasBoxGradientStops: [number, string][] | null
  // Fill alphas — all behavior driven by theme, not renderer logic
  canvasBoxSolidTintAlpha: number     // solid/dashed: tint opacity (0 = no fill)
  canvasBoxFilledBaseAlpha: number    // filled: base color/fill opacity
  canvasBoxGradientAlpha: number      // filled: gradient overlay opacity
  canvasBoxColorFilledAlpha: number   // filled + custom color: color opacity
  canvasBoxColorTintAlpha: number     // solid/dashed + custom color: tint opacity
  canvasBoxColorGradientAlpha: number // filled + custom color: gradient opacity
  // Selection
  accent: string
  handleFill: string
  // Structure
  radiusSm: number
  radiusMd: number
  radiusLg: number
  fontUi: string
}

let _cached: ThemeColors | null = null
let _cachedTheme: string | null = null

function read(prop: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim()
}

function readNum(prop: string, fallback: number): number {
  const raw = read(prop)
  if (!raw) return fallback
  const val = parseFloat(raw)
  return Number.isNaN(val) ? fallback : val
}

/**
 * Parse a CSS variable like "0 #fff | 0.5 #aaa | 1 #888" into gradient stops.
 * Uses pipe delimiter to avoid conflicts with commas inside rgba().
 * Returns null if empty/unset (meaning use flat fill).
 */
function parseGradientStops(raw: string): [number, string][] | null {
  if (!raw || raw === 'none') return null
  const stops: [number, string][] = []
  for (const part of raw.split('|')) {
    const trimmed = part.trim()
    const spaceIdx = trimmed.indexOf(' ')
    if (spaceIdx < 0) continue
    const offset = parseFloat(trimmed.slice(0, spaceIdx))
    const color = trimmed.slice(spaceIdx + 1).trim()
    if (!Number.isNaN(offset) && color) stops.push([offset, color])
  }
  return stops.length >= 2 ? stops : null
}

export function getThemeColors(): ThemeColors {
  const current = document.documentElement.getAttribute('data-theme')
  if (_cached && _cachedTheme === current) return _cached

  _cached = {
    canvasBg: read('--bg'),
    canvasGrid: read('--canvas-grid'),
    canvasGridAccent: read('--canvas-grid-accent'),
    canvasBoxStroke: read('--canvas-box-stroke'),
    canvasBoxFill: read('--canvas-box-fill'),
    canvasBoxGlow: read('--canvas-box-glow'),
    canvasBoxText: read('--canvas-box-text'),
    canvasConnection: read('--canvas-connection'),
    canvasConnectionPreview: read('--canvas-connection-preview'),
    canvasConnectCandidate: read('--canvas-connect-candidate'),
    canvasLabelBg: read('--canvas-label-bg'),
    canvasLabelText: read('--canvas-label-text'),
    canvasLabelTextSecondary: read('--canvas-label-text-secondary'),
    canvasPlaceholderFill: read('--canvas-placeholder-fill'),
    canvasPlaceholderStroke: read('--canvas-placeholder-stroke'),
    canvasPlaceholderDot: read('--canvas-placeholder-dot'),
    canvasMarqueeFill: read('--canvas-marquee-fill'),
    canvasOrigin: read('--canvas-origin'),
    canvasTextStrong: read('--text-strong'),
    canvasGlowBlur: readNum('--canvas-glow-blur', 6),
    canvasTextBg: read('--canvas-text-bg') || 'transparent',
    canvasStrokeWidth: readNum('--canvas-stroke-width', 1.5),
    canvasBoxBase: read('--canvas-box-base') || 'transparent',
    canvasBoxSeparator: read('--canvas-box-separator') || 'transparent',
    canvasIconBg: read('--canvas-icon-bg') || 'transparent',
    canvasConnectionSeparator: read('--canvas-connection-separator') || 'transparent',
    canvasBoxGradientStops: parseGradientStops(read('--canvas-box-gradient')),
    canvasBoxSolidTintAlpha: readNum('--canvas-box-solid-tint-alpha', 0),
    canvasBoxFilledBaseAlpha: readNum('--canvas-box-filled-base-alpha', 1),
    canvasBoxGradientAlpha: readNum('--canvas-box-gradient-alpha', 1),
    canvasBoxColorFilledAlpha: readNum('--canvas-box-color-filled-alpha', 0.15),
    canvasBoxColorTintAlpha: readNum('--canvas-box-color-tint-alpha', 0),
    canvasBoxColorGradientAlpha: readNum('--canvas-box-color-gradient-alpha', 0),
    accent: read('--accent'),
    handleFill: '#ffffff',
    radiusSm: readNum('--radius-sm', 3),
    radiusMd: readNum('--radius-md', 6),
    radiusLg: readNum('--radius-lg', 12),
    fontUi: read('--font-ui') || "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  }
  _cachedTheme = current
  return _cached
}

/** Invalidate the cache (call on theme switch). */
export function invalidateThemeColors(): void {
  _cached = null
  _cachedTheme = null
}
