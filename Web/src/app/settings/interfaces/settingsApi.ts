import { completed, failedOperation, minutesAgo, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { ModuleConfig, PairedDevice, Preferences, SettingsSnapshot } from './types'

/* Core configuration (K02) HTTP adapter (mock): /api/v1/settings/... */

let preferences: Preferences = { timeZone: 'Europe/Madrid', locale: 'en-GB', quietHours: { from: '22:30', to: '07:30' }, rawAudioRetention: 'delete_after_transcription', monthlyAiBudgetCents: 2000, aiSpentCents: 760 }

let modules: ModuleConfig[] = [
  { id: 'capture', name: 'Capture', fundamental: 'F1', priority: 'essential', enabled: true, requires: ['tasks', 'knowledge'], dependents: ['voice'] },
  { id: 'goals', name: 'Goals', fundamental: 'F1', priority: 'essential', enabled: true, requires: ['tasks'], dependents: [] },
  { id: 'tasks', name: 'Tasks', fundamental: 'F1', priority: 'derived', enabled: true, requires: [], dependents: ['capture', 'goals', 'calendar', 'household'] },
  { id: 'calendar', name: 'Calendar', fundamental: 'F1', priority: 'essential', enabled: true, requires: ['tasks'], dependents: ['capacity'] },
  { id: 'capacity', name: 'Capacity', fundamental: 'F1', priority: 'undecided', enabled: false, requires: ['tasks', 'calendar'], dependents: [] },
  { id: 'knowledge', name: 'Knowledge', fundamental: 'F2', priority: 'essential', enabled: true, requires: [], dependents: ['study', 'connections', 'capture'] },
  { id: 'study', name: 'Study', fundamental: 'F2', priority: 'essential', enabled: true, requires: ['knowledge'], dependents: ['reviews', 'exams', 'japanese'] },
  { id: 'reviews', name: 'Reviews', fundamental: 'F2', priority: 'interested', enabled: true, requires: ['study'], dependents: [] },
  { id: 'exams', name: 'Exams', fundamental: 'F2', priority: 'essential', enabled: true, requires: ['study'], dependents: [] },
  { id: 'japanese', name: 'Japanese', fundamental: 'F2', priority: 'essential', enabled: true, requires: ['study'], dependents: [] },
  { id: 'connections', name: 'Connections', fundamental: 'F2', priority: 'essential', enabled: true, requires: ['knowledge'], dependents: [] },
  { id: 'home', name: 'Home', fundamental: 'F3', priority: 'essential', enabled: true, requires: [], dependents: ['home-alerts', 'automation'] },
  { id: 'home-alerts', name: 'Home Alerts', fundamental: 'F3', priority: 'essential', enabled: true, requires: ['home'], dependents: [] },
  { id: 'training', name: 'Training', fundamental: 'F4', priority: 'undecided', enabled: false, requires: [], dependents: [] },
  { id: 'habits', name: 'Habits', fundamental: 'F4', priority: 'undecided', enabled: false, requires: [], dependents: [] },
  { id: 'reflection', name: 'Reflection', fundamental: 'F4', priority: 'undecided', enabled: false, requires: [], dependents: [] },
  { id: 'relationships', name: 'Relationships', fundamental: 'F4', priority: 'undecided', enabled: false, requires: [], dependents: [] },
  { id: 'household', name: 'Household', fundamental: 'F4', priority: 'essential', enabled: true, requires: ['tasks'], dependents: [] },
  { id: 'finance', name: 'Finance', fundamental: 'F4', priority: 'interested', enabled: true, requires: [], dependents: [] },
  { id: 'today', name: 'Today', fundamental: 'F5', priority: 'essential', enabled: true, requires: [], dependents: [] },
  { id: 'briefings', name: 'Briefings', fundamental: 'F5', priority: 'essential', enabled: true, requires: [], dependents: [] },
  { id: 'assistant', name: 'Assistant', fundamental: 'F5', priority: 'essential', enabled: true, requires: ['conversations', 'memory'], dependents: [] },
  { id: 'voice', name: 'Voice', fundamental: 'F5', priority: 'essential', enabled: true, requires: ['capture', 'home'], dependents: [] },
  { id: 'automation', name: 'Automation', fundamental: 'F5', priority: 'undecided', enabled: false, requires: ['home'], dependents: [] },
  { id: 'usage', name: 'Usage', fundamental: 'F6', priority: 'essential', enabled: true, requires: [], dependents: ['memory', 'evolution'] },
  { id: 'conversations', name: 'Conversations', fundamental: 'F6', priority: 'essential', enabled: true, requires: [], dependents: ['assistant', 'memory'] },
  { id: 'memory', name: 'Memory', fundamental: 'F6', priority: 'essential', enabled: true, requires: ['conversations', 'usage'], dependents: ['assistant', 'evolution'] },
  { id: 'evolution', name: 'Evolution', fundamental: 'F6', priority: 'essential', enabled: true, requires: ['usage', 'memory'], dependents: [] },
]

const providers: SettingsSnapshot['providers'] = [
  { id: 'ai', name: 'AI provider · Anthropic', role: 'K05 AI gateway', status: 'connected', detail: 'claude-fable-5-1 · per-request and monthly ceilings enforced', disclosure: 'allowed' },
  { id: 'speech', name: 'Speech transcription', role: 'policy-controlled adapter', status: 'connected', detail: 'Audio deleted after transcription unless saved', disclosure: 'restricted' },
  { id: 'ha', name: 'Home Assistant', role: 'Home adapter', status: 'connected', detail: 'homeassistant.local · 10 permitted entities' },
  { id: 'cal', name: 'CalDAV calendar', role: 'Calendar adapter', status: 'connected', detail: 'read-only · writes await review decision' },
  { id: 'weather', name: 'Open-Meteo', role: 'Briefings weather source', status: 'connected', detail: 'no API key required' },
  { id: 'embeddings', name: 'Embedding provider', role: 'Memory / Knowledge retrieval', status: 'needs_setup', detail: 'Select vector storage during the memory slice' },
]

let devices: PairedDevice[] = [
  { id: 'dev_laptop', name: 'This browser', role: 'owner', lastSeen: minutesAgo(0), scopes: ['*'] },
  { id: 'dev_hall', name: 'Hallway display', role: 'display', lastSeen: minutesAgo(12), scopes: ['calendar:summary', 'home:scenes', 'today:display'] },
]

export async function getSettings(): Promise<Snapshot<SettingsSnapshot>> {
  await wait()
  return snapshot({ preferences, modules, providers, devices })
}

export async function updatePreferences(patch: Partial<Preferences>): Promise<Operation<Preferences>> {
  await wait(200)
  preferences = { ...preferences, ...patch }
  return completed(preferences)
}

export async function setModuleEnabled(id: string, enabled: boolean): Promise<Operation<ModuleConfig[]>> {
  await wait(300)
  const module = modules.find((item) => item.id === id)
  if (!module) return failedOperation('not_found', false)
  if (!enabled) {
    const activeDependents = module.dependents.filter((dep) => modules.find((item) => item.id === dep)?.enabled)
    if (activeDependents.length) return failedOperation('dependents_enabled', false, `Disable ${activeDependents.join(', ')} first; they depend on ${module.name}.`)
  } else {
    const missing = module.requires.filter((req) => !modules.find((item) => item.id === req)?.enabled)
    if (missing.length) return failedOperation('requirements_disabled', false, `${module.name} needs ${missing.join(', ')} enabled.`)
  }
  modules = modules.map((item) => (item.id === id ? { ...item, enabled } : item))
  return completed(modules)
}

export async function revokeDevice(id: string): Promise<Operation<PairedDevice[]>> {
  await wait(220)
  devices = devices.filter((item) => item.id !== id)
  return completed(devices)
}
