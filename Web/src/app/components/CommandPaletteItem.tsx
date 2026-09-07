type Props = { label: string; hint?: string; selected: boolean; onSelect: () => void; onHover: () => void }

export function CommandPaletteItem({ label, hint, selected, onSelect, onHover }: Props) {
  return (
    <button type="button" role="option" aria-selected={selected} className="palette__item" onClick={onSelect} onMouseEnter={onHover}>
      <span>{label}</span>
      {hint ? <small>{hint}</small> : null}
    </button>
  )
}
