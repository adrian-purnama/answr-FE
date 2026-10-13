import { useEffect, useMemo, useState } from 'react'
import {
  clampYmdRange,
  isoRangeFromYmd,
  lookbackBoundsYmd,
} from '#/lib/chatAnalytics'

function storageKey(apiKeyId: string) {
  return `analyze-date-range:${apiKeyId}`
}

function readStoredRange(
  apiKeyId: string,
  min: string,
  max: string,
): { from: string; to: string } | null {
  try {
    const raw = sessionStorage.getItem(storageKey(apiKeyId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { from?: unknown; to?: unknown }
    if (typeof parsed.from !== 'string' || typeof parsed.to !== 'string') {
      return null
    }
    return clampYmdRange(parsed.from, parsed.to, min, max)
  } catch {
    return null
  }
}

function writeStoredRange(
  apiKeyId: string,
  range: { from: string; to: string },
) {
  try {
    sessionStorage.setItem(storageKey(apiKeyId), JSON.stringify(range))
  } catch {
    // ignore quota / private mode
  }
}

export function useAnalyzeDateRange(apiKeyId: string, lookbackDays: number) {
  const bounds = useMemo(
    () => lookbackBoundsYmd(lookbackDays),
    [lookbackDays],
  )

  const [fromYmd, setFromYmd] = useState(() => {
    const stored = readStoredRange(apiKeyId, bounds.min, bounds.max)
    return stored?.from ?? bounds.min
  })
  const [toYmd, setToYmd] = useState(() => {
    const stored = readStoredRange(apiKeyId, bounds.min, bounds.max)
    return stored?.to ?? bounds.max
  })

  useEffect(() => {
    const stored = readStoredRange(apiKeyId, bounds.min, bounds.max)
    if (stored) {
      setFromYmd(stored.from)
      setToYmd(stored.to)
      return
    }
    setFromYmd(bounds.min)
    setToYmd(bounds.max)
  }, [apiKeyId, bounds.min, bounds.max])

  const range = useMemo(
    () => isoRangeFromYmd(fromYmd, toYmd),
    [fromYmd, toYmd],
  )

  function setRange(next: { from: string; to: string }) {
    const clamped = clampYmdRange(next.from, next.to, bounds.min, bounds.max)
    setFromYmd(clamped.from)
    setToYmd(clamped.to)
    writeStoredRange(apiKeyId, clamped)
  }

  return { bounds, fromYmd, toYmd, range, setRange }
}
