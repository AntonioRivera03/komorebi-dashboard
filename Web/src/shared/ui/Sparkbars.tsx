type Props = { values: number[]; labels?: string[]; highlightIndex?: number; ariaLabel: string }

export function Sparkbars({ values, labels, highlightIndex, ariaLabel }: Props) {
  const max = Math.max(1, ...values)
  return (
    <div className="k-sparkbars" role="img" aria-label={ariaLabel}>
      {values.map((value, index) => (
        <span key={index} style={{ height: `${(value / max) * 100}%` }} data-hi={index === highlightIndex ? 'true' : undefined} data-label={labels?.[index] ?? String(value)} />
      ))}
    </div>
  )
}
