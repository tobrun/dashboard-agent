import type { Section } from '../types/dashboard'

interface Props {
  sections: Section[]
  dashboardTitle: string
  onExportPDF: () => void
}

export function TableOfContents({ sections, dashboardTitle, onExportPDF }: Props) {
  if (sections.length === 0) return null

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="sticky top-0 z-10 bg-db-bg/95 backdrop-blur border-b border-db-border px-6 py-3">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-db-accent font-medium text-xs mr-4 shrink-0">
            {dashboardTitle}
          </span>
          <div className="flex items-center gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className="px-3 py-1 text-xs text-db-text-muted hover:text-db-accent hover:bg-db-surface rounded transition-colors whitespace-nowrap"
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onExportPDF}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1 text-xs text-db-text-muted hover:text-db-accent hover:bg-db-surface rounded border border-db-border hover:border-db-accent/40 transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 9H10M6 1V7M6 7L3.5 4.5M6 7L8.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export PDF
        </button>
      </div>
    </div>
  )
}
