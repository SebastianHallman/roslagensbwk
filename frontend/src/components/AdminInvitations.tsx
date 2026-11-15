import { useState } from 'react'
import type { FormEvent } from 'react'
import { createAdminInvitation } from '../api/api.js'

type Props = {
  disabled: boolean
  onSessionExpired: () => void
}

function AdminInvitations({ disabled, onSessionExpired }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<{ email: string } | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || disabled) return
    const form = event.currentTarget
    const email = String(new FormData(form).get('email')).trim()
    setBusy(true)
    setError('')
    setInvitation(null)
    try {
      await createAdminInvitation(email)
      setInvitation({ email })
      form.reset()
    } catch (failure) {
      const status = failure instanceof Error && 'status' in failure ? failure.status : undefined
      const code = failure instanceof Error && 'code' in failure ? failure.code : undefined
      if (status === 401 || status === 403) {
        onSessionExpired()
        return
      }
      setError(status === 400
        ? 'Kontrollera e-postadressen och försök igen.'
        : status === 409 && code === 'ACCOUNT_EXISTS'
          ? 'Det finns redan ett konto med den här e-postadressen. Personen kan logga in med sitt befintliga konto.'
          : 'Det gick inte att bekräfta att inbjudan skickades. Kontrollera om mejlet kommit fram innan du försöker igen. Ett nytt försök ersätter den tidigare länken.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-tool" aria-labelledby="invite-heading" aria-busy={busy}>
      <h3 id="invite-heading">Bjud in en administratör</h3>
      <p className="admin-muted">Skicka en personlig inbjudan via mejl. Mottagaren får administratörsbehörighet när kontot skapas.</p>
      <p className="mt-3 text-sm text-black/70">Om adressen redan har en inbjudan ersätts den gamla länken automatiskt. Den nya länken gäller i 24 timmar och kan användas en gång.</p>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label htmlFor="invite-email">Mottagarens e-postadress</label>
        <input id="invite-email" name="email" type="email" autoComplete="off" maxLength={254} placeholder="namn@exempel.se" required readOnly={busy || disabled} />
        <button className="admin-button" type="submit" disabled={busy || disabled}>{busy ? 'Skickar inbjudan…' : 'Skicka inbjudan'}</button>
      </form>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {invitation && (
        <div className="admin-invitation-result">
          <p role="status">Inbjudan har skickats till <strong>{invitation.email}</strong>. Eventuella tidigare inbjudningslänkar har ersatts.</p>
          <p className="admin-muted">Be mottagaren kontrollera skräpposten om mejlet inte dyker upp.</p>
        </div>
      )}
    </section>
  )
}

export default AdminInvitations
