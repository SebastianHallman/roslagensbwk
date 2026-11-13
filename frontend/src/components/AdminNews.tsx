import { useEffect, useRef, useState } from 'react'
import { createNews, deleteNews, fetchAdminNews, updateNews } from '../api/api.js'
import type { ApiNews } from '../types/news'
import { formatClubDate } from '../utils/date'
import NewsEditor, { type EditableNews } from './NewsEditor'
import NewsPreview from './NewsPreview'
import ConfirmDialog from './ConfirmDialog'

const actionClass = 'min-h-11 cursor-pointer rounded border border-black/30 px-3 py-2 text-sm hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

type Props = { onSessionExpired: () => void }

function AdminNews({ onSessionExpired }: Props) {
  const [news, setNews] = useState<EditableNews[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reload, setReload] = useState(0)
  const [filter, setFilter] = useState('all')
  const [editor, setEditor] = useState<EditableNews | 'new' | null>(null)
  const [preview, setPreview] = useState<EditableNews | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EditableNews | null>(null)
  const [deleting, setDeleting] = useState(false)
  const savingRef = useRef(false)
  const addButton = useRef<HTMLButtonElement>(null)
  const editTrigger = useRef<HTMLButtonElement | null>(null)
  const deleteTrigger = useRef<HTMLButtonElement | null>(null)
  const visibleItems = news.filter((news) => filter === 'all' || news.status === filter).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  useEffect(() => {
    const controller = new AbortController()
    fetchAdminNews(controller.signal).then((data: ApiNews[]) => {
      if (controller.signal.aborted) return
      setNews(data.map((news) => ({ ...news, id: String(news.id) })))
      setLoadState('ready')
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return
      const status = failure instanceof Error && 'status' in failure ? failure.status : undefined
      if (status === 401 || status === 403) {
        onSessionExpired()
        return
      }
      setLoadState('error')
    })
    return () => controller.abort()
  }, [reload, onSessionExpired])

  function closeEditor() {
    setError('')
    setEditor(null)
    requestAnimationFrame(() => {
      if (editTrigger.current?.isConnected) editTrigger.current.focus()
      else addButton.current?.focus()
    })
  }

  async function save(news: EditableNews) {
    if (savingRef.current || editor === null) return
    setError('')
    setNotice('')
    savingRef.current = true
    setSaving(true)
    try {
      const { title, body, status } = news
      const payload = { title, body, status }
      const { id } = editor === 'new'
        ? await createNews(payload)
        : await updateNews(editor.id, payload)
      setNews((current) => [...current.filter((item) => item.id !== String(id)), { ...news, id: String(id) }])
      setFilter('all')
      setNotice('Sparat.')
      closeEditor()
      setReload((current) => current + 1)
    } catch (failure: unknown) {
      const status = failure instanceof Error && 'status' in failure ? failure.status : undefined
      if (status === 401 || status === 403) {
        onSessionExpired()
        return
      }
      const code = failure instanceof Error && 'code' in failure ? failure.code : undefined
      setError(code === 'INVALID_NEWS' && failure instanceof Error
        ? failure.message
        : 'Kunde inte spara nyheten. Försök igen.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  function closeDeleteDialog() {
    setDeleteTarget(null)
    requestAnimationFrame(() => {
      if (deleteTrigger.current?.isConnected) deleteTrigger.current.focus()
      else addButton.current?.focus()
    })
  }

  async function remove(item: EditableNews) {
    if (savingRef.current || editor !== null || loadState !== 'ready') return
    savingRef.current = true
    setDeleting(true)
    setError('')
    setNotice('')
    setPreview(null)
    try {
      await deleteNews(item.id)
      setNews((current) => current.filter((news) => news.id !== item.id))
      setNotice(`${item.title} har tagits bort.`)
      setReload((current) => current + 1)
    } catch (failure: unknown) {
      const status = failure instanceof Error && 'status' in failure ? failure.status : undefined
      if (status === 401 || status === 403) {
        onSessionExpired()
        return
      }
      setError(status === 404
        ? 'Nyheten finns inte längre. Ladda om sidan för att uppdatera listan.'
        : 'Borttagningen kunde inte bekräftas. Ladda om sidan för att kontrollera om nyheten finns kvar innan du försöker igen.')
    } finally {
      savingRef.current = false
      setDeleting(false)
      closeDeleteDialog()
    }
  }

  if (loadState === 'loading') return <p role="status" className="mt-6 text-sm">Hämtar nyheter…</p>
  if (loadState === 'error') return (
    <div className="mt-6">
      <p role="alert">Kunde inte hämta nyheter. Försök igen.</p>
      <button type="button" className={`${actionClass} mt-4`} onClick={() => { setLoadState('loading'); setReload((current) => current + 1) }}>Försök igen</button>
    </div>
  )

  return (
    <div className="min-w-0 max-w-full wrap-anywhere">
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">{news.length} nyheter · {news.filter((news) => news.status === 'draft').length} utkast</p>
        <button ref={addButton} className="admin-button mt-0! w-auto!" disabled={editor !== null || deleting} onClick={() => { editTrigger.current = null; setEditor('new'); setNotice(''); setError('') }}>+ Ny nyhet</button>
      </div>
      {notice && <p role="status" className="admin-notice mt-5">{notice}</p>}
      {error && <p role="alert" className="admin-notice mt-5">{error}</p>}
      {editor !== null && <NewsEditor key={editor === 'new' ? 'new' : editor.id} news={editor === 'new' ? null : editor} saving={saving} onSave={save} onCancel={closeEditor} />}
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrera nyheter">
        {[{ value: 'all', label: 'Alla' }, { value: 'published', label: 'Publicerade' }, { value: 'draft', label: 'Utkast' }].map((option) => (
          <button key={option.value} type="button" className={`${actionClass} ${filter === option.value ? 'bg-black text-white' : ''}`} aria-pressed={filter === option.value} disabled={editor !== null || deleting} onClick={() => setFilter(option.value)}>{option.label}</button>
        ))}
      </div>
      <ul className="mt-5 grid min-w-0 max-w-full list-none gap-4 p-0" aria-label="Nyheter">
        {visibleItems.map((news) => (
          <li key={news.id} className="min-w-0 max-w-full rounded-lg border border-black/20 bg-[#fff] p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              {news.date
                ? <time dateTime={news.date} className="text-sm text-black/70">{formatClubDate(news.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                : <span className="text-sm text-black/70">Inte publicerad ännu</span>}
              <span className={`rounded px-3 py-1 text-xs ${news.status === 'draft' ? 'border border-black/25' : 'bg-black text-white'}`}>{news.status === 'draft' ? 'Utkast' : 'Publicerad'}</span>
            </div>
            <h3 className="font-heading text-2xl leading-tight">{news.title}</h3>
            <p className="mt-3 max-w-prose text-sm text-black/70">{news.body.length > 180 ? news.body.slice(0, 180).trimEnd() + '…' : news.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={actionClass} disabled={editor !== null || deleting} onClick={(click) => { editTrigger.current = click.currentTarget; setEditor(news); setNotice(''); setError('') }}>Redigera<span className="sr-only"> {news.title}</span></button>
              <button className={actionClass} disabled={deleting} aria-haspopup="dialog" onClick={() => setPreview(news)}>Förhandsvisa<span className="sr-only"> {news.title}</span></button>
              <button className={actionClass} disabled={editor !== null || deleting} aria-haspopup="dialog" onClick={(click) => { deleteTrigger.current = click.currentTarget; setDeleteTarget(news) }}>Ta bort<span className="sr-only"> {news.title}</span></button>
            </div>
          </li>
        ))}
      </ul>
      {visibleItems.length === 0 && <p className="mt-6 text-sm">Inga nyheter med den här statusen.</p>}
      <NewsPreview news={preview} onClose={() => setPreview(null)} />
      {deleteTarget && (
        <ConfirmDialog
          title="Ta bort nyhet?"
          message={`Vill du ta bort ”${deleteTarget.title}”? Detta går inte att ångra.`}
          confirmLabel="Ja, ta bort"
          pending={deleting}
          onConfirm={() => void remove(deleteTarget)}
          onCancel={closeDeleteDialog}
        />
      )}
    </div>
  )
}

export default AdminNews
