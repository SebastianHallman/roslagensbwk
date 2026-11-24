import { useState } from 'react'
import type { FormEvent } from 'react'
import { deleteSponsor, getSponsors, saveSponsor } from '../api/sponsors'
import type { Sponsor } from '../api/sponsors'
import { getApiErrorDetails } from '../api/errors'
import ConfirmDialog from './ConfirmDialog'
import { useAdminList } from './useAdminList'

const maxImageBytes = 512 * 1024

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const actionClass = 'min-h-11 cursor-pointer rounded border border-black/30 px-3 py-2 text-sm hover:enabled:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-default disabled:opacity-50'

function AdminSponsors({ onSessionExpired }: { onSessionExpired: () => void }) {
  const { entries, loadFailed, reloadList, focusTarget, focusNew } = useAdminList(getSponsors)
  const [editor, setEditor] = useState<Sponsor | 'new' | null>(null)
  const editing = editor === 'new' ? null : editor
  const [removeLogo, setRemoveLogo] = useState(false)
  const [removing, setRemoving] = useState<Sponsor | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function select(entry: Sponsor | 'new' | null) {
    setEditor(entry)
    setRemoveLogo(false)
    setError('')
    setNotice('')
  }

  function handleFailure(failure: unknown) {
    const { status } = getApiErrorDetails(failure)
    if (status === 401 || status === 403) onSessionExpired()
    else if (status === 404) {
      select(null)
      setError('Sponsorn finns inte längre.')
      reloadList()
    } else if (editor === 'new' && (status === undefined || status === 408 || status >= 500)) {
      select(null)
      setError('Det gick inte att bekräfta om sponsorn skapades. Kontrollera listan innan du lägger till sponsorn igen.')
      reloadList()
    } else setError(status === 400 || status === 413
      ? 'Kontrollera sponsorns namn och logotyp.'
      : 'Ändringen kunde inte sparas. Försök igen.')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name')).trim()
    setError('')
    setNotice('')
    if (!name) {
      setError('Fyll i sponsorns namn.')
      return
    }
    setPending(true)
    try {
      const file = fields.get('image')
      let image: string | null | undefined
      if (removeLogo) {
        image = null
      } else if (file instanceof File && file.name) {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > maxImageBytes) {
          setError('Välj en PNG-, JPG- eller WebP-bild på högst 512 kB.')
          return
        }
        try {
          image = await readImage(file)
        } catch {
          setError('Det gick inte att läsa logotypen. Välj filen igen.')
          return
        }
      }
      const saved = await saveSponsor({ name, image }, editing?.id)
      select(null)
      setNotice('Ändringen sparades.')
      reloadList(saved.id)
    } catch (failure) {
      handleFailure(failure)
    } finally {
      setPending(false)
    }
  }

  async function remove(entry: Sponsor) {
    setPending(true)
    setError('')
    setNotice('')
    try {
      await deleteSponsor(entry.id)
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
    if (!loadFailed) return <p role="status" className="mt-6 text-sm">Hämtar sponsorer…</p>
    return (
      <div className="mt-6">
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
        <p role="alert">Det gick inte att hämta listan.</p>
        <button type="button" className={actionClass + ' mt-4'} autoFocus={focusTarget !== null} onClick={() => reloadList(focusTarget ?? 'new')}>Försök igen</button>
      </div>
    )
  }

  return (
    <div className="min-w-0 max-w-full wrap-anywhere">
      <fieldset className="min-w-0 border-0 p-0" disabled={pending}>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm">{entries.length} {entries.length === 1 ? 'sponsor' : 'sponsorer'}</p>
          <button type="button" className="admin-button mt-0! w-auto!" autoFocus={focusNew} disabled={editor !== null} onClick={() => select('new')}>+ Ny sponsor</button>
        </div>
        {notice && <p role="status" className="admin-notice mt-5">{notice}</p>}
        {error && <p role="alert" className="admin-error mt-5">{error}</p>}

        {editor !== null && (
          <form className="admin-form min-w-0 rounded-lg border border-black/20 border-t-4 border-t-red bg-warm-white p-5 min-[40rem]:p-7" aria-labelledby="sponsor-editor-heading" onSubmit={submit}>
            <h3 id="sponsor-editor-heading" className="mb-6 font-heading text-2xl">{editing ? `Redigera ${editing.name}` : 'Ny sponsor'}</h3>
            <label>Namn<input name="name" autoFocus required maxLength={150} defaultValue={editing?.name} /></label>
            {editing?.image && (
              <>
                <img src={editing.image} alt={`Nuvarande bild för ${editing.name}`} className="mb-3 h-20 w-auto max-w-full object-contain" />
                <label className="flex! items-center gap-3">
                  <input type="checkbox" className="m-0! min-h-0! w-auto!" checked={removeLogo} onChange={(event) => setRemoveLogo(event.target.checked)} />
                  Ta bort logotyp
                </label>
              </>
            )}
            <label>Logotyp (valfri, högst 512 kB och 16 megapixlar)
              <input type="file" name="image" accept="image/png,image/jpeg,image/webp" disabled={removeLogo} />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="admin-button mt-0! w-auto!" type="submit">{pending ? 'Sparar…' : 'Spara'}</button>
              <button type="button" className={actionClass} onClick={() => select(null)}>Avbryt</button>
            </div>
          </form>
        )}

        {entries.length === 0 ? <p className="mt-6 text-sm">Inga sponsorer ännu.</p> : (
          <ul className="mt-5 grid min-w-0 list-none gap-4 p-0" aria-label="Sponsorer">
            {entries.map((entry) => (
              <li key={entry.id} className="min-w-0 rounded-lg border border-black/20 bg-[#fff] p-5">
                <h3 className="font-heading text-2xl leading-tight">{entry.name}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className={actionClass} autoFocus={focusTarget === entry.id} disabled={editor !== null} onClick={() => select(entry)} aria-label={`Redigera ${entry.name}`}>Redigera</button>
                  <button type="button" className={actionClass} disabled={editor !== null} aria-haspopup="dialog" onClick={() => setRemoving(entry)} aria-label={`Ta bort ${entry.name}`}>Ta bort</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
      {removing && (
        <ConfirmDialog title="Ta bort sponsor?" message={`Vill du ta bort ${removing.name} från webbplatsen?`}
          confirmLabel="Ta bort" pending={pending} onCancel={() => setRemoving(null)} onConfirm={() => void remove(removing)} />
      )}
    </div>
  )
}

export default AdminSponsors
