import { useEffect } from 'react'
import AdminHeader from '../components/AdminHeader'
import AcceptInvitationForm from '../components/AcceptInvitationForm'

const currentYear = new Date().getFullYear()

function AcceptInvitationPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Acceptera inbjudan | Roslagens Bowlingklubb'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <div className="flex min-h-svh flex-col">
      <a className="skip-link" href="#invitation-content">Hoppa till innehållet</a>
      <AdminHeader />
      <main id="invitation-content" tabIndex={-1} className="mx-auto my-6 w-[calc(100%_-_2rem)] max-w-xl flex-1 border-t-4 border-red bg-white p-6 text-black outline-none [color-scheme:light] sm:p-10">
        <p className="font-heading text-sm tracking-wider text-red uppercase">Roslagens Bowlingklubb</p>
        <h1 className="mt-3 mb-5 text-4xl leading-tight">Acceptera din inbjudan</h1>
        <p className="mb-8 text-sm text-black/70">Ange koden du fått från en administratör och den e-postadress som inbjudan gäller. Välj sedan ett lösenord för ditt administratörskonto.</p>
        <AcceptInvitationForm />
      </main>
      <footer className="px-4 py-7 text-center text-xs text-warm-white">© {currentYear} Roslagens Bowlingklubb</footer>
    </div>
  )
}

export default AcceptInvitationPage
