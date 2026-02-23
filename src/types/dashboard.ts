export interface DashboardConfig {
  title: string
  description: string
  created_at: string
  updated_at: string
  theme: {
    mode: 'dark' | 'light'
    accent: string
    font: string
  }
  chart_height: number
  sections: Section[]
  charts: Record<string, ChartConfig>
}

export interface Section {
  id: string
  title: string
  rows: Row[]
}

export type Row = TextBlockRow | SlotsRow

export interface TextBlockRow {
  text_block: {
    type: 'paragraph' | 'heading'
    content: string
  }
}

export interface SlotsRow {
  slots: Slot[]
}

export type Slot = ChartSlotDef | EmptySlot

export interface ChartSlotDef {
  type: 'chart'
  chartId: string
  width: 'full' | '1/2' | '1/3' | '2/3'
}

export interface EmptySlot {
  type: 'empty'
  width: '1/2' | '1/3' | '2/3'
}

export interface ChartConfig {
  id: string
  title: string
  source?: string
  dataSource: string[]
  echartsOption: Record<string, unknown>
}

// Type guards
export function isTextBlockRow(row: Row): row is TextBlockRow {
  return 'text_block' in row
}

export function isSlotsRow(row: Row): row is SlotsRow {
  return 'slots' in row
}

export function isChartSlot(slot: Slot): slot is ChartSlotDef {
  return slot.type === 'chart'
}
