import { PageHeader } from '../../shared/ui/PageHeader'
import { AsyncPanel } from '../../shared/ui/AsyncPanel'
import { Panel } from '../../shared/ui/Panel'
import { PanelHead } from '../../shared/ui/PanelHead'
import { Field } from '../../shared/ui/Field'
import { Select } from '../../shared/ui/Select'
import { TextInput } from '../../shared/ui/TextInput'
import { ProgressBar } from '../../shared/ui/ProgressBar'
import { SegmentedControl } from '../../shared/ui/SegmentedControl'
import { Notice } from '../../shared/ui/Notice'
import { useToast } from '../../shared/ui/useToast'
import { useTheme } from '../providers/useTheme'
import { useSettings } from './interfaces/useSettings'
import { revokeDevice, setModuleEnabled, updatePreferences } from './interfaces/settingsApi'
import { DeviceRow } from './components/DeviceRow'
import { ModuleToggleRow } from './components/ModuleToggleRow'
import { ProviderRow } from './components/ProviderRow'
import styles from './settings.module.css'

export default function SettingsPage() {
  const settings = useSettings()
  const toast = useToast()
  const { theme, setTheme } = useTheme()
  return (
    <div className="k-page">
      <PageHeader eyebrow="Core · K01 · K02 · K05" title="Settings" subtitle="Preferences, enabled modules, providers and paired devices. Assembled by the shell from core configuration." />
      <AsyncPanel query={settings} skeletonLines={10}>
        {({ data }) => (
          <div className="k-grid k-grid--2">
            <div>
              <Panel flush>
                <PanelHead title="Preferences" eyebrow="K02" />
                <div className="k-form">
                  <Field label="Theme">
                    <SegmentedControl label="Theme" value={theme} onChange={setTheme} options={[{ value: 'light', label: 'Light · paper and olive' }, { value: 'dark', label: 'Dark · charcoal and moss' }]} />
                  </Field>
                  <div className="k-form-row">
                    <Field label="Time zone">
                      <TextInput mono value={data.preferences.timeZone} onChange={(event) => updatePreferences({ timeZone: event.target.value })} />
                    </Field>
                    <Field label="Locale">
                      <TextInput mono value={data.preferences.locale} onChange={(event) => updatePreferences({ locale: event.target.value })} />
                    </Field>
                  </div>
                  <div className="k-form-row">
                    <Field label="Quiet hours from">
                      <TextInput type="time" value={data.preferences.quietHours.from} onChange={(event) => updatePreferences({ quietHours: { ...data.preferences.quietHours, from: event.target.value } })} />
                    </Field>
                    <Field label="Quiet hours to">
                      <TextInput type="time" value={data.preferences.quietHours.to} onChange={(event) => updatePreferences({ quietHours: { ...data.preferences.quietHours, to: event.target.value } })} />
                    </Field>
                  </div>
                  <Field label="Raw voice audio">
                    <Select value={data.preferences.rawAudioRetention} onChange={(event) => updatePreferences({ rawAudioRetention: event.target.value as typeof data.preferences.rawAudioRetention })} options={[{ value: 'delete_after_transcription', label: 'Delete after transcription (default)' }, { value: 'keep_on_save', label: 'Keep only when explicitly saved' }]} />
                  </Field>
                  <div className={styles.budget}>
                    <span className="label">Monthly AI budget</span>
                    <strong>
                      €{(data.preferences.aiSpentCents / 100).toFixed(2)} <span className="muted" style={{ fontSize: 14 }}>of €{(data.preferences.monthlyAiBudgetCents / 100).toFixed(0)}</span>
                    </strong>
                    <ProgressBar value={data.preferences.aiSpentCents} max={data.preferences.monthlyAiBudgetCents} label="AI budget" captionLeft="reservations released when unused" captionRight="estimated vs provider-reported recorded" />
                    <input type="range" min={500} max={10000} step={100} value={data.preferences.monthlyAiBudgetCents} onChange={(event) => settings.mutate((current) => ({ ...current, preferences: { ...current.preferences, monthlyAiBudgetCents: Number(event.target.value) } }))} onMouseUp={() => updatePreferences({ monthlyAiBudgetCents: data.preferences.monthlyAiBudgetCents })} aria-label="Monthly AI budget" />
                  </div>
                </div>
              </Panel>
              <Panel>
                <PanelHead title="Providers" eyebrow="Credentials stay server-side" />
                {data.providers.map((provider) => (
                  <ProviderRow key={provider.id} provider={provider} />
                ))}
              </Panel>
              <Panel>
                <PanelHead title="Sessions and paired devices" eyebrow="K01 · owner and display roles" />
                {data.devices.map((device) => (
                  <DeviceRow
                    key={device.id}
                    device={device}
                    onRevoke={async (item) => {
                      const result = await revokeDevice(item.id)
                      if (result.status === 'completed') {
                        settings.mutate((current) => ({ ...current, devices: result.value }))
                        toast(`Revoked ${item.name}`)
                      }
                    }}
                  />
                ))}
              </Panel>
            </div>
            <div>
              <Panel flush>
                <PanelHead title="Modules" eyebrow="Disable keeps data, hides routes, stops new work" />
                {data.modules.map((module) => (
                  <ModuleToggleRow
                    key={module.id}
                    module={module}
                    onToggle={async (item, enabled) => {
                      const result = await setModuleEnabled(item.id, enabled)
                      if (result.status === 'completed') {
                        settings.mutate((current) => ({ ...current, modules: result.value }))
                        toast(`${item.name} ${enabled ? 'enabled' : 'disabled'} · pending jobs ${enabled ? 'reconciled before replay' : 'paused deliberately'}`)
                      } else if (result.status === 'failed') toast(result.message ?? 'Cannot change', { tone: 'warn' })
                    }}
                  />
                ))}
                <div style={{ marginTop: 16 }}>
                  <Notice glyph="⛨">Disabling a required provider first reports its dependent modules and requires them to be disabled together. Optional consumers degrade independently.</Notice>
                </div>
              </Panel>
            </div>
          </div>
        )}
      </AsyncPanel>
    </div>
  )
}
