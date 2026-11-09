import type { FormEvent } from 'react'

type Props = {
  busy: boolean
  error: string
  notice: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

function AdminSignInForm({ busy, error, notice, onSubmit }: Props) {
  return (
    <>
      <p className="admin-muted">Logga in med ditt administratörskonto.</p>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      <form className="admin-form" onSubmit={onSubmit}>
        <label htmlFor="admin-email">E-postadress</label>
        <input id="admin-email" name="email" type="email" autoComplete="username" placeholder="namn@exempel.se" required readOnly={busy} />
        <label htmlFor="admin-password">Lösenord</label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required readOnly={busy} />
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="admin-button" type="submit" disabled={busy}>{busy ? 'Loggar in…' : 'Logga in'}</button>
      </form>
      <p className="admin-help">Behöver du tillgång? Kontakta en administratör i klubben.</p>
    </>
  )
}

export default AdminSignInForm
