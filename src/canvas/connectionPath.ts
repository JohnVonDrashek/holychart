import type { ConnectionElement, DiagramElement } from '../store/types'

/**
 * Computes the perpendicular curve offset for a connection.
 * Returns 0 for normal connections, or a positive/negative offset
 * for bidirectional connections so they curve apart.
 */
export function getCurveOffset(
  conn: ConnectionElement,
  connections: ConnectionElement[]
): number {
  const OFFSET = 25
  // Check if there's a reverse connection (B→A when this is A→B)
  const hasReverse = connections.some(
    (c) => c.id !== conn.id && c.fromId === conn.toId && c.toId === conn.fromId
  )
  if (!hasReverse) return 0
  // Use consistent side assignment: the connection whose fromId is "smaller" curves one way
  return conn.fromId < conn.toId ? OFFSET : -OFFSET
}

/**
 * Computes the quadratic bezier control point for a curved connection.
 * The control point is offset perpendicular to the midpoint of the straight line.
 */
export function curveControlPoint(
  x1: number, y1: number,
  x2: number, y2: number,
  offset: number
): { cx: number; cy: number } {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  if (offset === 0) return { cx: mx, cy: my }
  // Perpendicular direction
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len === 0) return { cx: mx, cy: my }
  // Normal vector (perpendicular, rotated 90° CCW)
  const nx = -dy / len
  const ny = dx / len
  return { cx: mx + nx * offset, cy: my + ny * offset }
}

/**
 * Point on a quadratic bezier at parameter t.
 */
export function quadBezierPoint(
  x1: number, y1: number,
  cx: number, cy: number,
  x2: number, y2: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t
  return {
    x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
    y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
  }
}

/**
 * Tangent angle at the end of a quadratic bezier (t=1).
 * Used for arrow head direction.
 */
export function quadBezierEndAngle(
  cx: number, cy: number,
  x2: number, y2: number
): number {
  return Math.atan2(y2 - cy, x2 - cx)
}

/**
 * Minimum distance from a point to a quadratic bezier curve.
 * Approximates by sampling the curve.
 */
export function distToQuadBezier(
  px: number, py: number,
  x1: number, y1: number,
  cx: number, cy: number,
  x2: number, y2: number,
  samples = 20
): number {
  let minDist = Infinity
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const pt = quadBezierPoint(x1, y1, cx, cy, x2, y2, t)
    const d = Math.hypot(px - pt.x, py - pt.y)
    if (d < minDist) minDist = d
  }
  return minDist
}
