import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { redeemInvitation } from '../api/api.js'

const inputClass = 'mt-2 mb-5 min-h-12 w-full rounded border border-black/45 bg-[#fff] px-4 py-3 text-base text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'
const linkClass = 'underline underline-offset-4 focus-visible:outline-black!'

function AcceptInvitationForm() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const password = String(fields.get('password'))
    if (password !== fields.get('confirmPassword')) {
      setError('Lösenorden stämmer inte överens.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await redeemInvitation(String(fields.get('token')).trim(), String(fields.get('email')).trim(), password)
      form.reset()
      setSuccess(true)
    } catch (failure) {
      const status = failure instanceof Error && 'status' in failure ? failure.status : undefined
      setError(status === 400
        ? 'Inbjudan är ogiltig eller har gått ut. Kontrollera koden och e-postadressen, eller be om en ny inbjudan.'
        : status === 409
          ? 'Det finns redan ett konto med den här e-postadressen. Prova att logga in.'
          : 'Det gick inte att bekräfta att kontot skapades. Prova att logga in innan du försöker igen.')
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <div>
        <p role="status" className="mb-6 border-l-4 border-[#224421] bg-[#e0eddf] p-4 text-[#224421]">Ditt administratörskonto är skapat. Du kan nu logga in.</p>
        <Link className={linkClass} to="/admin">Till inloggningen</Link>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} aria-label="Skapa administratörskonto" aria-busy={busy}>
        <label htmlFor="accept-token">Inbjudningskod</label>
        <input className={inputClass} id="accept-token" name="token" required pattern=".*\S.*" autoComplete="off" autoCapitalize="none" spellCheck={false} readOnly={busy} />
        <label htmlFor="accept-email">E-postadress</label>
        <input className={inputClass} id="accept-email" name="email" type="email" maxLength={254} autoComplete="username" required readOnly={busy} />
        <label htmlFor="accept-password">Lösenord</label>
        <input className={inputClass} id="accept-password" name="password" type="password" minLength={8} autoComplete="new-password" required readOnly={busy} aria-describedby="password-help" />
        <p id="password-help" className="-mt-3 mb-5 text-sm text-black/70">Minst 8 tecken. Välj ett unikt lösenord.</p>
        <label htmlFor="accept-confirm">Bekräfta lösenord</label>
        <input className={inputClass} id="accept-confirm" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required readOnly={busy} />
        {error && <p role="alert" className="mb-5 border-l-4 border-red bg-[#fce8e7] p-4 text-sm text-[#840904]">{error}</p>}
        <button type="submit" disabled={busy} className="min-h-12 w-full cursor-pointer rounded bg-red px-5 py-3 font-heading text-xl text-white hover:enabled:bg-red/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-wait disabled:opacity-60">{busy ? 'Skapar konto…' : 'Skapa konto'}</button>
      </form>
      <p className="mt-6 text-sm">Har du redan ett konto? <Link className={linkClass} to="/admin">Logga in</Link></p>
    </>
  )
}

export default AcceptInvitationForm
