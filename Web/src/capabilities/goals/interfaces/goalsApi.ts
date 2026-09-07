import { completed, daysFromNow, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { BreakdownSuggestion, Goal, GoalDraft, GoalStatus } from './types'

/* Goals HTTP adapter (mock): /api/v1/goals/... */

let goals: Goal[] = [
  {
    id: 'goal_1',
    title: 'Pass the cognition exam',
    purpose: 'Finish the module without a resit and understand memory models well enough to teach them.',
    outcome: 'Exam passed on 14 September; can explain WM, LTM and attention models from memory.',
    targetDate: daysFromNow(9),
    status: 'active',
    actionState: 'next_action_selected',
    evidenceDefinition: 'Official grade plus a self-recorded explanation of each model without notes.',
    milestones: [
      { id: 'ms_1', title: 'All syllabus topics have at least one approved prompt', order: 1, done: true },
      { id: 'ms_2', title: 'Two timed practice sets with reviewed marking', order: 2, targetDate: daysFromNow(4), done: false },
      { id: 'ms_3', title: 'Error log repaired for memory and attention', order: 3, targetDate: daysFromNow(7), done: false },
      { id: 'ms_4', title: 'Sit the exam', order: 4, targetDate: daysFromNow(9), done: false },
    ],
    actions: [
      { id: 'la_1', taskRef: { owner: 'tasks', kind: 'task', id: 'tsk_1', revision: 3 }, title: 'Outline chapter 4 recall prompts', status: 'open', isNext: true, observedAt: minutesAgo(2) },
      { id: 'la_2', taskRef: { owner: 'tasks', kind: 'task', id: 'tsk_9' }, title: 'Read: Attention and working memory (pp. 41–58)', status: 'open', isNext: false, observedAt: minutesAgo(2) },
      { id: 'la_3', taskRef: { owner: 'tasks', kind: 'task', id: 'tsk_old' }, title: 'Summarise lecture 2', status: 'unavailable', isNext: false, observedAt: minutesAgo(8000) },
    ],
    evidence: [
      { id: 'ev_1', resource: { owner: 'exams', kind: 'practice_assessment', id: 'pa_1', revision: 1 }, label: 'Practice set 1 · 64% reviewed', note: 'Automatically collected from Exams; not a final score.', kind: 'automatic', refreshedAt: minutesAgo(1600), available: true },
      { id: 'ev_2', resource: { owner: 'study', kind: 'checkpoint', id: 'chk_deleted' }, label: 'Checkpoint (removed)', note: 'Source checkpoint was deleted; the link remains as a marker.', kind: 'automatic', refreshedAt: minutesAgo(9000), available: false },
    ],
    revision: 7,
    updatedAt: minutesAgo(30),
  },
  {
    id: 'goal_2',
    title: 'Hold a five-minute conversation in Japanese',
    purpose: 'Visit Yuki’s family in spring and be able to take part rather than be translated for.',
    outcome: 'Introduce myself, order food and follow a short exchange without switching to English.',
    status: 'active',
    actionState: 'next_action_selected',
    evidenceDefinition: 'Three recorded exchanges assessed at the target level, with assistance level recorded.',
    milestones: [
      { id: 'ms_5', title: 'Self-introduction without notes', order: 1, done: true },
      { id: 'ms_6', title: 'Order at a restaurant from a real menu', order: 2, done: false },
      { id: 'ms_7', title: 'Follow a short exchange about plans', order: 3, done: false },
    ],
    actions: [{ id: 'la_4', taskRef: { owner: 'tasks', kind: 'task', id: 'tsk_6' }, title: 'Practise self-introduction (Japanese)', status: 'open', isNext: true, observedAt: minutesAgo(4) }],
    evidence: [{ id: 'ev_3', resource: { owner: 'japanese', kind: 'skill_assessment', id: 'sa_intro' }, label: 'Skill: self-introduction · evidence at A2', note: 'Assessed with reference dialogue; hint used once.', kind: 'automatic', refreshedAt: minutesAgo(3000), available: true }],
    revision: 4,
    updatedAt: minutesAgo(3000),
  },
  {
    id: 'goal_3',
    title: 'Run a 10K comfortably',
    purpose: 'Have a reason to be outside three times a week.',
    outcome: 'A 10K at conversational pace before the end of November.',
    status: 'paused',
    actionState: 'paused',
    evidenceDefinition: 'A logged 10K run at or below target effort.',
    milestones: [{ id: 'ms_8', title: 'Baseline 5K logged', order: 1, done: true }],
    actions: [],
    evidence: [],
    revision: 2,
    updatedAt: minutesAgo(20000),
  },
  {
    id: 'goal_4',
    title: 'Understand how komorebi light actually works',
    purpose: 'Curiosity. No deadline.',
    outcome: 'Can explain pinhole projection and why leaf gaps make crescent shapes during an eclipse.',
    status: 'active',
    actionState: 'no_next_action',
    evidenceDefinition: 'A note in my own words with a diagram.',
    milestones: [],
    actions: [],
    evidence: [],
    revision: 1,
    updatedAt: minutesAgo(50000),
  },
]

export async function listGoals(): Promise<Snapshot<Goal[]>> {
  await wait()
  return snapshot(goals)
}

export async function getGoal(id: string): Promise<Snapshot<Goal> | null> {
  await wait(180)
  const goal = goals.find((item) => item.id === id)
  return goal ? snapshot(goal) : null
}

function replace(goal: Goal) {
  goals = goals.map((item) => (item.id === goal.id ? { ...goal, revision: goal.revision + 1, updatedAt: nowIso() } : item))
  return goals.find((item) => item.id === goal.id) as Goal
}

export async function createGoal(draft: GoalDraft): Promise<Operation<Goal>> {
  await wait(280)
  if (!draft.title.trim()) return failedOperation('validation', false, 'A goal needs a title.')
  const goal: Goal = { id: newId('goal'), ...draft, status: 'active', actionState: 'no_next_action', milestones: [], actions: [], evidence: [], revision: 1, updatedAt: nowIso() }
  goals = [goal, ...goals]
  return completed(goal)
}

export async function addMilestone(goalId: string, title: string, targetDate?: string): Promise<Operation<Goal>> {
  await wait(200)
  const goal = goals.find((item) => item.id === goalId)
  if (!goal) return failedOperation('not_found', false)
  return completed(replace({ ...goal, milestones: [...goal.milestones, { id: newId('ms'), title, order: goal.milestones.length + 1, targetDate, done: false }] }))
}

export async function toggleMilestone(goalId: string, milestoneId: string): Promise<Operation<Goal>> {
  await wait(160)
  const goal = goals.find((item) => item.id === goalId)
  if (!goal) return failedOperation('not_found', false)
  return completed(replace({ ...goal, milestones: goal.milestones.map((item) => (item.id === milestoneId ? { ...item, done: !item.done } : item)) }))
}

export async function setNextAction(goalId: string, actionId: string): Promise<Operation<Goal>> {
  await wait(160)
  const goal = goals.find((item) => item.id === goalId)
  if (!goal) return failedOperation('not_found', false)
  return completed(replace({ ...goal, actionState: 'next_action_selected', actions: goal.actions.map((item) => ({ ...item, isNext: item.id === actionId })) }))
}

export async function setGoalStatus(goalId: string, status: GoalStatus): Promise<Operation<Goal>> {
  await wait(200)
  const goal = goals.find((item) => item.id === goalId)
  if (!goal) return failedOperation('not_found', false)
  return completed(replace({ ...goal, status, actionState: status === 'paused' ? 'paused' : status === 'achieved' ? 'completed' : goal.actions.some((a) => a.isNext) ? 'next_action_selected' : 'no_next_action', achievedDeclaredAt: status === 'achieved' ? nowIso() : goal.achievedDeclaredAt }))
}

export async function linkTaskDraft(goalId: string, title: string): Promise<Operation<Goal>> {
  await wait(420)
  const goal = goals.find((item) => item.id === goalId)
  if (!goal) return failedOperation('not_found', false)
  // Tasks.createTask is issued by the server; we only receive the returned reference.
  const taskId = newId('tsk')
  return completed(replace({ ...goal, actions: [...goal.actions, { id: newId('la'), taskRef: { owner: 'tasks', kind: 'task', id: taskId, revision: 1 }, title, status: 'open', isNext: goal.actions.length === 0, observedAt: nowIso() }], actionState: goal.actions.length === 0 ? 'next_action_selected' : goal.actionState }))
}

export async function requestBreakdown(goalId: string): Promise<BreakdownSuggestion[]> {
  await wait(1400)
  const goal = goals.find((item) => item.id === goalId)
  if (!goal) return []
  if (goal.id === 'goal_4') {
    return [
      { id: newId('sg'), kind: 'milestone', title: 'Reproduce pinhole projection with a card and a lamp', rationale: 'A physical check before reading theory; matches how you learned the thermostat dial.' },
      { id: newId('sg'), kind: 'task', title: 'Read “Camera obscura” entry and note the geometry (20 min)', rationale: 'Short, undated; this goal is exploration so nothing becomes overdue.' },
      { id: newId('sg'), kind: 'task', title: 'Sketch why gaps between leaves act as many pinholes', rationale: 'Your evidence definition asks for a diagram.' },
    ]
  }
  return [
    { id: newId('sg'), kind: 'milestone', title: 'Rubric reviewed for every practice set', rationale: 'Your practice results are only useful once reviewed marking exists (Exams L05).' },
    { id: newId('sg'), kind: 'task', title: 'Draft 4 methods prompts from lecture 6 (30 min)', rationale: 'Methods has the lowest coverage in the blueprint.' },
    { id: newId('sg'), kind: 'task', title: 'Schedule practice set 2 (timed, 40 min)', rationale: 'Milestone 2 has a target in 4 days and no block yet.' },
  ]
}
