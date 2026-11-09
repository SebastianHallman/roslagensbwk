type Props = {
  user: { email: string }
}

function AdminAccount({ user }: Props) {
  return (
    <>
      <p className="admin-muted">Du är inloggad som administratör.</p>
      <dl className="admin-account">
        <dt>E-postadress</dt>
        <dd>{user.email}</dd>
        <dt>Behörighet</dt>
        <dd>Administratör</dd>
      </dl>
    </>
  )
}

export default AdminAccount
