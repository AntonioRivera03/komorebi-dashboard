import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { Notice } from '../../../shared/ui/Notice'
import { Tag } from '../../../shared/ui/Tag'
import { Dialog } from '../../../shared/ui/Dialog'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { formatRelative } from '../../../shared/lib/format'
import { useSource } from '../interfaces/useSource'
import { deleteSource, reextractSource } from '../interfaces/knowledgeApi'
import { ExtractionBadge } from '../components/ExtractionBadge'
import { PassageList } from '../components/PassageList'
import { RevisionList } from '../components/RevisionList'
import styles from '../knowledge.module.css'

export default function SourcePage() {
  const { sourceId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const source = useSource(sourceId)
  const [reextracting, setReextracting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="k-page">
      <AsyncPanel query={source} skeletonLines={8}>
        {({ data }) => (
          <>
            <PageHeader
              back={params.get('session') ? { to: `${routes.sessions}/${encodeURIComponent(params.get('session')!)}?section=Sources`, label: 'Session sources' } : { to: routes.library, label: 'Library' }}
              eyebrow={
                <span className="k-row">
                  <ExtractionBadge state={data.source.state} />
                  <span>
                    {data.source.kind} · rev {data.source.currentRevision} · imported {formatRelative(data.source.importedAt)}
                  </span>
                </span>
              }
              title={data.source.title}
              subtitle={
                <>
                  {data.source.author ? `${data.source.author} · ` : ''}
                  <span className="mono">{data.source.location}</span>
                </>
              }
              actions={
                <>
                  <Button
                    icon="refresh"
                    busy={reextracting}
                    onClick={async () => {
                      setReextracting(true)
                      const result = await reextractSource(data.source.id)
                      setReextracting(false)
                      if (result.status === 'completed') {
                        source.reload()
                        toast('New revision queued · old references preserved')
                      } else if (result.status === 'failed') toast(result.message ?? 'Failed', { tone: 'danger' })
                    }}
                  >
                    {data.source.state === 'failed' ? 'Retry extraction' : 'Re-extract as new revision'}
                  </Button>
                  <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </Button>
                </>
              }
            />
            {data.source.error ? <Notice tone={data.source.state === 'failed' ? 'danger' : 'warn'} glyph="!">{data.source.error}</Notice> : null}
            <div className={styles.reader} style={{ marginTop: 20 }}>
              <Panel flush>
                <PanelHead title="Extracted passages" eyebrow={`Revision ${data.source.currentRevision} · shown separately from the original`} />
                <PassageList chunks={data.chunks} activeLocator={params.get('loc') ?? undefined} />
              </Panel>
              <div className="k-stack">
                {data.source.aiSummary ? (
                  <div className={styles.summary}>
                    <span className="label">AI summary · {data.source.aiSummary.model}</span>
                    <p>{data.source.aiSummary.text}</p>
                    <span className="muted small">Generated {formatRelative(data.source.aiSummary.generatedAt)} · the original is unchanged</span>
                  </div>
                ) : null}
                <Panel flush>
                  <PanelHead title="Topics" />
                  <div className="k-row">
                    {data.source.topics.map((topic) => (
                      <Tag key={topic}>{topic}</Tag>
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <PanelHead title="Revisions" eyebrow="Immutable" />
                  <RevisionList revisions={data.source.revisions} />
                </Panel>
                {data.source.fileHash ? (
                  <p className="muted small mono">
                    file {data.source.fileHash} · an identical hash can prompt reuse but never shares authorization implicitly
                  </p>
                ) : null}
              </div>
            </div>
            <Dialog
              open={confirmDelete}
              onClose={() => setConfirmDelete(false)}
              eyebrow="Deletion propagates"
              title="Delete this source?"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Keep
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await deleteSource(data.source.id)
                      toast('Deleted · search and AI context invalidated; notes keep a removed-source marker')
                      navigate(routes.library)
                    }}
                  >
                    Delete source
                  </Button>
                </>
              }
            >
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                Reads are denied immediately and a tombstone is published. Search excludes it before cleanup finishes; dependent prompts become unusable for new sessions; notes keep a redacted reference. Archive is different from delete.
              </p>
            </Dialog>
          </>
        )}
      </AsyncPanel>
    </div>
  )
}
