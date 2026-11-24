import clubLogo from '../assets/logo.png'

const currentYear = new Date().getFullYear()

function Footer() {
  return (
    <footer className="bg-black py-8 text-white">
      <div className="mx-auto w-[calc(100%_-_2rem)] max-w-[76rem] min-[40rem]:w-[calc(100%_-_3rem)]">
        <div className="flex items-center gap-4 pb-8">
          <img src={clubLogo} alt="" width="64" height="64" className="size-16 shrink-0 rounded-full" loading="lazy" decoding="async" />
          <p className="font-heading text-xl leading-tight">Roslagens Bowlingklubb</p>
        </div>
        <div className="border-t border-white/20 pt-5 text-center text-xs text-warm-white">
          <p>© {currentYear} Roslagens Bowlingklubb</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
