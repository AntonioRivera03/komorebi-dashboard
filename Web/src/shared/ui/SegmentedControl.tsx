type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  label: string
}

export function SegmentedControl<T extends string>({ value, onChange, options, label }: Props<T>) {
  return (
    <div className="k-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" className="k-segmented__btn" aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  )
}
