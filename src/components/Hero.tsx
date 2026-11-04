import clubLogo from '../assets/logo.png'
import bowlingHero from '../assets/bowling-hero.png'

function Hero() {
  return (
    <section
      className="relative isolate min-h-[48rem] bg-black max-[40rem]:min-h-0"
      id="start"
      aria-labelledby="welcome-heading"
    >
      <div className="absolute inset-0 -z-10 after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_right,#000_0%,#000e_40%,transparent_50%)] after:content-[''] max-[40rem]:relative max-[40rem]:aspect-[4/3] max-[40rem]:after:bg-[linear-gradient(to_top,#000_0%,#0009_15%,transparent_45%)]">
        <img className="absolute inset-0 h-full w-full object-cover object-[65%_center] max-[40rem]:object-[75%_center]" src={bowlingHero} alt="" fetchPriority="high" />
      </div>
      <header className="mx-auto flex min-h-32 w-[calc(100%_-_3rem)] max-w-[76rem] items-center max-[40rem]:hidden">
        <a className="inline-flex rounded-full" href="#start" aria-label="Roslagens Bowlingklubb – startsidan">
          <img className="size-19 rounded-full max-[40rem]:size-14" src={clubLogo} alt="" width="76" height="76" />
        </a>
      </header>
      <div className="mx-auto w-[calc(100%_-_3rem)] max-w-[76rem] pt-24 pb-36 max-[40rem]:w-[calc(100%_-_2rem)] max-[40rem]:pt-3 max-[40rem]:pb-10">
        <h1 className="m-0 max-w-[11ch] font-heading text-[clamp(2.8rem,5vw,4.5rem)] leading-[1.08] text-balance max-[40rem]:max-w-[14ch] max-[40rem]:text-[clamp(1.75rem,7.5vw,2.25rem)] max-[40rem]:leading-[1.15]" id="welcome-heading">
          <span className="mb-[.65rem] block text-[.52em] max-[40rem]:mb-0 max-[40rem]:text-[1em]">Välkommen till</span>
          Roslagens Bowlingklubb
        </h1>
        <p className="mt-6 mb-0 max-w-[33rem] text-[clamp(.95rem,1.4vw,1.05rem)] text-warm-white max-[40rem]:mt-4 max-[40rem]:text-sm">
          Tillsammans vässar vi tekniken och delar tävlingsglädjen.
          För nya och erfarna bowlare.
        </p>
        <a href="#kontakt" className="mt-8 inline-flex min-h-11 items-center justify-center rounded bg-red px-8 py-2 text-white hover:bg-red/90 focus-visible:ring-2 focus-visible:ring-red/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black max-[40rem]:mt-5 max-[40rem]:font-heading">
          Kontakta oss
        </a>
      </div>
    </section>
  )
}

export default Hero
