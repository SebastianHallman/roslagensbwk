import { useSponsors } from '../api/sponsors'

function SponsorStrip() {
  const sponsors = useSponsors()
  if (sponsors.length === 0) return null
  return (
    <section className="bg-black py-7 text-white" aria-label="Sponsorer">
      <ul className="mx-auto grid w-[calc(100%_-_3rem)] max-w-[76rem] list-none grid-cols-4 items-center gap-6 p-0 text-center max-[40rem]:w-[calc(100%_-_2rem)] max-[40rem]:grid-cols-2">
        {sponsors.map((sponsor) => (
          <li key={sponsor.id} className="min-w-0 font-heading text-lg">
            {sponsor.image ? (
              <img
                className="mx-auto h-16 w-auto max-w-full object-contain"
                src={sponsor.image}
                alt={sponsor.name}
                loading="lazy"
                decoding="async"
              />
            ) : sponsor.name}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default SponsorStrip
