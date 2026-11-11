import { formatClubDate } from '../utils/date'
import type { ClubNews } from '../types/news'

function ClubNewsSection({ items }: { items: ClubNews[] }) {
  return (
    <section id="nyheter" aria-labelledby="news-heading" className="bg-black px-4 py-14 text-white min-[40rem]:px-6 md:py-20 md:pr-0 md:pl-8">
      <div className="mx-auto max-w-[32rem] md:mx-0">
        <h2 id="news-heading" className="mb-3 text-3xl leading-tight lg:text-4xl">Senaste från klubben</h2>
        <p className="mb-8 text-xs text-warm-white">Exempelnyheter · innehåll för skissen</p>
        <div className="grid gap-9">
          {items.map((item) => (
            <article key={item.id}>
              <time dateTime={item.date} className="text-sm text-warm-white">
                {formatClubDate(item.date, { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
              <h3 className="mt-3 mb-3 font-heading text-2xl leading-tight">{item.title}</h3>
              <p className="text-warm-white">{item.summary}</p>
              <details className="mt-3">
                <summary className="w-fit cursor-pointer underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  Läs mer<span className="sr-only"> om {item.title}</span>
                </summary>
                <p className="mt-4 text-sm text-warm-white">{item.body}</p>
              </details>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ClubNewsSection
