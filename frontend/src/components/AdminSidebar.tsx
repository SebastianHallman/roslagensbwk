import { NavLink } from 'react-router'

type Props = {
  email: string
  busy: boolean
  onSignOut: () => Promise<void>
}

function AdminSidebar({ email, busy, onSignOut }: Props) {
  return (
    <aside className="admin-sidebar" aria-label="Administrationsmeny">
      <p className="admin-eyebrow">Administration</p>
      <p className="admin-sidebar-email">{email}</p>
      <nav aria-label="Adminpanel">
        <ul>
          <li><NavLink to="/admin/styrelsen" end>Styrelsen</NavLink></li>
          <li><NavLink to="/admin/inbjudningar" end>Inbjudningar</NavLink></li>
        </ul>
      </nav>
      <NavLink to="/admin" end>Konto</NavLink>
      <button className="admin-button" disabled={busy} onClick={onSignOut}>{busy ? 'Loggar ut…' : 'Logga ut'}</button>
    </aside>
  )
}

export default AdminSidebar
