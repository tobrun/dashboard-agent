import { useState, useEffect, useRef } from 'react'
import { deepMerge } from '../utils/deepMerge'

const refreshBus = new EventTarget()

export function triggerRefresh() {
  refreshBus.dispatchEvent(new Event('refresh'))
}

interface PollingResult {
  data: Record<string, unknown> | null
  error: boolean
  lastUpdated: Date | null
}

function prefixSource(source: string, slug: string | undefined): string {
  if (!slug) return source
  if (source.startsWith('/')) return source
  return `/d/${slug}/${source}`
}

export function usePollingData(
  sources: string[],
  intervalMs: number,
  slug?: string
): PollingResult {
  const prefixedSources = sources.map(s => prefixSource(s, slug))
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const sourcesKey = prefixedSources.join('|')

  const fetchAll = useRef<() => Promise<void>>(async () => {})

  // Keep ref current with latest closure
  fetchAll.current = async () => {
    try {
      const results = await Promise.all(
        prefixedSources.map(async (url) => {
          const res = await fetch(url, { cache: 'no-store' })
          if (!res.ok) throw new Error(`${res.status} ${url}`)
          return res.json() as Promise<Record<string, unknown>>
        })
      )
      const merged = results.reduce(
        (acc, result) =>
          deepMerge(acc, result) as Record<string, unknown>,
        {} as Record<string, unknown>
      )
      setData(merged)
      setError(false)
      setLastUpdated(new Date())
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    if (prefixedSources.length === 0) return

    let cancelled = false

    const run = async () => {
      if (!cancelled) await fetchAll.current()
    }

    run()
    const timer = setInterval(() => {
      if (!cancelled) fetchAll.current()
    }, intervalMs)

    const onRefresh = () => {
      if (!cancelled) fetchAll.current()
    }
    refreshBus.addEventListener('refresh', onRefresh)

    return () => {
      cancelled = true
      clearInterval(timer)
      refreshBus.removeEventListener('refresh', onRefresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesKey, intervalMs])

  return { data, error, lastUpdated }
}
