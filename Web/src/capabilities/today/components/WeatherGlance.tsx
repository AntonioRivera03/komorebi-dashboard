import { formatRelative } from '../../../shared/lib/format'
import type { TodayWeather } from '../interfaces/types'
import styles from '../today.module.css'

/** Weather only appears when a provider is configured; never a fabricated reading. */
export function WeatherGlance({ weather }: { weather: TodayWeather }) {
  if (!weather) {
    return (
      <div className={styles.weather}>
        <span>Weather not configured</span>
        <small>add a provider in Briefing sources</small>
      </div>
    )
  }
  return (
    <div className={styles.weather}>
      <strong>
        {weather.temperature}°{weather.unit}
      </strong>
      <span>{weather.condition}</span>
      <span>
        H {weather.high}° · L {weather.low}°
      </span>
      <small>
        {weather.source} · {formatRelative(weather.observedAt)}
      </small>
    </div>
  )
}
