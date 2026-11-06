import clubLogo from '../assets/logo.png'

const currentYear = new Date().getFullYear()

function Footer() {
  return (
    <footer className="bg-black py-8 text-white">
      <div className="mx-auto w-[calc(100%_-_2rem)] max-w-[76rem] min-[40rem]:w-[calc(100%_-_3rem)]">
        <div className="flex flex-col gap-8 pb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <a href="#start" className="shrink-0 rounded-full" aria-label="Roslagens Bowlingklubb – till sidans början">
              <img src={clubLogo} alt="" width="64" height="64" className="size-16 rounded-full" loading="lazy" decoding="async" />
            </a>
            <div>
              <p className="font-heading text-xl leading-tight">Roslagens Bowlingklubb</p>
              
            </div>
          </div>
          <nav aria-label="Sidfotsnavigation">
            <ul className="flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-sm">
              <li><a href="#om-klubben" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:decoration-2">Om klubben</a></li>
              <li><a href="#vara-lag" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:decoration-2">Våra lag</a></li>
              <li><a href="#kontakt" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:decoration-2">Kontakt</a></li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-white/20 pt-5 text-center text-xs text-warm-white">
          <p>© {currentYear} Roslagens Bowlingklubb</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
