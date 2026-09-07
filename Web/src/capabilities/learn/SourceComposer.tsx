import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../shared/ui/Button'
import { Dialog } from '../../shared/ui/Dialog'
import { Field } from '../../shared/ui/Field'
import { Select } from '../../shared/ui/Select'
import { TextArea } from '../../shared/ui/TextArea'
import { TextInput } from '../../shared/ui/TextInput'
import type { components } from '../../generated/api'
import { extractRemote } from './sourceImportApi'
import { uid } from './model'
import { useLearn } from './useLearn'
import styles from './learn.module.css'

type SourceType = 'website' | 'file' | 'text'
type Extracted = components['schemas']['ExtractedSource']

async function readTextFile(file: File): Promise<Extracted> {
  const content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
  return {
    title: file.name.replace(/\.[^.]+$/, ''),
    content: content
      .replace(/^\uFEFF/, '')
      .replace(/\0/g, '')
      .trim(),
  }
}

export function SourceComposer({
  sessionId = '',
  onClose,
}: {
  sessionId?: string
  onClose: () => void
}) {
  const { state, update } = useLearn()
  const navigate = useNavigate()
  const [type, setType] = useState<SourceType | ''>('')
  const [subject, setSubject] = useState(sessionId)
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [manual, setManual] = useState(false)
  const [processed, setProcessed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const working = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const [progress, setProgress] = useState('')
  useEffect(() => () => controller.current?.abort(), [])
  const [finalUrl, setFinalUrl] = useState('')
  const ready = type === 'text' || manual || processed
  const process = async () => {
    if (working.current || !type || type === 'text') return
    if (type === 'website') {
      try {
        const parsed = new URL(url)
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
      } catch {
        setError('Enter a complete http:// or https:// website address.')
        return
      }
    }
    if (type === 'file' && !file) {
      setError('Choose a file first.')
      return
    }
    if (file && type === 'file' && file.size > 5_000_000) {
      setError('Choose a file up to 5 MB or paste a section instead.')
      return
    }
    working.current = true
    setBusy(true)
    setError('')
    setProcessed(false)
    const attempt = new AbortController()
    controller.current = attempt
    setProgress(type === 'website' ? 'Reading website…' : 'Uploading and reading file…')
    try {
      const result =
        type === 'file' && file && /\.(txt|md|markdown)$/i.test(file.name)
          ? await readTextFile(file)
          : await extractRemote(type, type === 'website' ? url : file!, attempt.signal, setProgress)
      attempt.signal.throwIfAborted()
      if (!result.content.trim())
        throw new Error('No readable text was found. Paste the contents instead.')
      if (result.content.length > 200000)
        throw new Error('The source is too long. Paste a section of up to 200,000 characters.')
      setContent(result.content)
      setTitle((current) => current || result.title.slice(0, 300))
      setFinalUrl(result.url ?? url)
      setProcessed(true)
      setManual(false)
    } catch (err) {
      const message = attempt.signal.aborted ? 'Processing canceled. You can try again.'
        : err instanceof Error ? err.message : 'The source could not be processed.'
      setError(
        message.includes('authenticat') || message.includes('session')
          ? 'Connect Learn to your server to process websites, HTML and PDFs, or paste the contents below.'
          : message,
      )
    } finally {
      working.current = false
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      title="Add a source"
      dismissible={!busy}
      onClose={() => {
        if (!working.current) onClose()
      }}
      wide
    >
      <form
        className={styles.form}
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault()
          if (
            working.current ||
            !type ||
            !ready ||
            !subject ||
            !title.trim() ||
            !topic.trim() ||
            !content.trim()
          )
            return
          const id = uid()
          update((s) => ({
            ...s,
            sessions: s.sessions.map((item) =>
              item.id === subject
                ? { ...item, topics: [...new Set([...item.topics, topic.trim()])] }
                : item,
            ),
            materials: [
              ...s.materials,
              {
                id,
                kind: 'source',
                sourceType: type,
                sessionId: subject,
                title: title.trim(),
                topic: topic.trim(),
                content: content.trim(),
                ...(type === 'website' && /^https?:\/\//i.test(finalUrl || url)
                  ? { url: finalUrl || url }
                  : {}),
                ...(type === 'file' && file ? { fileName: file.name.slice(0, 300) } : {}),
              },
            ],
          }))
          onClose()
          navigate(`/learn/sessions/${subject}?section=Sources&source=${id}`)
        }}
      >
        <fieldset className={styles.importFields} disabled={busy}>
          <Field label="Source type" htmlFor="source-type">
            <Select
              id="source-type"
              value={type}
              options={[
                { value: '', label: 'Choose source type', disabled: true },
                { value: 'website', label: 'Website' },
                { value: 'file', label: 'File' },
                { value: 'text', label: 'Text' },
              ]}
              onChange={(e) => {
                setType(e.target.value as SourceType)
                setContent('')
                setTitle('')
                setManual(false)
                setProcessed(false)
                setError('')
                setFile(null)
                setUrl('')
                setFinalUrl('')
              }}
            />
          </Field>
          {type === 'website' && (
            <Field label="Website URL" htmlFor="source-url">
              <TextInput
                id="source-url"
                type="url"
                maxLength={2000}
                placeholder="https://…"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setFinalUrl('')
                  setProcessed(false)
                  setContent('')
                }}
              />
            </Field>
          )}
          {type === 'file' && (
            <Field
              label="File"
              htmlFor="source-file"
              hint="PDF, text, Markdown or HTML · up to 5 MB. Scanned PDFs use English OCR; up to 100 pages."
            >
              <input
                id="source-file"
                type="file"
                accept=".pdf,.txt,.md,.markdown,.html,.htm"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null)
                  setProcessed(false)
                  setContent('')
                }}
              />
            </Field>
          )}
          {type && type !== 'text' && !manual && (
            <Button
              onClick={() => void process()}
              disabled={type === 'website' ? !url.trim() : !file}
            >
              {processed
                ? 'Process again'
                : type === 'website'
                  ? 'Process website'
                  : 'Process file'}
            </Button>
          )}
          {error && (
            <div role="alert">
              <p>{error}</p>
              {!manual && (
                <Button
                  onClick={() => {
                    setManual(true)
                    setContent('')
                    setProcessed(false)
                  }}
                >
                  Paste contents instead
                </Button>
              )}
            </div>
          )}
          {ready && (
            <>
              {!sessionId && (
                <Field label="Session">
                  <Select
                    aria-label="Session"
                    value={subject}
                    options={[
                      { value: '', label: 'Choose a session', disabled: true },
                      ...state.sessions.map((s) => ({ value: s.id, label: s.title })),
                    ]}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </Field>
              )}
              <Field label="Title" htmlFor="source-title">
                <TextInput
                  id="source-title"
                  required
                  maxLength={300}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field label="Topic" htmlFor="source-topic">
                <TextInput
                  id="source-topic"
                  required
                  maxLength={100}
                  list="source-topics"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <datalist id="source-topics">
                  {state.sessions
                    .find((s) => s.id === subject)
                    ?.topics.map((t) => (
                      <option key={t} value={t} />
                    ))}
                </datalist>
              </Field>
              <Field
                label={processed ? 'Extracted text' : 'Source text'}
                htmlFor="source-content"
                hint={processed ? 'Review the extracted text before adding it.' : undefined}
              >
                <TextArea
                  id="source-content"
                  required
                  rows={12}
                  maxLength={200000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </Field>
            </>
          )}
          <div className={styles.cardFooter}>
            <Button onClick={onClose}>Cancel</Button>
            {ready && (
              <Button type="submit" variant="primary">
                Add source
              </Button>
            )}
          </div>
        </fieldset>
        {busy && (
          <div className={styles.importProgress} role="status">
            <p>{progress}</p>
            <progress aria-label="Processing source" />
            <p className="muted small">
              Scanned PDFs can take several minutes. Review the extracted text before saving.
            </p>
            <Button onClick={() => controller.current?.abort()}>Cancel processing</Button>
          </div>
        )}
      </form>
    </Dialog>
  )
}
