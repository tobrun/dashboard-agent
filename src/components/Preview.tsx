import { useState, useEffect } from 'react'
import type { ChartConfig } from '../types/dashboard'
import { ChartSlot } from './ChartSlot'

const POLL_INTERVAL_MS = 2000
const DEFAULT_CHART_HEIGHT = 400
const DEFAULT_ACCENT = '#00d4ff'
const DEFAULT_REFRESH = 60

export function Preview({ slug }: { slug?: string }) {
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const [lastPoll, setLastPoll] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchCharts = async () => {
      try {
        const res = await fetch('/api/session/charts', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as ChartConfig[]
        if (!cancelled) {
          setCharts(Array.isArray(data) ? data : [])
          setLastPoll(new Date())
        }
      } catch {
        // session API not available — silent
      }
    }

    fetchCharts()
    const timer = setInterval(fetchCharts, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-db-bg font-mono">
      {/* Header */}
      <div className="border-b border-db-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-db-accent font-medium text-xs tracking-wider uppercase">
            Session Preview
          </span>
          <span className="px-2 py-0.5 text-xs bg-db-surface border border-db-border rounded text-db-text-muted">
            Live
          </span>
        </div>
        {lastPoll && (
          <span className="text-xs text-db-text-muted/50">
            Polling every {POLL_INTERVAL_MS / 1000}s · Last: {lastPoll.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="px-6 py-6">
        {charts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border border-db-border flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-db-text-muted"
              >
                <rect x="2" y="10" width="3" height="8" fill="currentColor" opacity="0.4" />
                <rect x="7" y="6" width="3" height="12" fill="currentColor" opacity="0.6" />
                <rect x="12" y="3" width="3" height="15" fill="currentColor" opacity="0.8" />
                <rect x="17" y="7" width="3" height="11" fill="currentColor" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-db-text-muted text-sm">No active session</p>
              <p className="text-db-text-muted/50 text-xs mt-1">
                Run <code className="text-db-accent">/dashboard:new</code> to start building
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-db-text-muted">
              {charts.length} chart{charts.length !== 1 ? 's' : ''} in current session
            </p>
            {charts.map((chart) => (
              <div key={chart.id}>
                <div style={{ height: DEFAULT_CHART_HEIGHT }}>
                  <ChartSlot
                    chart={chart}
                    height={DEFAULT_CHART_HEIGHT}
                    globalRefreshInterval={DEFAULT_REFRESH}
                    accent={DEFAULT_ACCENT}
                    slug={slug}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
