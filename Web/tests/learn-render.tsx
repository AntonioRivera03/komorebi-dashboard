import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { LearnContext } from '../src/capabilities/learn/useLearn'
import {
  completeFocus,
  initialLearnState,
  toggleFocus,
  type LearnState,
} from '../src/capabilities/learn/model'
import LearnHomePage from '../src/capabilities/learn/LearnHomePage'
import SessionsPage from '../src/capabilities/learn/SessionsPage'
import SessionPage from '../src/capabilities/learn/SessionPage'
import ArtifactsPage from '../src/capabilities/learn/ArtifactsPage'
import ReviewPage from '../src/capabilities/learn/ReviewPage'
import { SubNav } from '../src/app/components/SubNav'
import { Composer } from '../src/capabilities/learn/components'

function render(path: string, state = initialLearnState()) {
  return renderToStaticMarkup(
    <LearnContext.Provider value={{ state, update: () => {}, storageError: false }}>
      <MemoryRouter initialEntries={[path]}>
        <SubNav />
        <Routes>
          <Route path="/learn" element={<LearnHomePage />} />
          <Route path="/learn/sessions" element={<SessionsPage />} />
          <Route path="/learn/sessions/:id" element={<SessionPage />} />
          <Route path="/learn/artifacts" element={<ArtifactsPage />} />
          <Route path="/learn/review" element={<ReviewPage />} />
        </Routes>
      </MemoryRouter>
    </LearnContext.Provider>,
  )
}
export function checkRendering() {
  for (const path of [
    '/learn',
    '/learn/sessions',
    '/learn/sessions/japanese',
    '/learn/sessions/cognition?section=Sources',
    '/learn/sessions/japanese?section=Artifacts',
    '/learn/sessions/japanese?section=Flashcards',
    '/learn/sessions/cognition?section=Quizzes',
    '/learn/sessions/cognition?section=Exams',
    '/learn/artifacts',
    '/learn/review',
  ]) {
    const html = render(path)
    assert.ok(html.includes('Preview · saved in this browser.'), path)
    assert.ok(!html.includes('interested'), path)
    assert.ok(!html.includes('Daily cap'), path)
    assert.ok(!html.includes('14-day forecast'), path)
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1, `One active Learn tab: ${path}`)
  }
  const custom = initialLearnState()
  custom.focus.focusMinutes = 42
  custom.focus.remaining = 42 * 60
  custom.focusLog = [
    {
      id: 'custom-log',
      title: 'Custom focus',
      sessionId: 'japanese',
      startedAt: Date.now() - 42 * 60_000,
      completedAt: Date.now(),
      durationMinutes: 42,
      focusSeconds: 2520,
    },
  ]
  const home = render('/learn', custom)
  assert.ok(home.includes('42 min focus'))
  assert.ok(home.includes('42:00'))
  assert.ok(home.includes('42 min</td>'))
  assert.ok(home.includes('42<span class="small"> min'))
  assert.ok(home.includes('Focus duration (minutes)'))
  assert.ok(home.includes('Completion jingle'))
  assert.ok(home.includes('Test sound'))
  assert.ok(home.includes('href="/learn/review"'))
  assert.ok(home.includes('Head to Review to study your decks.'))
  assert.ok(!home.includes('A card to think about'))
  assert.ok(!home.includes('a little, every day'))
  assert.ok(!home.includes('Just a moment of recall'))
  let ended = toggleFocus(custom, Date.now() - 42 * 60_000)
  ended = completeFocus(ended, Date.now())
  const endedHtml = render('/learn', ended)
  assert.ok(endedHtml.includes('00:00'))
  assert.ok(endedHtml.includes('>Finish</button>'))
  assert.ok(!endedHtml.includes('>Start break</button>'))
  assert.ok(!endedHtml.includes('>Reset</button>'))
  const japanese = render('/learn/review?session=japanese')
  assert.ok(japanese.includes('Everyday Japanese'))
  assert.ok(!japanese.includes('Memory &amp; attention'))
  const artifacts = render('/learn/artifacts?session=japanese')
  assert.ok(artifacts.includes('お願いします'))
  assert.ok(!artifacts.includes('Think conductor'))
  const state: LearnState = {
    ...initialLearnState(),
    sessions: [],
    cards: [],
    decks: [],
    artifacts: [],
    materials: [],
  }
  for (const path of ['/learn', '/learn/sessions', '/learn/artifacts', '/learn/review'])
    assert.ok(render(path, state).includes('Preview · saved in this browser.'))
  const form = renderToStaticMarkup(
    <LearnContext.Provider value={{ state: initialLearnState(), update: () => {}, storageError: false }}>
      <Composer kind="card" sessionId="japanese" deck={initialLearnState().decks[0]} onClose={() => {}} />
    </LearnContext.Provider>,
  )
  assert.ok(form.includes('Everyday expressions'))
  assert.ok(form.includes('Vocabulary'))
  assert.ok(!form.includes('Working memory'))
  console.log(
    'Learn rendering checks passed: all pages, scoped content, empty states, active navigation, card topics.',
  )
}
