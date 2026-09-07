import { useNow } from '../../../shared/hooks/useNow'
import styles from '../today.module.css'

type Props = { inboxCount: number; producersOk: number; producersTotal: number; homeConnection: string }

export function ContextRibbon({ inboxCount, producersOk, producersTotal, homeConnection }: Props) {
  const now = useNow(15_000)
  return (
    <div className={styles.ribbon} role="status">
      <span>{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
      <span>INBOX · {inboxCount}</span>
      <span>HOME · {homeConnection.toUpperCase()}</span>
      <span>
        PRODUCERS · {producersOk}/{producersTotal} FRESH
      </span>
      <span>DISPLAY MODE LIMITS CONTENT SERVER-SIDE</span>
    </div>
  )
}
