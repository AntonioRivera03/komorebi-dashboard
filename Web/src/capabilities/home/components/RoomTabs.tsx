import type { Room } from '../interfaces/types'
import styles from '../home.module.css'

type Props = { rooms: Room[]; activeId: string | null; counts: Record<string, number>; onSelect: (id: string | null) => void }

export function RoomTabs({ rooms, activeId, counts, onSelect }: Props) {
  return (
    <div className={styles.rooms} role="group" aria-label="Rooms">
      <button type="button" className={styles.roomTab} aria-pressed={activeId === null} onClick={() => onSelect(null)}>
        All rooms
      </button>
      {rooms.map((room) => (
        <button key={room.id} type="button" className={styles.roomTab} aria-pressed={activeId === room.id} onClick={() => onSelect(room.id)}>
          <i aria-hidden="true">{room.glyph}</i>
          {room.name}
          {counts[room.id] ? <span className="k-tag" style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit' }}>{counts[room.id]}</span> : null}
        </button>
      ))}
    </div>
  )
}
