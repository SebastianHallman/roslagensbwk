import clubLogo from '../assets/logo.png'
import { Link } from 'react-router'

function AdminHeader() {
  return (
    <header className="admin-header">
      <Link className="admin-brand" to="/" aria-label="Roslagens Bowlingklubb – startsidan">
        <img src={clubLogo} width="64" height="64" alt="" />
        <span>Roslagens<br />Bowlingklubb</span>
      </Link>
      <Link className="admin-back" to="/">Till klubbens webbplats <span aria-hidden="true">↗</span></Link>
    </header>
  )
}

export default AdminHeader
