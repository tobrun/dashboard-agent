interface TextBlockData {
  type: 'paragraph' | 'heading'
  content: string
}

interface Props {
  block: TextBlockData
}

export function TextBlock({ block }: Props) {
  if (block.type === 'heading') {
    return (
      <h3 className="text-db-text-primary font-medium text-sm uppercase tracking-widest mt-6 mb-3">
        {block.content}
      </h3>
    )
  }

  return (
    <p className="text-db-text-muted text-xs leading-relaxed mb-4 max-w-3xl">
      {block.content}
    </p>
  )
}
