import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router'
import { getCurrentUser, signIn, signOut } from '../api/api.js'
import AdminHeader from '../components/AdminHeader'
import AdminStory from '../components/AdminStory'
import AdminAccount from '../components/AdminAccount'
import AdminSignInForm from '../components/AdminSignInForm'
import AdminSidebar from '../components/AdminSidebar'
import AdminBoard from '../components/AdminBoard'
import AdminInvitations from '../components/AdminInvitations'
import AdminTournaments from '../components/AdminTournaments'
import AdminNews from '../components/AdminNews'

type AdminUser = { id: number; email: string; role: string }
type SessionState = 'checking' | 'ready' | 'error'
const currentYear = new Date().getFullYear()

function AdminPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [session, setSession] = useState<SessionState>('checking')
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const path = pathname.replace(/\/+$/, '')
  const panelTitle = ({ '/admin': 'Ditt konto', '/admin/styrelsen': 'Styrelsen', '/admin/inbjudningar': 'Inbjudningar', '/admin/tavlingar': 'Tävlingar', '/admin/nyheter': 'Nyheter' } as Record<string, string>)[path] ?? 'Sidan finns inte'
  const isLocalContent = path === '/admin/tavlingar' || path === '/admin/nyheter'

  const handleSessionExpired = useCallback(() => {
    setUser(null)
    setError('')
    setNotice('Din session eller administratörsbehörighet har upphört. Logga in igen.')
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const previousTitle = document.title
    document.title = 'Administration | Roslagens Bowlingklubb'
    getCurrentUser().then((currentUser) => {
      if (!controller.signal.aborted) {
        setUser(currentUser)
        setSession('ready')
      }
    }).catch(() => {
      if (!controller.signal.aborted) setSession('error')
    })
    return () => {
      controller.abort()
      document.title = previousTitle
    }
  }, [attempt])

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const fields = new FormData(form)
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const data = await signIn(String(fields.get('email')).trim(), String(fields.get('password')))
      form.reset()
      setUser(data.user)
    } catch (failure) {
      const status = failure instanceof Error && 'status' in failure ? failure.status : undefined
      setError(status === 401
        ? 'Fel e-postadress eller lösenord.'
        : status === 429
          ? 'För många inloggningsförsök. Vänta en stund och försök igen.'
          : 'Det gick inte att logga in. Försök igen om en stund.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSignOut() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await signOut()
      setUser(null)
      setNotice('Du har loggats ut.')
      navigate('/admin', { replace: true })
    } catch {
      setError('Det gick inte att logga ut. Försök igen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <a className="skip-link" href="#admin-content">Hoppa till innehållet</a>
      <AdminHeader />

      <main id="admin-content" className={`admin-layout${user ? ' admin-dashboard-layout' : ''}`} tabIndex={-1}>
        {user ? <AdminSidebar email={user.email} busy={busy} onSignOut={handleSignOut} /> : <AdminStory />}

        <section className="admin-panel" aria-labelledby="session-heading" aria-busy={busy || session === 'checking'}>
          <div className="admin-panel-inner">
            <p className="admin-eyebrow">Roslagens Bowlingklubb</p>
            <h2 id="session-heading">{session !== 'ready' ? 'Din session' : user ? panelTitle : 'Logga in'}</h2>
            {user && error && <p className="admin-error" role="alert">{error}</p>}
            {user && isLocalContent && <p className="mb-6 border-l-3 border-red bg-warm-white p-4 text-sm">{path === '/admin/tavlingar'
              ? 'Här kan du skapa och förhandsvisa tävlingar. Redigering av sparade tävlingar är ännu inte tillgänglig.'
              : 'Nyheter använder tills vidare exempeldata. Ändringar sparas bara lokalt i den öppna vyn och försvinner när du lämnar den eller laddar om. Inget publiceras på webbplatsen.'}</p>}

            {session === 'checking' ? <p role="status">Kontrollerar din inloggning…</p> : session === 'error' ? (
              <>
                <p role="alert">Det gick inte att kontrollera din session. Kontrollera anslutningen och försök igen.</p>
                <button className="admin-button" onClick={() => { setSession('checking'); setAttempt((value) => value + 1) }}>Försök igen</button>
              </>
            ) : user ? (
              <Routes>
                <Route index element={<AdminAccount user={user} />} />
                <Route path="styrelsen" element={<AdminBoard disabled={busy} onSessionExpired={handleSessionExpired} />} />
                <Route path="inbjudningar" element={<AdminInvitations disabled={busy} onSessionExpired={handleSessionExpired} />} />
                <Route path="tavlingar" element={<fieldset disabled={busy} className="min-w-0 border-0 p-0"><AdminTournaments onSessionExpired={handleSessionExpired} /></fieldset>} />
                <Route path="nyheter" element={<fieldset disabled={busy} className="min-w-0 border-0 p-0"><AdminNews /></fieldset>} />
                <Route path="*" element={<Link className="underline underline-offset-4" to="/admin">Till ditt konto</Link>} />
              </Routes>
            ) : (
              <AdminSignInForm busy={busy} error={error} notice={notice} onSubmit={handleSignIn} />
            )}
          </div>
        </section>
      </main>
      <footer className="admin-footer">© {currentYear} Roslagens Bowlingklubb</footer>
    </div>
  )
}

export default AdminPage
