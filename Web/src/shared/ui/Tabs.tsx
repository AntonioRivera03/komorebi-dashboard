type Tab<T extends string> = { id: T; label: string; count?: number }

type Props<T extends string> = {
  tabs: Tab<T>[]
  active: T
  onChange: (id: T) => void
  label: string
}

export function Tabs<T extends string>({ tabs, active, onChange, label }: Props<T>) {
  return (
    <div className="k-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" role="tab" className="k-tab" aria-selected={tab.id === active} onClick={() => onChange(tab.id)}>
          {tab.label}
          {tab.count !== undefined ? <span className="k-tab__count">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  )
}
