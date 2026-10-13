/** Shared squarified treemap layout (Bruls / Huizing / van Wijk). */

export const TREEMAP_W = 1000
export const TREEMAP_H = 620

export const TILE_COLORS = [
  '#1B2B4D',
  '#2F4468',
  '#B8862B',
  '#8A8175',
  '#C4B8A5',
] as const

export type TreemapRect = {
  key: string
  x: number
  y: number
  w: number
  h: number
}

/**
 * Squarified treemap. Rows alternate between side-by-side and stacked
 * so tiles use both axes and area stays proportional to value.
 */
export function layoutTreemap(
  items: { key: string; value: number }[],
  width: number,
  height: number,
): TreemapRect[] {
  const nodes = items
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
  const total = nodes.reduce((sum, item) => sum + item.value, 0)
  if (total <= 0 || width <= 0 || height <= 0) return []

  const rects: TreemapRect[] = []
  const ratio = (1 + Math.sqrt(2)) / 2
  let x0 = 0
  let y0 = 0
  let x1 = width
  let y1 = height
  let i0 = 0
  let value = total

  while (i0 < nodes.length) {
    const dx = x1 - x0
    const dy = y1 - y0
    if (dx <= 0 || dy <= 0 || value <= 0) break

    let i1 = i0
    let sumValue = 0
    let minValue = Infinity
    let maxValue = 0
    let minRatio = Infinity
    const alpha = Math.max(dy / dx, dx / dy) / (value * ratio)

    for (; i1 < nodes.length; i1++) {
      const nodeValue = nodes[i1]!.value
      sumValue += nodeValue
      if (nodeValue < minValue) minValue = nodeValue
      if (nodeValue > maxValue) maxValue = nodeValue
      const beta = sumValue * sumValue * alpha
      const newRatio = Math.max(maxValue / beta, beta / minValue)
      if (i1 > i0 && newRatio > minRatio) {
        sumValue -= nodeValue
        break
      }
      minRatio = newRatio
    }

    const row = nodes.slice(i0, i1)
    const last = i1 >= nodes.length
    if (dx >= dy) {
      const rowRight = last ? x1 : x0 + dx * (sumValue / value)
      let y = y0
      for (let index = 0; index < row.length; index++) {
        const node = row[index]!
        const bottom =
          index === row.length - 1
            ? y1
            : y + dy * (node.value / sumValue)
        rects.push({ key: node.key, x: x0, y, w: rowRight - x0, h: bottom - y })
        y = bottom
      }
      x0 = rowRight
    } else {
      const rowBottom = last ? y1 : y0 + dy * (sumValue / value)
      let x = x0
      for (let index = 0; index < row.length; index++) {
        const node = row[index]!
        const right =
          index === row.length - 1
            ? x1
            : x + dx * (node.value / sumValue)
        rects.push({
          key: node.key,
          x,
          y: y0,
          w: right - x,
          h: rowBottom - y0,
        })
        x = right
      }
      y0 = rowBottom
    }

    value -= sumValue
    i0 = i1
  }

  return rects
}
