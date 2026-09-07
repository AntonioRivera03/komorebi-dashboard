import assert from 'node:assert/strict'
import { act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { LearnContext, type LearnContextValue } from '../src/capabilities/learn/useLearn'
import { useLearnStorage } from '../src/capabilities/learn/useLearnStorage'
import { SourceComposer } from '../src/capabilities/learn/SourceComposer'
import { SourcesWorkspace } from '../src/capabilities/learn/SourcesWorkspace'
import { SourceReader } from '../src/capabilities/learn/SourceReader'
import { ArtifactList } from '../src/capabilities/learn/components'
import { QuizPlayer } from '../src/capabilities/learn/Quiz'
import { DeckList } from '../src/capabilities/learn/ReviewPage'
import { initialLearnState } from '../src/capabilities/learn/model'
import { workspaceOf } from '../src/capabilities/learn/learnApi'

let api: LearnContextValue
function Harness({ children }: { children?: ReactNode }) {
  const store = useLearnStorage()
  api = store
  return (
    <LearnContext.Provider value={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </LearnContext.Provider>
  )
}
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const button = (label: string) => {
  const found = [...document.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === label,
  )
  assert.ok(found, `Button exists: ${label}`)
  return found
}
async function click(element: HTMLElement) {
  await act(async () => {
    element.click()
  })
}
async function fill(element: HTMLInputElement | HTMLTextAreaElement, text: string) {
  await act(async () => {
    const proto =
      element instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : HTMLTextAreaElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(element, text)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

export async function checkInteractions() {
  const root = createRoot(document.getElementById('root')!)
  const initial = initialLearnState()
  const source = {
    id: 'reading',
    kind: 'source' as const,
    sessionId: 'cognition',
    title: 'Reading',
    topic: 'Memory',
    content: 'A 🧠 remembers. A 🧠 remembers.',
  }
  initial.materials.push(source)
  localStorage.setItem('komorebi.learn.v1', JSON.stringify(initial))
  await act(async () => {
    root.render(
      <Harness>
        <SourceReader source={source} onClose={() => {}} />
      </Harness>,
    )
  })
  const text = document.querySelector('[aria-label="Source text"]')!
  await act(async () => {
    const range = document.createRange()
    range.setStart(text.firstChild!.firstChild!, 16)
    range.setEnd(text.firstChild!.firstChild!, 31)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    text.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  })
  await click(button('Create artifact'))
  assert.equal(api.state.highlights[0].start, 16)
  assert.equal(api.state.artifacts[0].highlightId, api.state.highlights[0].id)
  assert.equal(document.querySelector('mark')?.textContent, 'A 🧠 remembers.')

  await act(async () => {
    root.render(
      <Harness>
        <ArtifactList sessionId="cognition" />
      </Harness>,
    )
  })
  await click(document.querySelector('input[aria-label^="Select artifact:"]') as HTMLElement)
  await click(button('Create deck draft'))
  assert.equal(api.state.deckDrafts.length, 1)
  assert.equal(api.state.cards.length, initial.cards.length)
  const draft = api.state.deckDrafts[0]
  await fill(
    document.getElementById(`front-${draft.cards[0].id}`) as HTMLTextAreaElement,
    'What can a brain do?',
  )
  await act(async () => {
    document
      .querySelector('dialog form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(api.state.cards.length, initial.cards.length + 1)
  assert.ok(api.state.deckDrafts[0].publishedDeckId)

  await act(async () => {
    root.render(
      <Harness>
        <DeckList sessionId="cognition" />
      </Harness>,
    )
  })
  const deckButtons = [...document.querySelectorAll('button')].filter(
    (b) => b.textContent?.trim() === 'Open deck ↗',
  )
  await click(deckButtons.at(-1)!)
  await click(document.querySelector('input[aria-label^="Select card:"]') as HTMLElement)
  await click(button('Create quiz'))
  await act(async () => {
    document
      .querySelector('dialog[open] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  const quiz = api.state.materials.at(-1)!
  assert.equal(quiz.kind, 'quiz')
  assert.equal(quiz.questions?.[0].front, 'What can a brain do?')
  assert.equal(api.state.reviews.length, 0)
  assert.equal(JSON.parse(localStorage.getItem('komorebi.learn.v1')!).materials.at(-1).id, quiz.id)

  await act(async () => {
    root.render(
      <Harness>
        <QuizPlayer quiz={quiz} onClose={() => {}} />
      </Harness>,
    )
  })
  await fill(document.querySelector('textarea')!, 'It remembers.')
  await act(async () => {
    document
      .querySelector('dialog[open] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(api.state.quizAttempts.length, 1)
  assert.equal(api.state.quizAttempts[0].answers[quiz.questions![0].id], 'It remembers.')
  assert.ok(document.body.textContent?.includes('Reference answer'))
  assert.equal(api.state.reviews.length, 0)

  // Source type selection, blocked processing, reviewed extraction and paste fallback.
  let closed = 0
  let finishProcessing: (response: Response) => void = () => {}
  let imports = 0
  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/core/session')) return Response.json({ csrfToken: 'csrf' })
    imports++
    return new Promise<Response>((resolve) => {
      finishProcessing = resolve
    })
  }
  await act(async () => {
    root.render(
      <Harness>
        <SourceComposer
          key="website"
          sessionId="cognition"
          onClose={() => {
            closed++
          }}
        />
      </Harness>,
    )
  })
  assert.equal(document.querySelectorAll('textarea').length, 0, 'Choose a source type first')
  await act(async () => {
    const select = document.getElementById('source-type') as HTMLSelectElement
    select.value = 'website'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await fill(
    document.getElementById('source-url') as HTMLInputElement,
    'https://example.com/article',
  )
  await click(button('Process website'))
  assert.equal(imports, 1)
  assert.equal((document.querySelector('fieldset') as HTMLFieldSetElement).disabled, true)
  assert.equal(document.querySelector('button[aria-label="Close"]'), null)
  await act(async () => {
    document.querySelector('dialog[open]')!.dispatchEvent(new Event('cancel', { cancelable: true }))
  })
  assert.equal(closed, 0, 'Escape cannot dismiss a processing source')
  await act(async () => {
    finishProcessing(
      Response.json({
        title: 'Imported website',
        content: 'Clean article text.',
        url: 'https://example.com/article',
      }),
    )
  })
  assert.equal((document.querySelector('fieldset') as HTMLFieldSetElement).disabled, false)
  assert.equal(
    (document.getElementById('source-content') as HTMLTextAreaElement).value,
    'Clean article text.',
  )
  await fill(document.getElementById('source-topic') as HTMLInputElement, 'Reading')
  await act(async () => {
    document
      .querySelector('dialog[open] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(api.state.materials.at(-1)!.sourceType, 'website')
  assert.equal(closed, 1)
  await act(async () => {
    root.render(
      <Harness>
        <SourcesWorkspace sessionId="cognition" onAdd={() => {}} />
      </Harness>,
    )
  })
  assert.equal(document.querySelector('dialog[open]'), null, 'Sources read inline, not in a popup')
  assert.ok(document.querySelector('[aria-label="Source files"]'))
  assert.equal(
    document.querySelector('[aria-label="Source text"]')!.textContent,
    'Clean article text.',
  )
  // Select an explicitly named old source to prove the reader updates immediately.
  const oldSourceButton = [
    ...document.querySelectorAll('[aria-label="Choose source"] button'),
  ].find((b) => b.querySelector('strong')?.textContent === 'Reading')!
  await click(oldSourceButton as HTMLElement)
  assert.equal(document.querySelector('[aria-label="Source text"]')!.textContent, source.content)

  globalThis.fetch = async (input) =>
    String(input).endsWith('/core/session')
      ? Response.json({ csrfToken: 'csrf' })
      : Response.json({ message: 'Website blocked access.' }, { status: 400 })
  await act(async () => {
    root.render(
      <Harness>
        <SourceComposer key="fallback" sessionId="cognition" onClose={() => {}} />
      </Harness>,
    )
  })
  await act(async () => {
    const select = document.getElementById('source-type') as HTMLSelectElement
    select.value = 'website'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await fill(
    document.getElementById('source-url') as HTMLInputElement,
    'https://example.com/blocked',
  )
  await click(button('Process website'))
  assert.ok(document.body.textContent?.includes('Website blocked access.'))
  await click(button('Paste contents instead'))
  await fill(document.getElementById('source-title') as HTMLInputElement, 'Pasted fallback')
  await fill(document.getElementById('source-topic') as HTMLInputElement, 'Reading')
  await fill(
    document.getElementById('source-content') as HTMLTextAreaElement,
    'Copied website text.',
  )
  await act(async () => {
    document
      .querySelector('dialog[open] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(api.state.materials.at(-1)!.content, 'Copied website text.')
  assert.equal(api.state.materials.at(-1)!.url, 'https://example.com/blocked')

  globalThis.fetch = async () => {
    throw new Error('Text files should process locally')
  }
  await act(async () => {
    root.render(
      <Harness>
        <SourceComposer key="file" sessionId="cognition" onClose={() => {}} />
      </Harness>,
    )
  })
  await act(async () => {
    const select = document.getElementById('source-type') as HTMLSelectElement
    select.value = 'file'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await act(async () => {
    const input = document.getElementById('source-file') as HTMLInputElement
    Object.defineProperty(input, 'files', {
      value: [new File(['Local file contents.'], 'lesson.txt', { type: 'text/plain' })],
      configurable: true,
    })
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await click(button('Process file'))
  assert.equal(
    (document.getElementById('source-content') as HTMLTextAreaElement).value,
    'Local file contents.',
  )
  await fill(document.getElementById('source-topic') as HTMLInputElement, 'Reading')
  await act(async () => {
    document
      .querySelector('dialog[open] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(api.state.materials.at(-1)!.fileName, 'lesson.txt')
  assert.equal(api.state.materials.at(-1)!.sourceType, 'file')

  // Real PDF dialog path: 5 MB boundary, background completion, cancellation and failure.
  let pdfMount = 0
  async function choosePdf(size: number) {
    await act(async () => {
      root.render(<Harness><SourceComposer key={`pdf-${pdfMount++}`} sessionId="cognition" onClose={() => {}} /></Harness>)
    })
    await act(async () => {
      const select = document.getElementById('source-type') as HTMLSelectElement
      select.value = 'file'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      const input = document.getElementById('source-file') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [new File([new Uint8Array(size)], 'scan.pdf', { type: 'application/pdf' })],
        configurable: true,
      })
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }
  const fileCalls: string[] = []
  let releasePdf: (response: Response) => void = () => {}
  globalThis.fetch = async (input, init) => {
    const url = String(input)
    if (url.endsWith('/core/session')) return Response.json({ csrfToken: 'csrf' })
    fileCalls.push(`${init?.method ?? 'GET'} ${url}`)
    if (init?.method === 'DELETE') return new Response(null, { status: 204 })
    if (init?.method === 'POST') {
      assert.ok((init.headers as Record<string, string>)['Idempotency-Key'])
      return Response.json({ id: 'pdf-job', status: 'queued' }, { status: 202 })
    }
    return new Promise<Response>((resolve) => { releasePdf = resolve })
  }
  await choosePdf(5_000_001)
  await click(button('Process file'))
  assert.ok(document.body.textContent?.includes('up to 5 MB'))
  assert.equal(fileCalls.length, 0, 'Oversized PDF does not upload')
  await choosePdf(5_000_000)
  const materialsBeforePdf = api.state.materials.length
  await click(button('Process file'))
  assert.ok(document.body.textContent?.includes('Waiting for the server'))
  assert.equal((document.querySelector('fieldset') as HTMLFieldSetElement).disabled, true)
  assert.ok(button('Cancel processing'))
  await act(async () => {
    releasePdf(Response.json({ id: 'pdf-job', status: 'ready', result: { title: 'Scanned chapter', content: 'Recognized text.' } }))
  })
  assert.equal((document.getElementById('source-content') as HTMLTextAreaElement).value, 'Recognized text.')
  assert.equal(api.state.materials.length, materialsBeforePdf, 'OCR result is reviewed before saving')
  assert.ok(fileCalls.includes('DELETE /api/v1/learn/sources/imports/pdf-job'))

  let discarded = 0
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith('/core/session')) return Response.json({ csrfToken: 'csrf' })
    if (init?.method === 'DELETE') { discarded++; return new Response(null, { status: 204 }) }
    return Response.json({ id: 'cancel-job', status: init?.method === 'POST' ? 'queued' : 'processing' })
  }
  await choosePdf(100)
  await click(button('Process file'))
  await click(button('Cancel processing'))
  assert.equal(discarded, 1)
  assert.ok(document.body.textContent?.includes('Processing canceled'))
  assert.equal((document.querySelector('fieldset') as HTMLFieldSetElement).disabled, false)
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith('/core/session')) return Response.json({ csrfToken: 'csrf' })
    if (init?.method === 'DELETE') return new Response(null, { status: 204 })
    return Response.json({ id: 'failed-job', status: init?.method === 'POST' ? 'queued' : 'failed', message: 'Try a clearer scan.' })
  }
  await click(button('Process file'))
  assert.ok(document.body.textContent?.includes('Try a clearer scan.'))
  assert.ok(button('Paste contents instead'))

  // Exercise actual storage hook, including lost responses and queued edits while a save is pending.
  await act(async () => {
    root.render(<Harness />)
  })
  let stored = workspaceOf(initialLearnState())
  let revision = 0
  let drop = false
  let conflict = false
  let delay = false
  const results = new Map<string, { revision: number }>()
  const keys: string[] = []
  globalThis.fetch = async (input, init) => {
    const path = String(input)
    if (path.endsWith('/core/session'))
      return Response.json({
        actorId: 'owner',
        displayName: 'Test Owner',
        principal: 'user',
        csrfToken: 'csrf',
      })
    if (init?.method === 'PUT') {
      const headers = init.headers as Record<string, string>
      const key = headers['Idempotency-Key']
      keys.push(key)
      if (delay) await pause(600)
      if (results.has(key)) return Response.json({ value: results.get(key) })
      if (conflict || Number(headers['If-Match']) !== revision)
        return Response.json(
          { code: 'revision_conflict', message: 'Changed elsewhere' },
          { status: 409 },
        )
      stored = JSON.parse(init.body as string)
      revision++
      results.set(key, { revision })
      if (drop) {
        drop = false
        throw new Error('Response lost')
      }
      return Response.json({ value: { revision } })
    }
    return Response.json({ data: { revision, workspace: stored } })
  }
  await act(async () => {
    await api.connection!.connect('ticket')
  })
  assert.equal(api.connection!.mode, 'server')
  const originalBody = api.state.artifacts[0].body
  await act(async () => {
    api.update((s) => ({
      ...s,
      artifacts: s.artifacts.map((a, i) => (i === 0 ? { ...a, body: 'Temporary edit' } : a)),
    }))
    api.update((s) => ({
      ...s,
      artifacts: s.artifacts.map((a, i) => (i === 0 ? { ...a, body: originalBody } : a)),
    }))
    await pause(500)
  })
  assert.equal(api.connection!.dirty, false, 'Reverting an unsent edit clears dirty state')
  assert.equal(keys.length, 0)
  drop = true
  await act(async () => {
    api.update((s) => ({
      ...s,
      artifacts: s.artifacts.map((a, i) => (i === 0 ? { ...a, body: 'First edit' } : a)),
    }))
    await pause(500)
  })
  assert.equal(api.connection!.phase, 'error')
  assert.equal(api.connection!.dirty, true)
  await act(async () => {
    api.update((s) => ({
      ...s,
      artifacts: s.artifacts.map((a, i) => (i === 0 ? { ...a, body: 'Later edit' } : a)),
    }))
  })
  await act(async () => {
    api.connection!.retry()
    await pause(1000)
  })
  assert.equal(keys[0], keys[1], 'Retry retains the original idempotency key')
  assert.equal(stored.artifacts[0].body, 'Later edit')
  assert.equal(api.connection!.dirty, false)
  delay = true
  await act(async () => {
    api.update((s) => ({
      ...s,
      artifacts: s.artifacts.map((a, i) => (i === 0 ? { ...a, body: 'In flight' } : a)),
    }))
    await pause(500)
  })
  await act(async () => {
    api.update((s) => ({
      ...s,
      artifacts: s.artifacts.map((a, i) => (i === 0 ? { ...a, body: 'During save' } : a)),
    }))
    await pause(1800)
  })
  assert.equal(stored.artifacts[0].body, 'During save')
  assert.equal(api.connection!.dirty, false)
  delay = false
  conflict = true
  await act(async () => {
    api.update((s) => ({
      ...s,
      artifacts: s.artifacts.map((a, i) => (i === 0 ? { ...a, body: 'Keep unsaved' } : a)),
    }))
    await pause(500)
  })
  assert.equal(api.connection!.conflict, true)
  assert.equal(api.state.artifacts[0].body, 'Keep unsaved')
  assert.equal(stored.artifacts[0].body, 'During save')
  assert.notEqual(
    JSON.parse(localStorage.getItem('komorebi.learn.v1')!).artifacts[0].body,
    'Keep unsaved',
    'Server data never overwrites local preview',
  )
  await act(async () => {
    root.unmount()
  })
  console.log(
    'Learn interaction checks passed: Range highlights, Artifact drafts, deck publication, card selection, quiz creation, inline sources, dynamic imports, processing locks, paste fallback, serialized saves, lost response recovery, and conflicts.',
  )
}
