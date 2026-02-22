import ReactECharts from 'echarts-for-react'
import { usePollingData } from '../hooks/usePollingData'
import { ErrorCard } from './ErrorCard'
import { deepMerge } from '../utils/deepMerge'
import type { ChartConfig, DashboardConfig } from '../types/dashboard'

interface Props {
  chart: ChartConfig
  height: number
  globalRefreshInterval: number
  accent: string
  slug?: string
}

function applyTheme(
  option: Record<string, unknown>,
  accent: string
): Record<string, unknown> {
  return {
    backgroundColor: '#111827',
    textStyle: { fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 11 },
    ...option,
    color: (option.color as string[]) ?? [
      accent,
      '#6366f1',
      '#f59e0b',
      '#10b981',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
    ],
    grid: {
      containLabel: true,
      left: 12,
      right: 12,
      top: 32,
      bottom: 12,
      ...(option.grid as object | undefined),
    },
  }
}

export function ChartSlot({ chart, height, globalRefreshInterval, accent, slug }: Props) {
  const interval = (chart.refresh_interval ?? globalRefreshInterval) * 1000
  const { data, error, lastUpdated } = usePollingData(chart.dataSource, interval, slug)

  if (error) {
    return <ErrorCard title={chart.title} lastAttempted={lastUpdated} />
  }

  const baseOption = applyTheme(chart.echartsOption, accent)
  const finalOption = data
    ? deepMerge(baseOption, data) as Record<string, unknown>
    : baseOption

  return (
    <div className="relative h-full bg-db-surface border border-db-border rounded shadow-panel overflow-hidden">
      {/* Chart title bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 flex items-center justify-between bg-db-surface/80 backdrop-blur-sm border-b border-db-border">
        <span className="text-xs font-medium text-db-text-muted uppercase tracking-wide truncate">
          {chart.title}
        </span>
        {lastUpdated && (
          <span className="text-xs text-db-text-muted/50 shrink-0 ml-2">
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Loading state */}
      {!data && !error && (
        <div className="h-full flex items-center justify-center">
          <span className="text-xs text-db-text-muted animate-pulse">Loading...</span>
        </div>
      )}

      {/* Chart */}
      {data && (
        <div className="pt-8 h-full">
          <ReactECharts
            option={finalOption}
            style={{ height: height - 32, width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
      )}
    </div>
  )
}

// Preview variant — used in session preview without polling title bar
export function ChartSlotPreview({
  chart,
  height,
  globalConfig,
}: {
  chart: ChartConfig
  height: number
  globalConfig: Pick<DashboardConfig, 'global_refresh_interval' | 'theme'>
}) {
  return (
    <ChartSlot
      chart={chart}
      height={height}
      globalRefreshInterval={globalConfig.global_refresh_interval}
      accent={globalConfig.theme.accent}
    />
  )
}
