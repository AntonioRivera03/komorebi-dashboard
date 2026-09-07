import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  completeFocus,
  focusSecondsRemaining,
  stopFocus,
  initialLearnState,
  schedule,
  freshFocus,
  restoreFocusSettings,
  setFocusMinutes,
  toggleFocus,
  validFocusMinutes,
} from '../src/capabilities/learn/model.ts'

const at = new Date(2026, 8, 5, 12).getTime()
test('SM-2 uses 1, 6, then previous-ease intervals and rounds upward', () => {
  let card = initialLearnState().cards[0]
  card = schedule(card, 4, at)
  assert.equal(card.interval, 1)
  assert.equal(card.ease, 2.5)
  card = schedule(card, 5, card.dueAt)
  assert.equal(card.interval, 6)
  assert.equal(card.ease, 2.6)
  card = schedule(card, 4, card.dueAt)
  assert.equal(card.interval, 16)
  assert.equal(card.repetitions, 3)
})
test('failed recall resets repetitions without erasing learned ease; ease has a floor', () => {
  const card = {
    ...initialLearnState().cards[0],
    repetitions: 8,
    interval: 60,
    ease: 1.4,
  }
  const next = schedule(card, 0, at)
  assert.equal(next.repetitions, 0)
  assert.equal(next.interval, 1)
  assert.equal(next.ease, 1.3)
  assert.equal(schedule(next, 4, at).interval, 1)
  assert.equal(card.repetitions, 8)
  assert.deepEqual(schedule(card, 0, at), next)
  assert.throws(() => schedule(card, 6, at))
})
test('focus completion records the deadline once, including after a late wake-up', () => {
  const state = initialLearnState()
  state.focus = {
    ...state.focus,
    title: 'Restaurant phrases',
    sessionId: 'japanese',
    startedAt: at,
    endsAt: at + 25 * 60_000,
  }
  assert.equal(completeFocus(state, at + 1000), state)
  const next = completeFocus(state, at + 90 * 60_000)
  assert.equal(next.focusLog.length, 1)
  assert.equal(next.focusLog[0].completedAt, state.focus.endsAt)
  assert.equal(next.focusLog[0].title, 'Restaurant phrases')
  assert.equal(next.focusLog[0].durationMinutes, 25)
  assert.equal(next.focus.mode, 'focus')
  assert.equal(next.focus.completedAt, state.focus.endsAt)
  assert.equal(next.focus.remaining, 0)
  assert.equal(next.focus.endsAt, null)
  assert.equal(completeFocus(next, at + 100 * 60_000), next)
  assert.equal(
    completeFocus({ ...state, focusLog: next.focusLog }, at + 90 * 60_000).focusLog.length,
    1,
  )
})
test('paused timers and completed breaks never create focus audit rows', () => {
  const state = initialLearnState()
  state.focus = { ...state.focus, startedAt: at, remaining: 30 }
  assert.equal(completeFocus(state, at + 90 * 60_000), state)
  state.focus = { ...state.focus, mode: 'break', endsAt: at + 5 * 60_000 }
  const next = completeFocus(state, at + 10 * 60_000)
  assert.equal(next.focusLog.length, 0)
  assert.equal(next.focus.mode, 'break')
  assert.equal(next.focus.completedAt, state.focus.endsAt)
  assert.equal(next.focus.remaining, 0)
  assert.equal(stopFocus(next, at + 20 * 60_000).focus.remaining, 1500)
})

test('custom durations survive pause, completion, break, and reset without counting paused time', () => {
  let state = initialLearnState()
  state.focus = setFocusMinutes(state.focus, 42)
  assert.equal(state.focus.remaining, 42 * 60)
  state = toggleFocus(state, at)
  state = toggleFocus(state, at + 1250)
  assert.equal(state.focus.remaining, 42 * 60 - 1.25)
  assert.equal(setFocusMinutes(state.focus, 10), state.focus)
  state = toggleFocus(state, at + 61_250)
  const deadline = at + 42 * 60_000 + 60_000
  assert.equal(state.focus.endsAt, deadline)
  state = completeFocus(state, deadline + 8000)
  assert.equal(state.focusLog[0].durationMinutes, 42)
  assert.equal(state.focusLog[0].focusSeconds, 2520)
  assert.equal(state.focusLog[0].completedAt - state.focusLog[0].startedAt, 43 * 60_000)
  assert.equal(state.focus.focusMinutes, 42)
  assert.equal(toggleFocus(state, deadline + 8000), state)
  state = stopFocus(state, deadline + 8000)
  assert.equal(state.focus.remaining, 2520)
  state.focus = freshFocus('break', '', '', state.focus.focusMinutes)
  state = toggleFocus(state, deadline + 8000)
  state = completeFocus(state, deadline + 8000 + 5 * 60_000)
  assert.equal(state.focus.mode, 'break')
  assert.equal(state.focus.remaining, 0)
  state = stopFocus(state, deadline + 8000 + 5 * 60_000)
  assert.equal(state.focus.remaining, 2520)
  assert.equal(freshFocus('focus', '', '', state.focus.focusMinutes).remaining, 2520)
})

test('invalid durations are rejected without changing the timer', () => {
  const focus = initialLearnState().focus
  for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
    assert.equal(validFocusMinutes(value), false)
    assert.equal(setFocusMinutes(focus, value), focus)
  }
  assert.equal(setFocusMinutes(focus, 1).remaining, 60)
  assert.equal(setFocusMinutes(focus, 180).remaining, 10800)
})

test('original fixed-duration storage keeps existing deadlines and history', () => {
  const state = initialLearnState()
  state.focus = { ...state.focus, startedAt: at, endsAt: at + 25 * 60_000 }
  const legacy = JSON.parse(JSON.stringify(completeFocus(state, at + 25 * 60_000)))
  delete legacy.focus.focusMinutes
  delete legacy.focusSoundEnabled
  delete legacy.focusLog[0].focusSeconds
  legacy.focus.endsAt = at + 30 * 60_000
  const restored = restoreFocusSettings(legacy)
  assert.equal(restored.focus.focusMinutes, 25)
  assert.equal(restored.focus.endsAt, legacy.focus.endsAt)
  assert.equal(restored.focusLog[0].focusSeconds, 1500)
  assert.equal(restored.focusSoundEnabled, true)
})

test('Start and Resume never display an extra second with a stale UI clock', () => {
  let state = initialLearnState()
  state.focus = setFocusMinutes(state.focus, 1)
  state = toggleFocus(state, at)
  assert.equal(focusSecondsRemaining(state.focus, at - 499), 60)
  assert.equal(focusSecondsRemaining(state.focus, at), 60)
  assert.equal(focusSecondsRemaining(state.focus, at + 1000), 59)
  state = toggleFocus(state, at + 10_250)
  assert.equal(focusSecondsRemaining(state.focus, at + 20_000), 50)
  state = toggleFocus(state, at + 20_000)
  assert.equal(focusSecondsRemaining(state.focus, at + 19_501), 50)
  assert.equal(focusSecondsRemaining(state.focus, at + 21_000), 49)
})

test('completion waits for Stop across reloads, without extending or duplicating the audit', () => {
  let state = initialLearnState()
  state.focus = setFocusMinutes(state.focus, 1)
  state = toggleFocus(state, at)
  state = completeFocus(state, at + 60_000)
  const finished = restoreFocusSettings(JSON.parse(JSON.stringify(state)))
  assert.equal(finished.focus.completedAt, at + 60_000)
  assert.equal(focusSecondsRemaining(finished.focus, at + 120_000), 0)
  assert.equal(completeFocus(finished, at + 120_000), finished)
  assert.equal(toggleFocus(finished, at + 120_000), finished)
  state = stopFocus(finished, at + 120_000)
  assert.equal(state.focus.completedAt, null)
  assert.equal(state.focus.remaining, 60)
  assert.equal(state.focusLog.length, 1)
  assert.equal(state.focusLog[0].completedAt, at + 60_000)
  assert.equal(state.focusLog[0].focusSeconds, 60)
  assert.equal(stopFocus(state, at + 120_001).focusLog.length, 1)
})

test('Stop at the deadline records completion, while early reset does not', () => {
  let state = initialLearnState()
  state.focus = setFocusMinutes(state.focus, 1)
  state = toggleFocus(state, at)
  assert.equal(stopFocus(state, at + 59_999).focusLog.length, 0)
  const stopped = stopFocus(state, at + 60_000)
  assert.equal(stopped.focusLog.length, 1)
  assert.equal(stopped.focus.completedAt, null)
})

test('source highlights preserve repeated passage positions and create one linked artifact', async () => {
  const { addHighlight, artifactFromHighlight } = await import('../src/capabilities/learn/model.ts')
  let state = initialLearnState()
  state.materials = [
    {
      id: 'source',
      kind: 'source',
      sessionId: 'cognition',
      title: 'Reading',
      topic: 'Memory',
      content: 'A 🧠 remembers. A 🧠 remembers.',
    },
  ]
  const highlight = {
    id: 'highlight',
    sourceId: 'source',
    start: 16,
    end: 31,
    quote: 'A 🧠 remembers.',
    createdAt: at,
  }
  state = addHighlight(state, highlight)
  assert.equal(addHighlight(state, { ...highlight, id: 'duplicate' }), state)
  assert.throws(() => addHighlight(state, { ...highlight, quote: 'Wrong quote' }))
  state = artifactFromHighlight(state, 'highlight', 'artifact', at)
  assert.equal(state.artifacts[0].body, highlight.quote)
  assert.equal(state.artifacts[0].highlightId, highlight.id)
  assert.equal(artifactFromHighlight(state, 'highlight', 'duplicate', at), state)
})

test('artifact drafts stay out of review until edited and published exactly once', async () => {
  const { draftFromArtifacts, publishDeckDraft } =
    await import('../src/capabilities/learn/model.ts')
  let state = initialLearnState()
  const draft = draftFromArtifacts(state, ['a1', 'a2', 'a1'], 'draft', at)
  assert.equal(draft.cards.length, 2)
  assert.equal(draft.cards[0].back, state.artifacts[0].body)
  const initialCards = state.cards.length
  state = { ...state, deckDrafts: [draft] }
  assert.equal(state.cards.length, initialCards)
  assert.throws(() => publishDeckDraft(state, draft.id, at))
  state.deckDrafts[0] = {
    ...draft,
    cards: [{ ...draft.cards[0], front: 'How can you ask politely?' }],
  }
  state = publishDeckDraft(state, draft.id, at)
  assert.equal(state.cards.length, initialCards + 1)
  assert.equal(state.cards.at(-1)!.artifactId, 'a1')
  assert.equal(state.cards.at(-1)!.repetitions, 0)
  assert.equal(publishDeckDraft(state, draft.id, at), state)
  assert.throws(() => draftFromArtifacts(state, ['missing'], 'invalid', at))
})

test('selected flashcards become quiz snapshots without changing cards or review history', async () => {
  const { quizFromCards } = await import('../src/capabilities/learn/model.ts')
  const state = initialLearnState()
  const before = JSON.stringify(state)
  const quiz = quizFromCards(state, ['menu', 'thanks', 'menu'], 'quiz', 'Polite Japanese')
  assert.equal(quiz.questions!.length, 2)
  assert.equal(quiz.questions![0].front, state.cards[0].front)
  assert.equal(quiz.questions![0].back, state.cards[0].back)
  assert.equal(JSON.stringify(state), before)
  state.cards[0].front = 'Edited card'
  assert.notEqual(quiz.questions![0].front, state.cards[0].front)
  assert.equal(quizFromCards(state, ['menu'], 'one', 'One question').questions!.length, 1)
  assert.throws(() => quizFromCards(state, ['menu', 'loop'], 'mixed', 'Mixed sessions'))
})

test('old browser workspaces gain empty drafts, highlights and attempts without losing data', () => {
  const state = initialLearnState()
  const legacy = { ...state } as Partial<typeof state>
  delete legacy.deckDrafts
  delete legacy.highlights
  delete legacy.quizAttempts
  const restored = restoreFocusSettings(legacy as typeof state)
  assert.deepEqual(restored.deckDrafts, [])
  assert.deepEqual(restored.highlights, [])
  assert.deepEqual(restored.quizAttempts, [])
  assert.deepEqual(restored.cards, state.cards)
})
