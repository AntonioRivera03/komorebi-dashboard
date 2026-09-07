import { useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { Dialog } from '../../shared/ui/Dialog'
import { TextInput } from '../../shared/ui/TextInput'
import { Field } from '../../shared/ui/Field'
import { useLearn } from './useLearn'
import styles from './learn.module.css'

export function LearnStoragePanel() {
  const { state, connection, storageError } = useLearn()
  const [open, setOpen] = useState(false)
  const [ticket, setTicket] = useState('')
  if (!connection) return <p className={styles.preview}>Preview · saved in this browser.</p>
  const server = connection.mode === 'server'
  return (
    <section className={styles.section}>
      <div className={styles.meta}>
        <span role="status">
          {server
            ? connection.phase === 'saving'
              ? 'Saving learning…'
              : connection.dirty
                ? 'Learning has unsaved changes'
                : `Saved to server · ${connection.displayName}`
            : 'Preview · saved in this browser.'}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          {server ? 'Storage & account' : 'Connect learning'}
        </Button>
      </div>
      {connection.message && (
        <p role="alert" className="muted small">
          {connection.message}
        </p>
      )}
      {storageError && (
        <p role="alert">
          Browser storage is unavailable. Keep this page open or export your learning.
        </p>
      )}
      <Dialog
        open={open}
        title={server ? 'Learning storage' : 'Connect learning'}
        onClose={() => setOpen(false)}
      >
        <div className={styles.form}>
          {server ? (
            <>
              <p>
                Signed in as {connection.displayName}. Sessions, sources, highlights, Artifacts,
                drafts, decks and practice history save to your server. The running timer stays on
                this device.
              </p>
              <div className={styles.meta}>
                {connection.phase === 'error' && !connection.conflict && (
                  <Button onClick={connection.retry}>Retry save</Button>
                )}
                <Button
                  disabled={connection.phase === 'saving' || connection.phase === 'connecting'}
                  onClick={() => void connection.reload()}
                >
                  Reload server copy
                </Button>
                {!state.sessions.length && (
                  <Button disabled={connection.dirty} onClick={connection.importLocal}>
                    Import this browser’s learning
                  </Button>
                )}
                <Button
                  disabled={
                    connection.dirty ||
                    connection.phase === 'saving' ||
                    connection.phase === 'connecting'
                  }
                  onClick={() => void connection.disconnect()}
                >
                  Sign out
                </Button>
              </div>
              {connection.phase === 'error' && (
                <form
                  className={styles.form}
                  onSubmit={(e) => {
                    e.preventDefault()
                    void connection.connect(ticket).then(() => setTicket(''))
                  }}
                >
                  <Field
                    label="New sign-in ticket (if your session expired)"
                    htmlFor="learn-reauth"
                  >
                    <TextInput
                      id="learn-reauth"
                      type="password"
                      autoComplete="off"
                      required
                      value={ticket}
                      onChange={(e) => setTicket(e.target.value)}
                    />
                  </Field>
                  <Button type="submit">Sign in again & retry</Button>
                </form>
              )}
              {connection.dirty && (
                <p className="muted small">
                  Keep this tab open until saved. Export your unsaved copy before reloading to
                  resolve a conflict.
                </p>
              )}
            </>
          ) : (
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault()
                void connection.connect(ticket).then(() => setTicket(''))
              }}
            >
              <p>
                Connect to your running Komorebi server. Your browser’s preview stays separate; you
                can import it into an empty account after connecting.
              </p>
              <Field label="One-use sign-in ticket" htmlFor="learn-ticket">
                <TextInput
                  id="learn-ticket"
                  type="password"
                  autoComplete="off"
                  required
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value)}
                />
              </Field>
              <Button type="submit" variant="primary" disabled={connection.phase === 'connecting'}>
                Sign in
              </Button>
              <Button
                disabled={connection.phase === 'connecting'}
                onClick={() => void connection.connect()}
              >
                Use existing server session
              </Button>
            </form>
          )}
          <Button onClick={connection.exportCopy}>Export learning copy</Button>
          {connection.message && <p role="alert">{connection.message}</p>}
        </div>
      </Dialog>
    </section>
  )
}
