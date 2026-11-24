import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { deleteTeam, getTeams, saveTeam } from '../api/teams'
import type { Team, Series } from '../api/teams'
import { getApiErrorDetails } from '../api/errors'
import ConfirmDialog from './ConfirmDialog'

const actionClass = 'min-h-11 cursor-pointer rounded border border-black/30 px-3 py-2 text-sm hover:enabled:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-default disabled:opacity-50'

function AdminTeams({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [entries, setEntries] = useState<Team[] | null>(null)
  const [editor, setEditor] = useState<Team | 'new' | null>(null)
  const editing = editor === 'new' ? null : editor
  const [removing, setRemoving] = useState<Team | null>(null)
  const [series, setSeries] = useState<Series[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loadVersion, setLoadVersion] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getTeams(controller.signal)
      .then((rows) => { if (!controller.signal.aborted) setEntries(rows) })
      .catch(() => {
        if (!controller.signal.aborted) setLoadFailed(true)
      })
    return () => controller.abort()
  }, [loadVersion])

  function reloadList() {
    setEntries(null)
    setLoadFailed(false)
    setLoadVersion((value) => value + 1)
  }

  function select(entry: Team | 'new' | null) {
    setEditor(entry)
    setSeries(entry && entry !== 'new' ? entry.series : [])
    setError('')
    setNotice('')
  }

  function handleFailure(failure: unknown) {
    const { status } = getApiErrorDetails(failure)
    if (status === 401 || status === 403) onSessionExpired()
    else if (status === 404) {
      select(null)
      setError('Laget finns inte längre.')
      reloadList()
    } else setError(status === 400 || status === 413
      ? 'Kontrollera lagnamn och serielänkar.'
      : 'Ändringen kunde inte sparas. Försök igen.')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name')).trim()
    setError('')
    setNotice('')
    if (!name || series.some((entry) => !entry.name.trim())) {
      setError('Fyll i lagnamn och namn för varje serie.')
      return
    }
    setPending(true)
    try {
      await saveTeam({
        name,
        series: series.map((entry) => ({ name: entry.name.trim(), url: entry.url.trim() })),
      }, editing?.id)
      select(null)
      setNotice('Ändringen sparades.')
      reloadList()
    } catch (failure) {
      handleFailure(failure)
    } finally {
      setPending(false)
    }
  }

  async function remove(entry: Team) {
    setPending(true)
    setError('')
    setNotice('')
    try {
      await deleteTeam(entry.id)
      setRemoving(null)
      setNotice('Posten togs bort.')
      reloadList()
    } catch (failure) {
      setRemoving(null)
      handleFailure(failure)
    } finally {
      setPending(false)
    }
  }

  if (entries === null) {
    if (!loadFailed) return <p role="status" className="mt-6 text-sm">Hämtar lag…</p>
    return (
      <div className="mt-6">
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
        <p role="alert">Det gick inte att hämta listan.</p>
        <button type="button" className={actionClass + ' mt-4'} onClick={reloadList}>Försök igen</button>
      </div>
    )
  }

  return (
    <div className="min-w-0 max-w-full wrap-anywhere">
      <fieldset className="min-w-0 border-0 p-0" disabled={pending}>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm">{entries.length} lag</p>
          <button type="button" className="admin-button mt-0! w-auto!" disabled={editor !== null} onClick={() => select('new')}>+ Nytt lag</button>
        </div>
        {notice && <p role="status" className="admin-notice mt-5">{notice}</p>}
        {error && <p role="alert" className="admin-error mt-5">{error}</p>}

        {editor !== null && (
          <form className="admin-form min-w-0 rounded-lg border border-black/20 border-t-4 border-t-red bg-warm-white p-5 min-[40rem]:p-7" aria-labelledby="team-editor-heading" onSubmit={submit}>
            <h3 id="team-editor-heading" className="mb-6 font-heading text-2xl">{editing ? `Redigera ${editing.name}` : 'Nytt lag'}</h3>
            <label>Namn<input name="name" autoFocus required maxLength={150} defaultValue={editing?.name} /></label>
            <fieldset className="grid min-w-0 gap-3 border-0 p-0">
              <legend>Serier</legend>
              {series.map((entry, index) => (
                <fieldset key={index} className="grid min-w-0 gap-2 rounded border border-current/25 p-3">
                  <legend>Serie {index + 1}</legend>
                  <label>Serienamn<input required maxLength={150} value={entry.name} onChange={(event) => {
                    setSeries(series.map((item, position) => position === index ? { ...item, name: event.target.value } : item))
                  }} /></label>
                  <label>Resultatlänk (valfri)<input type="text" inputMode="url" placeholder="exempel.se/resultat" maxLength={2048} value={entry.url} onChange={(event) => {
                    setSeries(series.map((item, position) => position === index ? { ...item, url: event.target.value } : item))
                  }} /></label>
                  <button type="button" className={actionClass + ' w-fit'} onClick={() => setSeries(series.filter((_, position) => position !== index))}>Ta bort serie {index + 1}</button>
                </fieldset>
              ))}
              <button type="button" className={actionClass + ' w-fit'} disabled={series.length >= 20} onClick={() => setSeries([...series, { name: '', url: '' }])}>Lägg till serie</button>
            </fieldset>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="admin-button mt-0! w-auto!" type="submit">{pending ? 'Sparar…' : 'Spara'}</button>
              <button type="button" className={actionClass} onClick={() => select(null)}>Avbryt</button>
            </div>
          </form>
        )}

        {entries.length === 0 ? <p className="mt-6 text-sm">Inga lag ännu.</p> : (
          <ul className="mt-5 grid min-w-0 list-none gap-4 p-0" aria-label="Lag">
            {entries.map((entry) => (
              <li key={entry.id} className="min-w-0 rounded-lg border border-black/20 bg-[#fff] p-5">
                <h3 className="font-heading text-2xl leading-tight">{entry.name}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className={actionClass} disabled={editor !== null} onClick={() => select(entry)} aria-label={`Redigera ${entry.name}`}>Redigera</button>
                  <button type="button" className={actionClass} disabled={editor !== null} aria-haspopup="dialog" onClick={() => setRemoving(entry)} aria-label={`Ta bort ${entry.name}`}>Ta bort</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
      {removing && (
        <ConfirmDialog title="Ta bort lag?" message={`Vill du ta bort ${removing.name} från webbplatsen?`}
          confirmLabel="Ta bort" pending={pending} onCancel={() => setRemoving(null)} onConfirm={() => void remove(removing)} />
      )}
    </div>
  )
}

export default AdminTeams
