export type ModuleConfig = { id: string; name: string; fundamental: string; priority: 'essential' | 'interested' | 'undecided' | 'derived'; enabled: boolean; requires: string[]; dependents: string[] }
export type ProviderConfig = { id: string; name: string; role: string; status: 'connected' | 'needs_setup' | 'error'; detail: string; disclosure?: 'allowed' | 'restricted' }
export type Preferences = { timeZone: string; locale: string; quietHours: { from: string; to: string }; rawAudioRetention: 'delete_after_transcription' | 'keep_on_save'; monthlyAiBudgetCents: number; aiSpentCents: number }
export type PairedDevice = { id: string; name: string; role: 'owner' | 'display'; lastSeen: string; scopes: string[] }
export type SettingsSnapshot = { preferences: Preferences; modules: ModuleConfig[]; providers: ProviderConfig[]; devices: PairedDevice[] }
