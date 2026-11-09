import Hero from '../components/Hero'
import SponsorStrip from '../components/SponsorStrip'
import ClubIntroduction from '../components/ClubIntroduction'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'

function HomePage() {
  return (
    <>
      <a className="skip-link" href="#innehall">Hoppa till innehållet</a>
      <main id="innehall" tabIndex={-1}>
        <Hero />
        <SponsorStrip />
        <ClubIntroduction />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}

export default HomePage
