import { useEffect, useId, useRef } from 'react'
import { formatClubDate, type ClubNews } from '../data/clubUpdates'

function NewsPreview({ news, onClose }: { news: ClubNews | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = dialogRef.current
    if (news && !dialog?.open) dialog?.showModal()
    if (!news && dialog?.open) dialog.close()
  }, [news])

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} onClose={onClose} className="fixed inset-0 m-auto max-h-[calc(100svh_-_2rem)] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-lg border-0 border-t-4 border-red bg-black p-5 text-white shadow-xl backdrop:bg-black/75 min-[40rem]:p-8">
      {news && (
        <article className="wrap-break-word">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-xs text-warm-white">Förhandsvisning · exempelnyhet</p>
            <button type="button" onClick={() => dialogRef.current?.close()} className="min-h-11 shrink-0 cursor-pointer rounded border border-white/50 px-3 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Stäng</button>
          </div>
          <time dateTime={news.date} className="text-sm text-warm-white">{formatClubDate(news.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          <h2 id={titleId} className="mt-3 text-3xl leading-tight">{news.title}</h2>
          <p className="mt-5 whitespace-pre-wrap text-warm-white">{news.summary}</p>
          <p className="mt-6 whitespace-pre-wrap text-sm text-warm-white">{news.body}</p>
        </article>
      )}
    </dialog>
  )
}

export default NewsPreview
