/**
 * Named color palette and utilities for theme-aware color resolution.
 *
 * Any hex color stored on an element can be mapped to the nearest named color.
 * This enables theme-aware adjustments — e.g., if the canvas background is teal,
 * a teal element can be shifted to a contrasting color instead of blending in.
 *
 * The palette is intentionally small (~20 entries) so lookups are fast and
 * the mapping is predictable.
 */

export interface NamedColor {
  name: string
  hex: string
  /** Pre-parsed RGB for fast distance calculations */
  r: number
  g: number
  b: number
}

// Curated palette covering the color wheel evenly.
// Hex values match common Tailwind-500 shades where possible, plus neutrals.
const PALETTE_RAW: [string, string][] = [
  // Neutrals
  ['white',    '#ffffff'],
  ['gray',     '#6b7280'],
  ['black',    '#000000'],

  // Cool
  ['slate',    '#64748b'],
  ['sky',      '#38bdf8'],
  ['cyan',     '#06b6d4'],
  ['teal',     '#14b8a6'],

  // Warm
  ['red',      '#ef4444'],
  ['rose',     '#f43f5e'],
  ['pink',     '#ec4899'],
  ['orange',   '#f97316'],
  ['amber',    '#f59e0b'],
  ['yellow',   '#eab308'],

  // Green
  ['lime',     '#84cc16'],
  ['emerald',  '#10b981'],
  ['green',    '#22c55e'],

  // Blue/Purple
  ['blue',     '#3b82f6'],
  ['indigo',   '#6366f1'],
  ['violet',   '#8b5cf6'],
  ['purple',   '#a855f7'],
  ['fuchsia',  '#d946ef'],
]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

export const NAMED_COLORS: NamedColor[] = PALETTE_RAW.map(([name, hex]) => {
  const [r, g, b] = hexToRgb(hex)
  return { name, hex, r, g, b }
})

/**
 * Find the nearest named color for any hex string.
 * Uses squared Euclidean distance in RGB space (fast, good enough for UI).
 */
export function nearestNamedColor(hex: string): NamedColor {
  const [r, g, b] = hexToRgb(hex)
  let best = NAMED_COLORS[0]
  let bestDist = Infinity
  for (const nc of NAMED_COLORS) {
    const dr = r - nc.r
    const dg = g - nc.g
    const db = b - nc.b
    const dist = dr * dr + dg * dg + db * db
    if (dist < bestDist) {
      bestDist = dist
      best = nc
      if (dist === 0) break
    }
  }
  return best
}

/**
 * Returns the color name for a hex value (e.g., '#6366f1' → 'indigo').
 */
export function colorName(hex: string): string {
  return nearestNamedColor(hex).name
}

/**
 * Perceived luminance (0–1) of a hex color.
 * Uses the sRGB coefficients for human perception.
 */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Checks if two colors are perceptually too similar to distinguish on screen.
 * Uses a threshold on squared RGB distance.
 */
export function colorsTooClose(hexA: string, hexB: string, threshold = 6400): boolean {
  const [r1, g1, b1] = hexToRgb(hexA)
  const [r2, g2, b2] = hexToRgb(hexB)
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return dr * dr + dg * dg + db * db < threshold
}

/**
 * Resolve an element color for a given background, ensuring visibility.
 *
 * If the element's named color is too close to the background, returns a
 * contrasting alternative (white or black based on background luminance).
 * Otherwise returns the original hex unchanged.
 *
 * @param elementHex  The element's stored hex color (e.g., '#06b6d4')
 * @param bgHex      The current canvas background hex (e.g., '#008080')
 * @returns           The hex color to actually render
 */
export function resolveColorForBackground(elementHex: string, bgHex: string): string {
  if (!elementHex || !bgHex) return elementHex
  if (!colorsTooClose(elementHex, bgHex)) return elementHex

  // The element would blend into the background — pick a contrasting color
  const bgLum = luminance(bgHex)
  return bgLum > 0.5 ? '#000000' : '#ffffff'
}
