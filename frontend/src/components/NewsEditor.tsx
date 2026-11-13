import { useEffect, useRef, type FormEvent } from 'react'
import type { ClubNews } from '../types/news'

export type EditableNews = ClubNews & { status: 'draft' | 'published' }
type Props = { news: EditableNews | null; saving: boolean; onSave: (news: EditableNews) => void; onCancel: () => void }
const fieldClass = 'mb-5 min-h-12 min-w-0 w-full rounded border border-black/45 bg-[#fff] px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function NewsEditor({ news, saving, onSave, onCancel }: Props) {
  const titleInput = useRef<HTMLInputElement>(null)
  useEffect(() => { titleInput.current?.focus() }, [])

  function submit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault()
    const fields = new FormData(submission.currentTarget)
    const value = (key: string) => String(fields.get(key) ?? '').trim()
    for (const name of ['title', 'body']) {
      if (!value(name)) {
        const field = submission.currentTarget.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement
        field.setCustomValidity('Fyll i text, inte bara blanksteg.')
        field.reportValidity()
        return
      }
    }
    onSave({ id: news?.id ?? crypto.randomUUID(), title: value('title'), date: news?.date ?? null, body: value('body'), updated: news?.updated, status: value('status') === 'published' ? 'published' : 'draft' })
  }

  return (
    <section className="mt-8 rounded-lg border border-black/20 border-t-4 border-t-red bg-warm-white p-5 min-[40rem]:p-7" aria-labelledby="news-editor-heading">
      <h3 id="news-editor-heading" className="font-heading text-2xl">{news ? 'Redigera nyhet' : 'Ny nyhet'}</h3>
      <form className="mt-6" onSubmit={submit} onInput={(input) => { if (input.target instanceof HTMLInputElement || input.target instanceof HTMLTextAreaElement) input.target.setCustomValidity('') }} aria-labelledby="news-editor-heading">
        <fieldset disabled={saving} className="min-w-0 border-0 p-0">
        <label className="mb-2 block text-sm" htmlFor="news-title">Rubrik</label>
        <input ref={titleInput} className={fieldClass} id="news-title" name="title" defaultValue={news?.title} maxLength={150} pattern=".*\S.*" required />
        <label className="mb-2 block text-sm" htmlFor="news-body">Nyhetstext</label>
        <textarea className={`${fieldClass} resize-y`} id="news-body" name="body" rows={6} maxLength={10000} defaultValue={news?.body} required />
        <label className="mb-2 block text-sm" htmlFor="news-status">Status</label>
        <select className={fieldClass} id="news-status" name="status" defaultValue={news?.status ?? 'published'}>
          <option value="draft">Utkast</option>
          <option value="published">Publicerad</option>
        </select>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="admin-button mt-0! w-auto!" type="submit">{saving ? 'Sparar…' : 'Spara'}</button>
          <button className="min-h-12 cursor-pointer rounded border border-black/40 px-5 py-2 font-heading hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black" type="button" onClick={onCancel}>Avbryt</button>
        </div>
        </fieldset>
      </form>
    </section>
  )
}

export default NewsEditor
