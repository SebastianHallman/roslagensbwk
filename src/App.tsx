import Hero from './components/Hero'
import SponsorStrip from './components/SponsorStrip'

function App() {
  return (
    <>
      <a className="skip-link" href="#innehall">Hoppa till innehållet</a>
      <main id="innehall" tabIndex={-1}>
        <Hero />
        <SponsorStrip />
      </main>
    </>
  )
}

export default App
