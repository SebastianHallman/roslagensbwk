import Hero from './components/Hero'
import SponsorStrip from './components/SponsorStrip'
import ClubIntroduction from './components/ClubIntroduction'
import ContactSection from './components/ContactSection'

function App() {
  return (
    <>
      <a className="skip-link" href="#innehall">Hoppa till innehållet</a>
      <main id="innehall" tabIndex={-1}>
        <Hero />
        <SponsorStrip />
        <ClubIntroduction />
        <ContactSection />
      </main>
    </>
  )
}

export default App
