import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-[76rem] px-6 py-20" tabIndex={-1}>
      <h1 className="mb-6 text-4xl">Sidan finns inte</h1>
      <Link to="/" className="underline underline-offset-4">Till startsidan</Link>
    </main>
  )
}

export default NotFoundPage
