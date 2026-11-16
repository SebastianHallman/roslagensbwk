import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import AdminAuthLayout from '../components/AdminAuthLayout'
import NewPasswordFields from '../components/NewPasswordFields'
import { resetPassword } from '../api/api.js'
import { getApiErrorDetails } from '../api/errors'

const linkClass = 'underline underline-offset-4 focus-visible:outline-black!'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invalidToken, setInvalidToken] = useState(false)
  const [success, setSuccess] = useState(false)
  const hasToken = /^[a-f0-9]{32}$/.test(token)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !hasToken || invalidToken) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const password = String(fields.get('password'))
    setError('')
    if (password !== fields.get('confirmPassword')) {
      setError('Lösenorden stämmer inte överens.')
      return
    }
    setBusy(true)
    try {
      await resetPassword(token, password)
      form.reset()
      setSuccess(true)
    } catch (failure) {
      const { status, code } = getApiErrorDetails(failure)
      if (code === 'INVALID_RESET_TOKEN') {
        setInvalidToken(true)
      } else {
        setError(code === 'INVALID_PASSWORD'
          ? 'Lösenordet måste innehålla minst 8 tecken.'
          : status === 429
            ? 'För många försök. Vänta 15 minuter innan du försöker igen.'
            : 'Det gick inte att bekräfta lösenordsbytet. Prova att logga in med ditt nya lösenord innan du försöker igen.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminAuthLayout title="Återställ lösenord" heading="Återställ ditt lösenord" contentId="reset-content">
      {success ? (
        <p role="status" className="mb-6 border-l-4 border-[#224421] bg-[#e0eddf] p-4 text-[#224421]">Ditt lösenord har ändrats. Logga in med ditt nya lösenord.</p>
      ) : !hasToken || invalidToken ? (
        <p role="alert" className="mb-6 border-l-4 border-red bg-[#fce8e7] p-4 text-[#840904]">Återställningslänken saknas, är ogiltig eller har gått ut. Begär en ny länk via ”Glömt lösenord?” på inloggningssidan.</p>
      ) : (
        <>
          <p className="mb-6 text-sm text-black/70">Välj ett nytt lösenord för ditt administratörskonto. Länken kan användas en gång och gäller i 30 minuter från begäran.</p>
          <form onSubmit={handleSubmit} aria-label="Välj nytt lösenord" aria-busy={busy}>
            <NewPasswordFields busy={busy} idPrefix="reset" passwordLabel="Nytt lösenord" />
            {error && <p role="alert" className="mb-5 border-l-4 border-red bg-[#fce8e7] p-4 text-[#840904]">{error}</p>}
            <button className="admin-button" type="submit" disabled={busy}>{busy ? 'Sparar lösenord…' : 'Spara nytt lösenord'}</button>
          </form>
        </>
      )}
      <p className="mt-6 text-sm"><Link className={linkClass} to="/admin">Till inloggningen</Link></p>
    </AdminAuthLayout>
  )
}

export default ResetPasswordPage
