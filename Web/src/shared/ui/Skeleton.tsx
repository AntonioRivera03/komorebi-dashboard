type Props = { lines?: number; widths?: string[] }

export function Skeleton({ lines = 3, widths = ['70%', '90%', '55%'] }: Props) {
  return (
    <div className="k-skeleton" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} style={{ width: widths[index % widths.length] }} />
      ))}
    </div>
  )
}
