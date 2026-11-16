import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { redeemInvitation } from '../api/api.js'
import { getApiErrorDetails } from '../api/errors'
import NewPasswordFields from './NewPasswordFields'

const linkClass = 'underline underline-offset-4 focus-visible:outline-black!'

function AcceptInvitationForm() {
  const [searchParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const invitationToken = searchParams.get('token') ?? ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (!invitationToken.trim()) {
      setError('Inbjudningslänken saknar en kod. Öppna länken i ditt inbjudningsmejl eller be om en ny inbjudan.')
      return
    }
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
      await redeemInvitation(invitationToken, password)
      form.reset()
      setSuccess(true)
    } catch (failure) {
      const { status } = getApiErrorDetails(failure)
      setError(status === 400
        ? 'Inbjudan är ogiltig eller har gått ut. Öppna länken i ditt senaste inbjudningsmejl eller be om en ny inbjudan.'
        : status === 409
          ? 'Det finns redan ett konto med den här e-postadressen. Prova att logga in.'
          : 'Det gick inte att bekräfta att kontot skapades. Prova att logga in innan du försöker igen.')
    } finally {
      setBusy(false)
    }
  }

  if (!invitationToken.trim()) {
    return (
      <div>
        <p role="alert" className="mb-6 border-l-4 border-red bg-[#fce8e7] p-4 text-[#840904]">Du behöver en inbjudningslänk för att skapa ett administratörskonto. Öppna länken i ditt inbjudningsmejl eller be en administratör om en inbjudan.</p>
        <Link className={linkClass} to="/admin">Till inloggningen</Link>
      </div>
    )
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
        <NewPasswordFields busy={busy} idPrefix="accept" />
        {error && <p role="alert" className="mb-5 border-l-4 border-red bg-[#fce8e7] p-4 text-sm text-[#840904]">{error}</p>}
        <button type="submit" disabled={busy} className="min-h-12 w-full cursor-pointer rounded bg-red px-5 py-3 font-heading text-xl text-white hover:enabled:bg-red/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-wait disabled:opacity-60">{busy ? 'Skapar konto…' : 'Skapa konto'}</button>
      </form>
      <p className="mt-6 text-sm">Har du redan ett konto? <Link className={linkClass} to="/admin">Logga in</Link></p>
    </>
  )
}

export default AcceptInvitationForm
