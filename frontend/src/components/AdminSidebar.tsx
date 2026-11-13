import { useEffect, useId, useRef, useState } from 'react'
import { NavLink } from 'react-router'

type Props = {
  email: string
  busy: boolean
  onSignOut: () => Promise<void>
}

function MenuContent({ email, busy, onSignOut, onNavigate }: Props & { onNavigate?: () => void }) {
  return (
    <>
      <p className="admin-sidebar-email">{email}</p>
      <nav aria-label="Adminpanel">
        <ul>
          <li><NavLink to="/admin/tavlingar" end onClick={onNavigate}>Tävlingar</NavLink></li>
          <li><NavLink to="/admin/nyheter" end onClick={onNavigate}>Nyheter</NavLink></li>
          <li><NavLink to="/admin/styrelsen" end onClick={onNavigate}>Styrelsen</NavLink></li>
          <li><NavLink to="/admin/inbjudningar" end onClick={onNavigate}>Inbjudningar</NavLink></li>
        </ul>
      </nav>
      <NavLink to="/admin" end onClick={onNavigate}>Konto</NavLink>
      <button className="admin-button" disabled={busy} onClick={() => { onNavigate?.(); void onSignOut() }}>{busy ? 'Loggar ut…' : 'Logga ut'}</button>
    </>
  )
}

function AdminSidebar(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const dialogId = useId()
  const titleId = useId()

  function closeMenu() {
    dialogRef.current?.close()
  }

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 48.001rem)')
    function closeOnDesktop() {
      if (desktop.matches) dialogRef.current?.close()
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  return (
    <>
      <button
        type="button"
        className="admin-menu-trigger"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        onClick={() => { dialogRef.current?.showModal(); setOpen(true) }}
      >
        <span aria-hidden="true">☰</span> Meny
      </button>
      <aside className="admin-sidebar admin-desktop-sidebar" aria-label="Administrationsmeny">
        <p className="admin-eyebrow">Administration</p>
        <MenuContent {...props} />
      </aside>
      <dialog
        ref={dialogRef}
        id={dialogId}
        className="admin-drawer"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu()
        }}
      >
        <div className="admin-sidebar admin-drawer-content">
          <div className="admin-drawer-heading">
            <h2 id={titleId} className="admin-eyebrow">Administration</h2>
            <button type="button" className="admin-menu-close" onClick={closeMenu} aria-label="Stäng menyn">×</button>
          </div>
          <MenuContent {...props} onNavigate={closeMenu} />
        </div>
      </dialog>
    </>
  )
}

export default AdminSidebar
