import { Link } from 'react-router'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Tag } from '../../../shared/ui/Tag'
import type { SearchResult } from '../interfaces/types'
import styles from '../knowledge.module.css'

function highlight(text: string, needle: string) {
  if (!needle) return text
  const index = text.toLowerCase().indexOf(needle.toLowerCase())
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  )
}

export function SearchResultRow({ result, query }: { result: SearchResult; query: string }) {
  return (
    <div className={styles.result}>
      <div className="k-row k-row--between">
        <Link to={result.route} style={{ fontWeight: 500, fontSize: 13 }}>
          {result.title}
          {result.locator ? <span className="mono muted" style={{ marginLeft: 8, fontSize: 10 }}>{result.locator}</span> : null}
        </Link>
        <div className="k-row" style={{ gap: 4 }}>
          <StatusPill tone={result.kind === 'note' ? 'accent' : 'neutral'}>{result.kind === 'note' ? 'note' : 'source'}</StatusPill>
          {result.topics.slice(0, 2).map((topic) => (
            <Tag key={topic}>{topic}</Tag>
          ))}
        </div>
      </div>
      <q>{highlight(result.excerpt, query)}</q>
      <span className="mono small muted">
        {result.resource.owner}/{result.resource.kind} {result.resource.id} r{result.resource.revision} · score {result.score.toFixed(2)}
      </span>
    </div>
  )
}
