interface Props {
  title: string
}

export function ErrorCard({ title }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 bg-db-surface border border-db-error/30 rounded">
      <div className="flex items-center gap-2 text-db-error">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 1L15 14H1L8 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
        </svg>
        <span className="text-xs font-medium">Data unavailable</span>
      </div>
      <p className="text-db-text-primary text-xs font-medium">{title}</p>
    </div>
  )
}
