import { useState, useEffect } from 'react'
import { usePDF } from 'react-to-pdf'
import type { DashboardConfig, Row } from '../types/dashboard'
import { isTextBlockRow, isSlotsRow, isChartSlot } from '../types/dashboard'
import { TableOfContents } from './TableOfContents'
import { triggerRefresh } from '../hooks/usePollingData'
import { TextBlock } from './TextBlock'
import { ChartSlot } from './ChartSlot'

function widthClass(width: string): string {
  switch (width) {
    case 'full':
      return 'col-span-12'
    case '2/3':
      return 'col-span-8'
    case '1/2':
      return 'col-span-6'
    case '1/3':
      return 'col-span-4'
    default:
      return 'col-span-12'
  }
}

function DashboardRow({ row, config, slug }: { row: Row; config: DashboardConfig; slug?: string }) {
  if (isTextBlockRow(row)) {
    return <TextBlock block={row.text_block} />
  }

  if (isSlotsRow(row)) {
    return (
      <div className="grid grid-cols-12 gap-4" style={{ height: config.chart_height }}>
        {row.slots.map((slot, i) => {
          if (slot.type === 'empty') {
            return <div key={i} className={widthClass(slot.width)} />
          }
          if (isChartSlot(slot)) {
            const chart = config.charts[slot.chartId]
            if (!chart) {
              return (
                <div
                  key={i}
                  className={`${widthClass(slot.width)} flex items-center justify-center bg-db-surface border border-db-border rounded text-db-text-muted text-xs`}
                >
                  Chart not found: {slot.chartId}
                </div>
              )
            }
            return (
              <div key={i} className={widthClass(slot.width)}>
                <ChartSlot
                  chart={chart}
                  height={config.chart_height}
                  globalRefreshInterval={config.global_refresh_interval}
                  accent={config.theme.accent}
                  slug={slug}
                />
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  return null
}

export function Dashboard({ slug }: { slug: string }) {
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [loadError, setLoadError] = useState(false)

  const { toPDF, targetRef } = usePDF({
    filename: config
      ? `${config.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
      : 'dashboard.pdf',
  })

  useEffect(() => {
    fetch(`/d/${slug}/dashboard.json`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load dashboard.json')
        return r.json() as Promise<DashboardConfig>
      })
      .then(setConfig)
      .catch(() => setLoadError(true))
  }, [slug])

  if (loadError) {
    return (
      <div className="min-h-screen bg-db-bg flex items-center justify-center">
        <p className="text-db-error text-sm">Failed to load dashboard.json</p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-db-bg flex items-center justify-center">
        <p className="text-db-text-muted text-xs animate-pulse">Loading dashboard...</p>
      </div>
    )
  }

  if (config.sections.length === 0) {
    return (
      <div className="min-h-screen bg-db-bg flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-db-text-primary font-medium text-sm">{config.title}</p>
          <p className="text-db-text-muted text-xs mt-2">No sections yet.</p>
          <p className="text-db-text-muted/60 text-xs mt-1">
            Run <code className="text-db-accent">/dashboard:new</code> to add your first chart.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-db-bg font-mono">
      <TableOfContents
        sections={config.sections}
        dashboardTitle={config.title}
        onRefresh={triggerRefresh}
        onExportPDF={() => {
          // Point PDF capture at the main content area
          if (targetRef.current) toPDF()
        }}
      />

      {/* Main content */}
      <div ref={targetRef} className="px-6 py-6 space-y-12">
        {config.sections.map((section) => (
          <section key={section.id} id={section.id}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-db-border">
              <div className="w-1 h-4 rounded bg-db-accent" />
              <h2 className="text-db-text-primary font-medium text-sm uppercase tracking-widest">
                {section.title}
              </h2>
            </div>

            {/* Section rows */}
            <div className="space-y-4">
              {section.rows.map((row, i) => (
                <DashboardRow key={i} row={row} config={config} slug={slug} />
              ))}
            </div>
          </section>
        ))}

        {/* Footer */}
        <footer className="pt-8 border-t border-db-border flex items-center justify-between text-xs text-db-text-muted/40">
          <span>{config.title}</span>
          <span>Updated {new Date(config.updated_at).toLocaleDateString()}</span>
        </footer>
      </div>
    </div>
  )
}
