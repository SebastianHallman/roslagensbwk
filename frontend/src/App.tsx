import { BrowserRouter, Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'
import NewsPage from './pages/NewsPage'
import TournamentPage from './pages/TournamentPage'
import NotFoundPage from './pages/NotFoundPage'
import AcceptInvitationPage from './pages/AcceptInvitationPage'
import AdminPage from './pages/AdminPage'
import RouteFocus from './components/RouteFocus'

function App() {
  return (
    <BrowserRouter>
      <RouteFocus />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/nyheter/:id" element={<NewsPage />} />
        <Route path="/tavlingar/:id" element={<TournamentPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/acceptera-inbjudan" element={<AcceptInvitationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
