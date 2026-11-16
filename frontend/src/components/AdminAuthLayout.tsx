import { useEffect } from 'react'
import type { ReactNode } from 'react'
import AdminHeader from './AdminHeader'

type Props = {
  title: string
  heading: string
  contentId: string
  children: ReactNode
}

const currentYear = new Date().getFullYear()

function AdminAuthLayout({ title, heading, contentId, children }: Props) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | Roslagens Bowlingklubb`
    return () => { document.title = previousTitle }
  }, [title])

  return (
    <div className="flex min-h-svh flex-col">
      <a className="skip-link" href={`#${contentId}`}>Hoppa till innehållet</a>
      <AdminHeader />
      <main id={contentId} tabIndex={-1} className="mx-auto my-6 w-[calc(100%_-_2rem)] max-w-xl flex-1 border-t-4 border-red bg-white p-6 text-black outline-none [color-scheme:light] sm:p-10">
        <p className="font-heading text-sm tracking-wider text-red uppercase">Roslagens Bowlingklubb</p>
        <h1 className="mt-3 mb-5 text-4xl leading-tight">{heading}</h1>
        {children}
      </main>
      <footer className="px-4 py-7 text-center text-xs text-warm-white">© {currentYear} Roslagens Bowlingklubb</footer>
    </div>
  )
}

export default AdminAuthLayout
