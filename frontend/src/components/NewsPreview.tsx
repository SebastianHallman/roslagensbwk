import { useEffect, useId, useRef } from 'react'
import { formatClubDate } from '../utils/date'
import type { ClubNews } from '../types/news'

function NewsPreview({ news, onClose }: { news: ClubNews | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = dialogRef.current
    if (news && !dialog?.open) dialog?.showModal()
    if (!news && dialog?.open) dialog.close()
  }, [news])

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} onClose={onClose} className="fixed inset-0 m-auto max-h-[calc(100svh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto overscroll-contain border-0 bg-black p-0 text-white wrap-anywhere [color-scheme:light] backdrop:bg-black/90">
      {news && (
        <>
          <button type="button" onClick={() => dialogRef.current?.close()} className="mt-4 mb-8 ml-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded border border-white/30 px-4 py-2 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><span aria-hidden="true">←</span> Stäng</button>
          <article className="min-w-0 max-w-full bg-[#fff] px-6 py-8 text-black sm:p-10">
          {news.date
            ? <time dateTime={news.date} className="text-sm text-black/60">{formatClubDate(news.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
            : <p className="text-sm text-black/60">Datum sätts vid publicering.</p>}
          <h2 id={titleId} className="mt-3 mb-8 text-4xl leading-tight md:text-5xl">{news.title}</h2>
          <p className="max-w-prose whitespace-pre-wrap leading-relaxed text-black/85">{news.body}</p>
          </article>
        </>
      )}
    </dialog>
  )
}

export default NewsPreview
