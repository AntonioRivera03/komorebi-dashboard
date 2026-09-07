import { useSession } from '../../../app/providers/useSession'
import { greetingFor } from '../../../shared/lib/format'
import { useNow } from '../../../shared/hooks/useNow'
import type { TodayWeather } from '../interfaces/types'
import { WeatherGlance } from './WeatherGlance'
import styles from '../today.module.css'

type Props = { weather: TodayWeather; cardCount: number; exceptionCount: number }

export function WelcomeHero({ weather, cardCount, exceptionCount }: Props) {
  const { session } = useSession()
  const now = useNow(60_000)
  const line = exceptionCount > 0 ? `${exceptionCount} thing${exceptionCount === 1 ? '' : 's'} need${exceptionCount === 1 ? 's' : ''} attention; the rest can wait.` : 'Nothing needs urgent attention. A few chosen things, then the day.'
  return (
    <section className={styles.welcome} aria-label="Welcome">
      <div className={styles.welcomeCopy}>
        <p className="eyebrow">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1>
          {greetingFor(now)}, {session.displayName}.
        </h1>
        <p className={styles.subtitle}>
          {line} {cardCount} cards, bounded on purpose.
        </p>
      </div>
      <div className={styles.heroRight}>
        <div className={styles.symbol} aria-hidden="true" title="komorebi — sunlight filtering through leaves">
          木<span>komorebi</span>
        </div>
        <WeatherGlance weather={weather} />
      </div>
    </section>
  )
}
