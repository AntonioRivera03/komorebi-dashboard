import { useSearchParams } from 'react-router'
import { Button } from '../../shared/ui/Button'
import { Icon } from '../../shared/ui/Icon'
import { useLearn } from './useLearn'
import { SourceReader } from './SourceReader'
import styles from './learn.module.css'

export function SourcesWorkspace({ sessionId, onAdd }: { sessionId: string; onAdd: () => void }) {
  const { state } = useLearn()
  const [params, setParams] = useSearchParams()
  const sources = state.materials.filter((m) => m.kind === 'source' && m.sessionId === sessionId)
  const source = sources.find((s) => s.id === params.get('source')) ?? sources[0]
  return (
    <div className={styles.sourceWorkspace}>
      <aside className={styles.sourceFiles} aria-label="Source files">
        <div className={styles.sourceFilesHead}>
          <h2>Sources · {sources.length}</h2>
          <Button size="sm" variant="ghost" icon="plus" onClick={onAdd}>
            Add
          </Button>
        </div>
        <nav aria-label="Choose source">
          {sources.map((s) => (
            <button
              key={s.id}
              className={styles.sourceFile}
              aria-pressed={s.id === source?.id}
              onClick={() => setParams({ section: 'Sources', source: s.id })}
            >
              <Icon name="book" size={18} />
              <span>
                <strong>{s.title}</strong>
                <small>
                  {s.sourceType ?? (s.url ? 'website' : 'text')} · {s.topic}
                </small>
              </span>
            </button>
          ))}
        </nav>
        {!sources.length && <p className="muted small">Your sources will appear here.</p>}
      </aside>
      {source ? (
        <SourceReader key={source.id} source={source} />
      ) : (
        <div className={styles.sourceBlank}>
          <h2>Add your first source</h2>
          <p>Bring in a website, a file, or your own text to start reading.</p>
          <Button onClick={onAdd}>Add source</Button>
        </div>
      )}
    </div>
  )
}
