import { useState, useEffect } from 'react'
import { deepMerge } from '../utils/deepMerge'

interface DataResult {
  data: Record<string, unknown> | null
  error: boolean
}

function prefixSource(source: string, slug: string | undefined): string {
  if (!slug) return source
  if (source.startsWith('/')) return source
  return `/d/${slug}/${source}`
}

export function useDataLoader(
  sources: string[],
  slug?: string
): DataResult {
  const prefixedSources = sources.map(s => prefixSource(s, slug))
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState(false)
  const sourcesKey = prefixedSources.join('|')

  useEffect(() => {
    if (prefixedSources.length === 0) return

    let cancelled = false

    const fetchAll = async () => {
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
        if (!cancelled) {
          setData(merged)
          setError(false)
        }
      } catch {
        if (!cancelled) setError(true)
      }
    }

    fetchAll()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesKey])

  return { data, error }
}
