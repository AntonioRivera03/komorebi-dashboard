import { Button } from '../../../shared/ui/Button'
import { useFocusTimer } from '../interfaces/useFocusTimer'
import styles from '../study.module.css'

export function FocusTimer() {
  const timer = useFocusTimer()
  return (
    <div className={styles.focusRow}>
      <Button variant="primary" onClick={timer.toggle} icon={timer.running ? 'pause' : 'play'}>
        {timer.running ? 'Pause' : timer.remaining === 25 * 60 ? 'Start 25 min' : 'Resume'}
      </Button>
      <span className={styles.timer} data-running={timer.running} aria-live="off">
        {timer.display}
      </span>
      <Button variant="ghost" size="sm" onClick={timer.reset} style={{ marginLeft: 'auto' }}>
        Reset
      </Button>
    </div>
  )
}
