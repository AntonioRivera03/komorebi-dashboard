export type Subject = {
  id: string
  title: string
  description: string
  topics: string[]
  symbol: string
}
export type Artifact = {
  id: string
  sessionId: string
  topic: string
  body: string
  updatedAt: number
  highlightId?: string
}
export type Deck = {
  id: string
  sessionId: string
  title: string
  topic: string
}
export type Card = {
  id: string
  deckId: string
  topic: string
  front: string
  back: string
  artifactId?: string
  repetitions: number
  interval: number
  ease: number
  dueAt: number
}
export type Review = {
  id: string
  cardId: string
  deckId: string
  sessionId: string
  quality: number
  at: number
  previous: Card
  next: Card
}
export type Material = {
  id: string
  sessionId: string
  kind: 'source' | 'quiz' | 'exam'
  title: string
  topic: string
  content: string
  answer?: string
  route?: string
  url?: string
  sourceType?: 'website' | 'file' | 'text'
  fileName?: string
  questions?: QuizQuestion[]
}
export type Highlight = {
  id: string
  sourceId: string
  start: number
  end: number
  quote: string
  createdAt: number
}
export type DraftCard = {
  id: string
  artifactId: string
  front: string
  back: string
  topic: string
}
export type DeckDraft = {
  id: string
  sessionId: string
  title: string
  topic: string
  cards: DraftCard[]
  createdAt: number
  updatedAt: number
  publishedDeckId?: string
}
export type QuizQuestion = {
  id: string
  cardId?: string
  front: string
  back: string
}
export type QuizAttempt = {
  id: string
  quizId: string
  at: number
  questions: QuizQuestion[]
  answers: Record<string, string>
}
export type Focus = {
  id: string
  title: string
  sessionId: string
  focusMinutes: number
  remaining: number
  endsAt: number | null
  startedAt: number | null
  completedAt: number | null
  mode: 'focus' | 'break'
}
export type FocusLog = {
  id: string
  title: string
  sessionId: string
  startedAt: number
  completedAt: number
  durationMinutes: number
  focusSeconds: number
}
export type LearnState = {
  sessions: Subject[]
  artifacts: Artifact[]
  decks: Deck[]
  cards: Card[]
  reviews: Review[]
  materials: Material[]
  focus: Focus
  focusLog: FocusLog[]
  focusSoundEnabled: boolean
  highlights: Highlight[]
  deckDrafts: DeckDraft[]
  quizAttempts: QuizAttempt[]
}
export const uid = () => crypto.randomUUID()
export const freshFocus = (
  mode: Focus['mode'] = 'focus',
  title = '',
  sessionId = '',
  focusMinutes = 25,
): Focus => ({
  id: uid(),
  title,
  sessionId,
  focusMinutes,
  remaining: (mode === 'focus' ? focusMinutes : 5) * 60,
  endsAt: null,
  startedAt: null,
  completedAt: null,
  mode,
})
export const dayKey = (at: number) => {
  const d = new Date(at)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** SM-2, version 1: six explicit quality grades; intervals use the previous ease. */
export function schedule(card: Card, quality: number, at: number): Card {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5)
    throw new Error('Quality must be between 0 and 5')
  const ease = Math.max(1.3, card.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  const repetitions = quality < 3 ? 0 : card.repetitions + 1
  const interval =
    quality < 3 || repetitions === 1
      ? 1
      : repetitions === 2
        ? 6
        : Math.ceil(card.interval * card.ease)
  const due = new Date(at)
  due.setDate(due.getDate() + interval)
  return { ...card, ease, repetitions, interval, dueAt: due.getTime() }
}

export function initialLearnState(): LearnState {
  const card = (id: string, deckId: string, topic: string, front: string, back: string): Card => ({
    id,
    deckId,
    topic,
    front,
    back,
    repetitions: 0,
    interval: 0,
    ease: 2.5,
    dueAt: Date.now(),
  })
  return {
    sessions: [
      {
        id: 'japanese',
        title: 'Japanese',
        description: 'Small steps toward everyday conversation.',
        topics: ['Everyday expressions', 'Vocabulary', 'Grammar'],
        symbol: 'あ',
      },
      {
        id: 'cognition',
        title: 'Cognitive psychology',
        description: 'How we pay attention, remember, and learn.',
        topics: ['Working memory', 'Attention', 'Research methods'],
        symbol: '◒',
      },
    ],
    decks: [
      {
        id: 'everyday',
        sessionId: 'japanese',
        title: 'Everyday Japanese',
        topic: 'Everyday expressions',
      },
      {
        id: 'memory',
        sessionId: 'cognition',
        title: 'Memory & attention',
        topic: 'Working memory',
      },
    ],
    cards: [
      card(
        'menu',
        'everyday',
        'Everyday expressions',
        'How would you ask for a menu?',
        'すみません、メニューをお願いします。\nSumimasen, menyū o onegaishimasu.\nExcuse me, the menu please.',
      ),
      card(
        'thanks',
        'everyday',
        'Vocabulary',
        'ありがとう',
        'Thank you.\nUse ありがとうございます for a more polite expression.',
      ),
      card(
        'loop',
        'memory',
        'Working memory',
        'What are the two components of the phonological loop?',
        'The phonological store and the articulatory rehearsal process.',
      ),
      card(
        'executive',
        'memory',
        'Working memory',
        'What is the role of the central executive?',
        'It directs attention and coordinates the working-memory subsystems. It has no storage capacity of its own.',
      ),
    ],
    artifacts: [
      {
        id: 'a1',
        sessionId: 'japanese',
        topic: 'Everyday expressions',
        body: 'お願いします is a useful pattern for polite requests. Try building a few restaurant phrases around it.',
        updatedAt: Date.now(),
      },
      {
        id: 'a2',
        sessionId: 'cognition',
        topic: 'Working memory',
        body: 'The central executive directs attention; the other components hold information. Think conductor, not storage.',
        updatedAt: Date.now(),
      },
    ],
    materials: [
      {
        id: 'm1',
        sessionId: 'japanese',
        kind: 'source',
        title: 'Irodori A2 · Unit 3',
        topic: 'Everyday expressions',
        content: 'Reference material for everyday conversations.',
        route: '/learn/library/src_irodori',
      },
      {
        id: 'm2',
        sessionId: 'cognition',
        kind: 'source',
        title: 'Baddeley (2000)',
        topic: 'Working memory',
        content: 'The episodic buffer: a new component of working memory.',
        route: '/learn/library/src_baddeley',
      },
      {
        id: 'm3',
        sessionId: 'cognition',
        kind: 'quiz',
        title: 'Check your understanding',
        topic: 'Working memory',
        content: 'Why was the episodic buffer added to the working-memory model?',
        answer:
          'To account for integrating information across working-memory subsystems and long-term memory into unified episodes.',
      },
      {
        id: 'm4',
        sessionId: 'cognition',
        kind: 'exam',
        title: 'Cognition module exam',
        topic: 'Working memory',
        content: 'Syllabus, practice runs, and your error log.',
        route: '/learn/exams/exam_cog',
      },
      {
        id: 'm5',
        sessionId: 'japanese',
        kind: 'exam',
        title: 'JLPT N5',
        topic: 'Vocabulary',
        content: 'Vocabulary, grammar, reading, and listening.',
        route: '/learn/exams/exam_jlpt',
      },
    ],
    highlights: [],
    deckDrafts: [],
    quizAttempts: [],
    reviews: [],
    focus: freshFocus(),
    focusLog: [],
    focusSoundEnabled: true,
  }
}

/** Complete an elapsed focus once, including after a reload or a throttled tab. */
export function completeFocus(current: LearnState, at: number): LearnState {
  const f = current.focus
  if (f.completedAt !== null || !f.endsAt || at < f.endsAt) return current
  const focusLog =
    f.mode === 'focus' && !current.focusLog.some((item) => item.id === f.id)
      ? [
          ...current.focusLog,
          {
            id: f.id,
            title: f.title,
            sessionId: f.sessionId,
            startedAt: f.startedAt!,
            completedAt: f.endsAt,
            durationMinutes: f.focusMinutes,
            focusSeconds: f.focusMinutes * 60,
          },
        ]
      : current.focusLog
  return {
    ...current,
    focusLog,
    focus: { ...f, remaining: 0, completedAt: f.endsAt, endsAt: null },
  }
}

/** Upgrade the original fixed-duration browser data without losing a running timer or history. */
export function restoreFocusSettings(state: LearnState): LearnState {
  return {
    ...state,
    focus: {
      ...state.focus,
      focusMinutes: state.focus.focusMinutes ?? 25,
      completedAt: state.focus.completedAt ?? null,
    },
    focusSoundEnabled: state.focusSoundEnabled ?? true,
    highlights: state.highlights ?? [],
    deckDrafts: state.deckDrafts ?? [],
    quizAttempts: state.quizAttempts ?? [],
    focusLog: state.focusLog.map((log) => ({
      ...log,
      focusSeconds: log.focusSeconds ?? log.durationMinutes * 60,
    })),
  }
}

export function validFocusMinutes(minutes: number): boolean {
  return Number.isSafeInteger(minutes) && minutes > 0 && minutes * 60_000 < 8_000_000_000_000_000
}

export function setFocusMinutes(focus: Focus, minutes: number): Focus {
  if (focus.startedAt !== null || !validFocusMinutes(minutes)) return focus
  return {
    ...focus,
    focusMinutes: minutes,
    remaining: focus.mode === 'focus' ? minutes * 60 : focus.remaining,
  }
}

/** Pauses retain sub-second precision so repeated pauses cannot inflate the audited duration. */
export function toggleFocus(current: LearnState, at: number): LearnState {
  const settled = completeFocus(current, at)
  if (settled !== current || settled.focus.completedAt !== null) return settled
  const focus = current.focus
  return {
    ...current,
    focus: focus.endsAt
      ? {
          ...focus,
          remaining: Math.max(0, (focus.endsAt - at) / 1000),
          endsAt: null,
        }
      : {
          ...focus,
          title: focus.title.trim(),
          startedAt: focus.startedAt ?? at,
          endsAt: at + focus.remaining * 1000,
        },
  }
}

/** A cached UI clock can precede Start/Resume; never display more than the saved remaining time. */
export function focusSecondsRemaining(focus: Focus, at: number): number {
  if (focus.completedAt !== null) return 0
  const seconds =
    focus.endsAt === null ? focus.remaining : Math.min(focus.remaining, (focus.endsAt - at) / 1000)
  return Math.max(0, Math.ceil(seconds))
}

/** Acknowledge completion (or abandon an unfinished run) without changing its audit timestamp. */
export function stopFocus(current: LearnState, at: number): LearnState {
  const settled = completeFocus(current, at)
  const f = settled.focus
  return {
    ...settled,
    focus: freshFocus('focus', f.title, f.sessionId, f.focusMinutes),
  }
}

export function emptyLearnState(): LearnState {
  return {
    ...initialLearnState(),
    sessions: [],
    artifacts: [],
    decks: [],
    cards: [],
    materials: [],
  }
}

/** Source offsets use UTF-16 code units, matching browser Range/text APIs. */
export function addHighlight(state: LearnState, highlight: Highlight): LearnState {
  const source = state.materials.find((m) => m.id === highlight.sourceId && m.kind === 'source')
  if (
    !source ||
    highlight.start < 0 ||
    highlight.end <= highlight.start ||
    source.content.slice(highlight.start, highlight.end) !== highlight.quote ||
    !highlight.quote.trim()
  )
    throw new Error('Select a passage within this source.')
  if (
    state.highlights.some(
      (h) =>
        h.sourceId === highlight.sourceId && h.start === highlight.start && h.end === highlight.end,
    )
  )
    return state
  return { ...state, highlights: [...state.highlights, highlight] }
}

export function artifactFromHighlight(
  state: LearnState,
  highlightId: string,
  id: string,
  at: number,
): LearnState {
  if (state.artifacts.some((a) => a.highlightId === highlightId)) return state
  const highlight = state.highlights.find((h) => h.id === highlightId)
  const source = state.materials.find((m) => m.id === highlight?.sourceId && m.kind === 'source')
  if (!highlight || !source) throw new Error('This source passage is unavailable.')
  return {
    ...state,
    artifacts: [
      {
        id,
        sessionId: source.sessionId,
        topic: source.topic,
        body: highlight.quote,
        highlightId,
        updatedAt: at,
      },
      ...state.artifacts,
    ],
  }
}

export function draftFromArtifacts(
  state: LearnState,
  ids: string[],
  id: string,
  at: number,
): DeckDraft {
  const artifacts = [...new Set(ids)].map((key) => state.artifacts.find((a) => a.id === key))
  if (!artifacts.length || artifacts.length > 200 || artifacts.some((a) => !a))
    throw new Error('Select between 1 and 200 available artifacts.')
  const first = artifacts[0]!
  return {
    id,
    sessionId: first.sessionId,
    title: `${first.topic} flashcards`,
    topic: first.topic,
    createdAt: at,
    updatedAt: at,
    cards: artifacts.map((a) => ({
      id: uid(),
      artifactId: a!.id,
      front: '',
      back: a!.body,
      topic: a!.topic,
    })),
  }
}

export function publishDeckDraft(state: LearnState, id: string, at: number): LearnState {
  const draft = state.deckDrafts.find((d) => d.id === id)
  if (!draft) throw new Error('Draft not found.')
  if (draft.publishedDeckId) return state
  if (
    !state.sessions.some((s) => s.id === draft.sessionId) ||
    !draft.title.trim() ||
    !draft.topic.trim() ||
    !draft.cards.length ||
    draft.cards.some((c) => !c.front.trim() || !c.back.trim())
  )
    throw new Error('Choose a session and fill in the title, topic, and both sides of every card.')
  // Stable IDs make repeated publication of the same draft harmless.
  const deckId = draft.id
  return {
    ...state,
    decks: [
      ...state.decks,
      {
        id: deckId,
        sessionId: draft.sessionId,
        title: draft.title.trim(),
        topic: draft.topic.trim(),
      },
    ],
    cards: [
      ...state.cards,
      ...draft.cards.map((c) => ({
        ...c,
        front: c.front.trim(),
        back: c.back.trim(),
        deckId,
        repetitions: 0,
        interval: 0,
        ease: 2.5,
        dueAt: at,
      })),
    ],
    deckDrafts: state.deckDrafts.map((d) =>
      d.id === id ? { ...d, publishedDeckId: deckId, updatedAt: at } : d,
    ),
  }
}

export function quizFromCards(
  state: LearnState,
  ids: string[],
  id: string,
  title: string,
): Material {
  const cards = [...new Set(ids)].map((key) => state.cards.find((c) => c.id === key))
  if (!title.trim() || !cards.length || cards.length > 200 || cards.some((c) => !c))
    throw new Error('Name the quiz and select at least one card.')
  const deck = state.decks.find((d) => d.id === cards[0]!.deckId)!
  if (cards.some((c) => state.decks.find((d) => d.id === c!.deckId)?.sessionId !== deck.sessionId))
    throw new Error('Choose cards from one session.')
  return {
    id,
    kind: 'quiz',
    sessionId: deck.sessionId,
    title: title.trim(),
    topic: deck.topic,
    content: `${cards.length} questions`,
    questions: cards.map((c) => ({
      id: uid(),
      cardId: c!.id,
      front: c!.front,
      back: c!.back,
    })),
  }
}
