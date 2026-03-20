import { BAKED_ICONS } from './bakedIcons'

// Cache keyed by "iconName|#hexcolor"
const imageCache = new Map<string, HTMLImageElement | Promise<HTMLImageElement>>()

// Tracks the most recently *requested* image per icon name for fallback display.
// Updated when a load completes, but only if it matches the latest requested color.
const latestRequested = new Map<string, string>() // iconName → hex
const latestImage = new Map<string, HTMLImageElement>() // iconName → most recent completed image

export function themeToHex(theme: string): string {
  if (theme.startsWith('#')) return theme
  return getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#e2e8f0'
}

function cacheKey(iconName: string, hex: string) {
  return `${iconName}|${hex}`
}

/** Inject a color into a currentColor SVG and return a data URI. */
export function svgToDataUri(svg: string, color: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/currentColor/g, color))
}

/** Get a data URI for a baked icon with the given color, or null if not baked. */
export function getBakedIconUri(iconName: string, color: string): string | null {
  const svg = BAKED_ICONS[iconName]
  if (!svg) return null
  return svgToDataUri(svg, color)
}

function parseIconName(iconName: string): { collection: string; name: string } {
  const i = iconName.indexOf(':')
  if (i < 0) return { collection: 'mdi', name: iconName }
  return { collection: iconName.slice(0, i), name: iconName.slice(i + 1) }
}

async function iconToImage(iconName: string, hex: string): Promise<HTMLImageElement> {
  const dataUri = getBakedIconUri(iconName, hex)
  const src = dataUri ?? (() => {
    const { collection, name } = parseIconName(iconName)
    return `https://api.iconify.design/${collection}/${name}.svg?height=128&color=${encodeURIComponent(hex)}`
  })()

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load: ${iconName}`))
    img.src = src
  })
}

/** Load an icon into the canvas image cache. */
export function loadIcon(
  iconName: string,
  colorOrTheme: string,
  onLoad?: () => void
): void {
  const hex = themeToHex(colorOrTheme)
  const key = cacheKey(iconName, hex)

  // Mark this as the latest requested color for this icon
  latestRequested.set(iconName, hex)

  if (imageCache.has(key)) {
    const cached = imageCache.get(key)!
    if (cached instanceof HTMLImageElement) {
      // Already loaded — update latest image immediately
      latestImage.set(iconName, cached)
      onLoad?.()
    } else {
      cached.then(() => onLoad?.()).catch(() => {})
    }
    return
  }

  const promise = iconToImage(iconName, hex)
  imageCache.set(key, promise)
  promise
    .then((img) => {
      imageCache.set(key, img)
      // Only update latestImage if this is still the most recently requested color
      // (avoids out-of-order async loads showing stale intermediate colors)
      if (latestRequested.get(iconName) === hex) {
        latestImage.set(iconName, img)
      }
      onLoad?.()
    })
    .catch(() => { imageCache.delete(key) })
}

/** Get a cached icon image synchronously. Returns null if not yet loaded.
 *  Falls back to the most recently loaded variant to avoid placeholder flash. */
export function getIconImage(iconName: string, colorOrTheme: string): HTMLImageElement | null {
  const cached = imageCache.get(cacheKey(iconName, themeToHex(colorOrTheme)))
  if (cached instanceof HTMLImageElement) return cached

  // Fallback: show the most recently loaded variant of this icon
  return latestImage.get(iconName) ?? null
}
