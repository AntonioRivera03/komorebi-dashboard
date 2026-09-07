export function RouteFallback({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback__glyph" aria-hidden="true">
        木
      </span>
      <span className="label">{label}</span>
    </div>
  )
}
