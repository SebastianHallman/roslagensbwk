import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchNews } from '../api/api.js'
import { formatClubDate } from '../utils/date'
import type { ApiNews, ClubNews } from '../types/news'

function ClubNewsSection() {
  const [news, setNews] = useState<ClubNews[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchNews(controller.signal).then((data: ApiNews[]) => {
      if (controller.signal.aborted) return
      setNews(data.map((item) => ({ ...item, id: String(item.id) })))
      setLoadState('ready')
    }).catch(() => {
      if (!controller.signal.aborted) setLoadState('error')
    })
    return () => controller.abort()
  }, [reload])

  return (
    <section id="nyheter" aria-labelledby="news-heading" className="min-w-0 max-w-full bg-black px-4 py-14 text-white wrap-anywhere min-[40rem]:px-6 md:py-20 md:pr-0 md:pl-8">
      <div className="mx-auto w-full max-w-[32rem] md:mx-0">
        <h2 id="news-heading" className="mb-8 text-3xl leading-tight lg:text-4xl">Senaste från klubben</h2>
        {loadState === 'loading' && <p role="status">Hämtar nyheter…</p>}
        {loadState === 'error' && (
          <div>
            <p role="alert">Det gick inte att hämta nyheterna.</p>
            <button type="button" className="mt-3 min-h-11 cursor-pointer underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" onClick={() => { setLoadState('loading'); setReload((current) => current + 1) }}>Försök igen</button>
          </div>
        )}
        {loadState === 'ready' && news.length === 0 && <p>Inga nyheter publicerade ännu.</p>}
        <div className="grid gap-9">
          {loadState === 'ready' && news.map((item) => (
            <article key={item.id} className="min-w-0 max-w-full">
              {item.date && <time dateTime={item.date} className="text-sm text-warm-white">
                {formatClubDate(item.date, { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>}
              <h3 className="mt-3 mb-3 font-heading text-2xl leading-tight">{item.title}</h3>
              <p className="text-warm-white">{item.body.length > 180 ? item.body.slice(0, 180).trimEnd() + '…' : item.body}</p>
              <Link to={`/nyheter/${encodeURIComponent(item.id)}`} className="mt-3 inline-flex min-h-11 items-center underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Läs mer<span className="sr-only"> om {item.title}</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ClubNewsSection
