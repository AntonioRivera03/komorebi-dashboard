import { routes } from '../shared/lib/routes'

export type NavEntry = { label: string; to: string; description: string; priority?: 'essential' | 'interested' | 'undecided' }
export type NavGroup = { id: string; label: string; to: string; entries: NavEntry[] }

/** Navigation mirrors the route groups in the spec's frontend organisation table. */
export const navigation: NavGroup[] = [
  { id: 'today', label: 'Today', to: routes.today, entries: [{ label: 'Today', to: routes.today, description: 'A bounded view of what matters now' }] },
  {
    id: 'plan',
    label: 'Plan',
    to: routes.capture,
    entries: [
      { label: 'Capture', to: routes.capture, description: 'One inbox for text, links and files', priority: 'essential' },
      { label: 'Goals', to: routes.goals, description: 'Outcomes, milestones and next actions', priority: 'essential' },
      { label: 'Tasks', to: routes.tasks, description: 'Open work, recurrence and history', priority: 'essential' },
      { label: 'Calendar', to: routes.calendar, description: 'Provider events beside internal blocks', priority: 'essential' },
      { label: 'Plan the day', to: routes.plan, description: 'Fit work to available time and energy', priority: 'undecided' },
    ],
  },
  {
    id: 'learn',
    label: 'Learn',
    to: routes.learn,
    entries: [
      { label: 'Home', to: routes.learn, description: 'A card, a little focus, a place to begin' },
      { label: 'Sessions', to: routes.sessions, description: 'Your subjects and everything you learn within them' },
      { label: 'Artifacts', to: routes.artifacts, description: 'Quick thoughts gathered by topic' },
      { label: 'Review', to: routes.review, description: 'Flashcard decks and your review history' },
    ],
  },
  {
    id: 'home',
    label: 'Home',
    to: routes.home,
    entries: [
      { label: 'Rooms', to: routes.home, description: 'Devices and honest reported state', priority: 'essential' },
      { label: 'Scenes', to: routes.scenes, description: 'Named room scenes with per-device results', priority: 'essential' },
      { label: 'Alerts', to: routes.alerts, description: 'Only the exceptions worth attention', priority: 'essential' },
    ],
  },
  {
    id: 'life',
    label: 'Life',
    to: routes.household,
    entries: [
      { label: 'Household', to: routes.household, description: 'Shopping, chores and renewals', priority: 'essential' },
      { label: 'Finance', to: routes.finance, description: 'Bills, subscriptions and savings', priority: 'interested' },
      { label: 'Training', to: routes.training, description: 'Running plan and honest logs', priority: 'undecided' },
      { label: 'Habits', to: routes.habits, description: 'Cues, routines and fallback actions', priority: 'undecided' },
      { label: 'Weekly review', to: routes.reflection, description: 'Perspective on the week', priority: 'undecided' },
      { label: 'People', to: routes.people, description: 'Dates, reminders and experiences', priority: 'undecided' },
    ],
  },
  {
    id: 'assist',
    label: 'Assist',
    to: routes.briefing,
    entries: [
      { label: 'Briefing', to: routes.briefing, description: 'A sourced digest with an attention budget', priority: 'essential' },
      { label: 'Assistant', to: routes.assistant, description: 'Ask questions and preview actions', priority: 'essential' },
      { label: 'Voice', to: routes.voice, description: 'Push-to-talk requests', priority: 'essential' },
      { label: 'Automations', to: routes.automations, description: 'Explicit event-and-condition rules', priority: 'undecided' },
    ],
  },
  {
    id: 'history',
    label: 'History',
    to: routes.conversations,
    entries: [
      { label: 'Conversations', to: routes.conversations, description: 'Durable threads across features', priority: 'essential' },
      { label: 'Memory', to: routes.memory, description: 'What the app remembers, and why', priority: 'essential' },
      { label: 'Usage', to: routes.usage, description: 'Which workflows succeed or stall', priority: 'essential' },
      { label: 'Improvements', to: routes.improvements, description: 'Evidence-backed change candidates', priority: 'essential' },
    ],
  },
]

export function groupForPath(pathname: string): NavGroup | undefined {
  return navigation.find((group) => group.entries.some((entry) => pathname === entry.to || pathname.startsWith(`${entry.to}/`)))
}
