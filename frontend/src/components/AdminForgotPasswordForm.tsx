import { useState } from 'react'
import type { FormEvent } from 'react'
import { requestPasswordReset } from '../api/api.js'
import { getApiErrorDetails } from '../api/errors'

type Props = {
  onBack: () => void
}

function AdminForgotPasswordForm({ onBack }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const email = String(new FormData(form).get('email')).trim()
    setBusy(true)
    setError('')
    setSuccess(false)
    try {
      await requestPasswordReset(email)
      form.reset()
      setSuccess(true)
    } catch (failure) {
      const { status } = getApiErrorDetails(failure)
      setError(status === 400
        ? 'Kontrollera e-postadressen och försök igen.'
        : status === 429
          ? 'För många försök. Vänta 15 minuter innan du försöker igen.'
          : 'Det gick inte att bekräfta begäran. Försök igen om en stund.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <p id="forgot-password-help" className="admin-muted">Återställ lösenordet för ditt administratörskonto via e-post.</p>
      <form className="admin-form" aria-label="Återställ lösenord" aria-busy={busy} onSubmit={handleSubmit}>
        <label htmlFor="forgot-password-email">E-postadress</label>
        <input id="forgot-password-email" name="email" type="email" autoComplete="username" placeholder="namn@exempel.se" maxLength={254} required readOnly={busy} aria-describedby="forgot-password-help" />
        {error && <p className="admin-error" role="alert">{error}</p>}
        {success && <p className="admin-notice" role="status">Om ett konto finns för adressen skickar vi en återställningslänk.</p>}
        <button className="admin-button" type="submit" disabled={busy}>{busy ? 'Skickar begäran…' : 'Skicka återställningslänk'}</button>
      </form>
      <button type="button" className="text-red mt-4 min-h-12 cursor-pointer hover:underline disabled:cursor-wait disabled:opacity-60" onClick={onBack} disabled={busy}>Tillbaka till inloggningen</button>
    </>
  )
}

export default AdminForgotPasswordForm
