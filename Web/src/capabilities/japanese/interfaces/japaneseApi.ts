import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { LanguageProfile, SkillMode, SkillTarget, VocabCard } from './types'

/* Japanese HTTP adapter (mock): /api/v1/japanese/... Study owns prompts/attempts; this owns curriculum and skill interpretation. */

let profile: LanguageProfile = { purpose: 'Take part in conversation with Yuki’s family in spring', startingLevel: 'A1 → A2', speechProvider: 'ready', microphone: 'prompt' }

let targets: SkillTarget[] = [
  { id: 'skill_intro', title: 'Introduce yourself', purpose: 'First evening at Yuki’s parents’ house', level: 'A2', modes: ['speaking', 'listening'], evidence: [{ attemptId: 'att_j1', mode: 'speaking', assistance: 'independent', outcome: 'met', at: minutesAgo(3000) }, { attemptId: 'att_j2', mode: 'speaking', assistance: 'hint', outcome: 'met', at: minutesAgo(8000) }, { attemptId: 'att_j3', mode: 'listening', assistance: 'reference', outcome: 'partial', at: minutesAgo(12000) }], assessment: { level: 'A2 · evidence from 2 independent attempts', note: 'Self-introduction is stable. Listening to follow-up questions still relied on the reference.', basis: 'Reference dialogue Irodori A1 U1; hint used once', at: minutesAgo(3000) }, lessonRefs: [{ title: 'Irodori A1 — Unit 1', locator: 'dialogue 1', route: '/learn/library/src_irodori' }], vocabularyRecall: 0.86 },
  { id: 'skill_menu', title: 'Order at a restaurant from a real menu', purpose: 'Dinner out without being translated for', level: 'A2', modes: ['reading', 'speaking'], evidence: [{ attemptId: 'att_j4', mode: 'reading', assistance: 'reference', outcome: 'partial', at: minutesAgo(9000) }], lessonRefs: [{ title: 'Irodori A2 — Unit 3', locator: 'dialogue 2', route: '/learn/library/src_irodori' }], vocabularyRecall: 0.62 },
  { id: 'skill_plans', title: 'Follow a short exchange about plans', purpose: 'Understand “what shall we do tomorrow?” at the table', level: 'A2', modes: ['listening', 'writing'], evidence: [], lessonRefs: [], vocabularyRecall: 0.3 },
]

const vocab: VocabCard[] = [
  { id: 'v1', word: '木漏れ日', reading: 'こもれび', meaning: 'sunlight filtering through leaves', example: '木漏れ日がきれいですね。' },
  { id: 'v2', word: 'お願いします', reading: 'おねがいします', meaning: 'please (requesting)', example: 'メニューをお願いします。' },
  { id: 'v3', word: 'お会計', reading: 'おかいけい', meaning: 'the bill', example: 'お会計をお願いします。' },
  { id: 'v4', word: '明日', reading: 'あした', meaning: 'tomorrow', example: '明日は何をしますか。' },
]

export async function getProfile(): Promise<Snapshot<LanguageProfile>> {
  await wait(120)
  return snapshot(profile)
}

export async function listSkillTargets(): Promise<Snapshot<SkillTarget[]>> {
  await wait()
  return snapshot(targets)
}

export async function setSkillTarget(title: string, purpose: string, modes: SkillMode[]): Promise<Operation<SkillTarget>> {
  await wait(260)
  if (!title.trim()) return failedOperation('validation', false, 'Describe the practical target.')
  const target: SkillTarget = { id: newId('skill'), title, purpose, level: profile.startingLevel.split('→').pop()?.trim() ?? 'A2', modes, evidence: [], lessonRefs: [], vocabularyRecall: 0 }
  targets = [...targets, target]
  return completed(target)
}

export async function startPractice(targetId: string, mode: SkillMode): Promise<Operation<{ sessionId: string; mode: SkillMode }>> {
  await wait(400)
  const target = targets.find((item) => item.id === targetId)
  if (!target) return failedOperation('not_found', false)
  if (target.lessonRefs.length === 0) return failedOperation('no_curriculum', false, 'No trusted lesson material is linked for this target. Link a source first; nothing is invented.')
  if (mode === 'speaking' && profile.microphone === 'denied') return failedOperation('microphone_denied', false, 'Microphone denied. Text and reference practice remain available.')
  return completed({ sessionId: newId('ses'), mode })
}

export async function dailyVocabulary(): Promise<VocabCard[]> {
  await wait(120)
  return vocab
}

export async function updateProfile(patch: Partial<LanguageProfile>): Promise<Operation<LanguageProfile>> {
  await wait(160)
  profile = { ...profile, ...patch }
  return completed(profile)
}

export function stamp() {
  return nowIso()
}
