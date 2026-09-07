import styles from '../voice.module.css'

export function Waveform({ active }: { active: boolean }) {
  return (
    <div className={styles.wave} data-active={active} aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => (
        <i key={index} style={{ animationDelay: `${(index % 7) * 0.09}s`, animationPlayState: active ? 'running' : 'paused' }} />
      ))}
    </div>
  )
}
