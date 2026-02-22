import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface DashboardMeta {
  slug: string
  title: string
  description: string
  chart_count: number
  sections_count: number
  updated_at: string | null
}

function daysAgo(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export function Picker() {
  const [dashboards, setDashboards] = useState<DashboardMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/dashboards', { cache: 'no-store' })
      .then(r => r.json() as Promise<DashboardMeta[]>)
      .then(data => {
        setDashboards(data)
        setLoading(false)
      })
      .catch(() => {
        setFetchError(true)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-db-bg font-mono">
      {/* Header */}
      <div className="border-b border-db-border px-6 py-4 flex items-center gap-3">
        <div className="w-1 h-4 rounded bg-db-accent" />
        <span className="text-db-text-primary font-medium text-sm uppercase tracking-widest">
          Dashboards
        </span>
      </div>

      <div className="px-6 py-8">
        {loading ? (
          <p className="text-db-text-muted text-xs animate-pulse">Loading...</p>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-red-400 text-sm">Failed to load dashboards.</p>
          </div>
        ) : dashboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-db-text-muted text-sm">No dashboards yet.</p>
            <p className="text-db-text-muted/50 text-xs">
              Run <code className="text-db-accent">/dashboard:new</code> to create one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map(d => (
              <button
                key={d.slug}
                onClick={() => navigate(`/d/${d.slug}`)}
                className="text-left bg-db-surface border border-db-border rounded p-5 hover:border-db-accent transition-colors group"
              >
                <p className="text-db-text-primary font-medium text-sm group-hover:text-db-accent transition-colors truncate">
                  {d.title}
                </p>
                {d.description && (
                  <p className="text-db-text-muted text-xs mt-1 line-clamp-2">{d.description}</p>
                )}
                <p className="text-db-text-muted/50 text-xs mt-3">
                  {d.chart_count} chart{d.chart_count !== 1 ? 's' : ''} · updated {daysAgo(d.updated_at)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
