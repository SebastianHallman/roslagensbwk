import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { createAdminInvitation } from '../api/api.js'

type Props = {
  disabled: boolean
  onSessionExpired: () => void
}

function AdminInvitations({ disabled, onSessionExpired }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<{ email: string; code: string } | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || disabled) return
    const form = event.currentTarget
    const email = String(new FormData(form).get('email')).trim()
    setBusy(true)
    setError('')
    setInvitation(null)
    try {
      const data = await createAdminInvitation(email)
      setInvitation({ email, code: data.code })
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
          : 'Det gick inte att skapa inbjudan. Kontrollera resultatet innan du försöker igen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-tool" aria-labelledby="invite-heading" aria-busy={busy}>
      <h3 id="invite-heading">Bjud in en administratör</h3>
      <p className="admin-muted">Skapa en personlig inbjudningskod. Mottagaren får administratörsbehörighet när kontot skapas.</p>
      <p className="mt-3 text-sm text-black/70">Om adressen redan har en inbjudan ersätts den gamla koden automatiskt. Den nya koden gäller i 24 timmar.</p>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label htmlFor="invite-email">Mottagarens e-postadress</label>
        <input id="invite-email" name="email" type="email" autoComplete="off" maxLength={254} placeholder="namn@exempel.se" required readOnly={busy || disabled} />
        <button className="admin-button" type="submit" disabled={busy || disabled}>{busy ? 'Skapar inbjudan…' : 'Skapa inbjudan'}</button>
      </form>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {invitation && (
        <div className="admin-invitation-result">
          <p role="status">Inbjudan är klar för <strong>{invitation.email}</strong>. Använd den här koden; eventuella tidigare koder har ersatts.</p>
          <label htmlFor="invitation-code">Inbjudningskod</label>
          <input id="invitation-code" className="admin-code" value={invitation.code} readOnly onFocus={(event) => event.currentTarget.select()} aria-describedby="invitation-help" />
          <p id="invitation-help" className="admin-muted">Kopiera koden och dela den privat med mottagaren. Den gäller i 24 timmar och kan användas en gång. Inget mejl skickas automatiskt. Spara koden innan du lämnar sidan.</p>
          <p className="mt-4 text-sm">Be mottagaren öppna <Link to="/acceptera-inbjudan" className="underline underline-offset-4 focus-visible:outline-black!">{window.location.origin}/acceptera-inbjudan</Link> och ange koden tillsammans med sin e-postadress.</p>
        </div>
      )}
    </section>
  )
}

export default AdminInvitations
