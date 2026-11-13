import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { fetchNews } from '../api/api.js'
import clubLogo from '../assets/logo.png'
import type { ApiNews } from '../types/news'
import { formatClubDate } from '../utils/date'

function NewsArticle({ id }: { id: string }) {
  const validId = /^[1-9]\d*$/.test(id) && Number(id) <= 4294967295
  const [news, setNews] = useState<ApiNews | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing' | 'error'>(validId ? 'loading' : 'missing')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!validId) return
    const controller = new AbortController()
    fetchNews(controller.signal).then((items: ApiNews[]) => {
      if (controller.signal.aborted) return
      const item = items.find((item) => String(item.id) === id && item.status === 'published')
      setNews(item ?? null)
      setLoadState(item ? 'ready' : 'missing')
    }).catch(() => {
      if (!controller.signal.aborted) setLoadState('error')
    })
    return () => controller.abort()
  }, [id, validId, reload])

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${news?.title ?? 'Nyhet'} | Roslagens Bowlingklubb`
    return () => { document.title = previousTitle }
  }, [news?.title])

  return (
    <div className="flex min-h-svh min-w-0 flex-col bg-black px-4 text-white [color-scheme:light] min-[40rem]:px-6">
      <header className="mx-auto w-full max-w-xl pt-20 pb-6">
        <Link to="/" aria-label="Roslagens Bowlingklubb – startsidan" className="inline-flex items-center gap-3 rounded text-white focus-visible:outline-2 focus-visible:outline-offset-4">
          <img src={clubLogo} alt="" width="64" height="64" className="size-16 shrink-0" />
          <span className="font-heading text-xl leading-tight">Roslagens<br />Bowlingklubb</span>
        </Link>
      </header>
      <main id="news-content" tabIndex={-1} className="mx-auto w-full max-w-xl pb-12 wrap-anywhere outline-none">
        <Link to="/#nyheter" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded border border-white/30 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <span aria-hidden="true">←</span> Tillbaka
        </Link>
        <div className="bg-[#fff] px-6 py-8 text-black sm:p-10">
        {loadState === 'loading' && <p role="status">Hämtar nyhet…</p>}
        {loadState === 'error' && (
          <div>
            <h1 className="mb-4 text-3xl">Nyheten kunde inte hämtas</h1>
            <p role="alert">Försök igen om en stund.</p>
            <button type="button" className="mt-4 min-h-11 cursor-pointer underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4" onClick={() => { setLoadState('loading'); setReload((current) => current + 1) }}>Försök igen</button>
          </div>
        )}
        {loadState === 'missing' && <h1 className="text-3xl">Nyheten finns inte</h1>}
        {loadState === 'ready' && news && (
          <article className="min-w-0 max-w-full">
            {news.date && <time dateTime={news.date} className="text-sm text-black/60">{formatClubDate(news.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time>}
            <h1 className="mt-3 mb-8 text-4xl leading-tight md:text-5xl">{news.title}</h1>
            <p className="max-w-prose whitespace-pre-wrap leading-relaxed text-black/85">{news.body}</p>
          </article>
        )}
        </div>
      </main>
    </div>
  )
}

function NewsPage() {
  const { id = '' } = useParams()
  return <NewsArticle key={id} id={id} />
}

export default NewsPage
