type Props = {
  busy: boolean
  idPrefix: string
  passwordLabel?: string
}

const inputClass = 'mt-2 mb-5 min-h-12 w-full rounded border border-black/45 bg-white px-4 py-3 text-base text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function NewPasswordFields({ busy, idPrefix, passwordLabel = 'Lösenord' }: Props) {
  const passwordId = `${idPrefix}-password`
  const confirmId = `${idPrefix}-confirm`
  const helpId = `${idPrefix}-password-help`

  return (
    <>
      <label htmlFor={passwordId}>{passwordLabel}</label>
      <input className={inputClass} id={passwordId} name="password" type="password" minLength={8} autoComplete="new-password" required readOnly={busy} aria-describedby={helpId} />
      <p id={helpId} className="-mt-3 mb-5 text-sm text-black/70">Minst 8 tecken. Välj ett unikt lösenord.</p>
      <label htmlFor={confirmId}>Bekräfta lösenord</label>
      <input className={inputClass} id={confirmId} name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required readOnly={busy} />
    </>
  )
}

export default NewPasswordFields
