import AdminAuthLayout from '../components/AdminAuthLayout'
import AcceptInvitationForm from '../components/AcceptInvitationForm'

function AcceptInvitationPage() {
  return (
    <AdminAuthLayout title="Acceptera inbjudan" heading="Acceptera din inbjudan" contentId="invitation-content">
      <p className="mb-8 text-sm text-black/70">Välj ett lösenord för ditt administratörskonto.</p>
      <AcceptInvitationForm />
    </AdminAuthLayout>
  )
}

export default AcceptInvitationPage
