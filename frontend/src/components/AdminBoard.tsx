import MemberCard from './MemberCard'
import type { Member } from './MemberCard'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { fetchAdminBoardMembers, addBoardMember, updateBoardMember, deleteBoardMember, reorderBoardMembers } from '../api/api.js'

type Props = { disabled: boolean; onSessionExpired: () => void }
function AdminBoard({ disabled, onSessionExpired }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reload, setReload] = useState(0)
  const [busy, setBusy] = useState(false)
  const [editor, setEditor] = useState<Member | 'new' | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const nameInput = useRef<HTMLInputElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchAdminBoardMembers(controller.signal).then((data: Member[]) => {
      if (!controller.signal.aborted) {
        setMembers([...data].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id))
        setNeedsRefresh(false)
      }
    }).catch((failure) => {
      if (controller.signal.aborted) return
      if (failure.status === 401 || failure.status === 403) onSessionExpired()
      else setLoadError(true)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [reload, onSessionExpired])

  useEffect(() => {
    if (editor) nameInput.current?.focus()
  }, [editor])

  function refresh() {
    setLoadError(false)
    setLoading(true)
    setEditor(null)
    setDeleting(null)
    setError('')
    setNotice('')
    setReload((value) => value + 1)
  }

  function showError(failure: unknown) {
    const status = failure instanceof Error && 'status' in failure ? failure.status : undefined
    if (status === 401 || status === 403) { onSessionExpired(); return }
    setError(status === 409 || status === 404
      ? 'Styrelsen har ändrats. Hämta styrelsen igen innan du fortsätter.'
      : status === 400 ? 'Kontrollera namn och roll.'
        : 'Ändringen kunde inte bekräftas. Hämta styrelsen igen för att kontrollera resultatet.')
    if (status !== 400) setNeedsRefresh(true)
  }

  const locked = busy || disabled || needsRefresh || loading
  const editing = editor && editor !== 'new' ? editor : null

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked) return
    const fields = new FormData(event.currentTarget)
    const member = {
      name: String(fields.get('name')).trim(),
      role: String(fields.get('role')).trim(),
      sortOrder: editing ? editing.sort_order : Math.max(-1, ...members.map((item) => item.sort_order)) + 1,
      isVisible: editing ? fields.get('isVisible') === 'on' : true
    }
    if (!member.name || !member.role) { setError('Namn och roll får inte vara tomma.'); return }
    if (member.sortOrder > 4294967295) { setError('Flytta ett kort för att återställa sorteringsordningen innan du lägger till fler.'); return }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = editing ? await updateBoardMember(editing.id, member) : await addBoardMember(member)
      const saved = { id: editing ? editing.id : result.id, name: member.name, role: member.role, sort_order: member.sortOrder, is_visible: member.isVisible }
      setMembers((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id))
      setNotice(editing ? 'Styrelsemedlemmen har uppdaterats.' : 'Styrelsemedlemmen har lagts till.')
      setEditor(null)
    } catch (failure) { showError(failure) }
    finally { setBusy(false) }
  }

  async function handleDelete(member: Member) {
    if (locked) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await deleteBoardMember(member.id)
      setMembers((current) => current.filter((item) => item.id !== member.id))
      if (editing?.id === member.id) setEditor(null)
      setDeleting(null)
      setNotice('Styrelsemedlemmen har tagits bort.')
    } catch (failure) { showError(failure) }
    finally { setBusy(false) }
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (locked || editor || deleting !== null || !over || active.id === over.id) return
    const from = members.findIndex((member) => member.id === active.id)
    const to = members.findIndex((member) => member.id === over.id)
    if (from < 0 || to < 0) return
    const previous = members
    const reordered = arrayMove(members, from, to).map((member, index) => ({ ...member, sort_order: index }))
    setMembers(reordered)
    setBusy(true)
    setError('')
    setNotice('Sparar ordningen…')
    try {
      await reorderBoardMembers(reordered.map((member) => member.id))
      setNotice('Ordningen har sparats.')
    } catch (failure) {
      setMembers(previous)
      setNotice('')
      setNeedsRefresh(true)
      showError(failure)
    } finally { setBusy(false) }
  }

  return (
    <section className="admin-tool" aria-labelledby="board-heading" aria-busy={loading || busy}>
      <h3 id="board-heading">Styrelsen</h3>
      <p className="admin-muted" id="board-drag-help">Lägg till eller ändra ordning på styrelsen på framsidan</p>
      {loading ? <p role="status">Hämtar styrelsen…</p> : loadError ? (
        <><p className="admin-error" role="alert">Det gick inte att hämta styrelsen.</p><button className="admin-button" disabled={busy || disabled} onClick={refresh}>Försök igen</button></>
      ) : (
        <>
          {error && <p className="admin-error" role="alert">{error}</p>}
          {notice && <p className="admin-notice" role="status">{notice}</p>}
          {needsRefresh && <button className="admin-button" disabled={busy || disabled} onClick={refresh}>Hämta styrelsen igen</button>}
          {editor && (
            <div className="mt-6 rounded border border-black/20 border-t-3 border-t-red bg-[#fff] p-6">
              <h4 className="font-heading text-xl" id="member-form-heading">{editing ? 'Redigera styrelsemedlem' : 'Ny styrelsemedlem'}</h4>
              <form key={editing?.id ?? 'new'} className="admin-form" onSubmit={handleSave} aria-labelledby="member-form-heading">
                <label htmlFor="board-name">Namn</label>
                <input ref={nameInput} id="board-name" name="name" defaultValue={editing?.name ?? ''} maxLength={150} required readOnly={locked} />
                <label htmlFor="board-role">Roll</label>
                <input id="board-role" name="role" defaultValue={editing?.role ?? ''} maxLength={100} required readOnly={locked} />
                {editing && <label className="flex items-center gap-3" htmlFor="board-visible"><input className="m-0! min-h-0! w-auto!" id="board-visible" name="isVisible" type="checkbox" defaultChecked={Boolean(editing.is_visible)} disabled={locked} />Visa på klubbens webbplats</label>}
                <button className="admin-button" type="submit" disabled={locked}>{busy ? 'Sparar…' : editing ? 'Spara ändringar' : 'Lägg till'}</button>
                <button className="admin-button" type="button" disabled={busy || disabled} onClick={() => { setEditor(null); setError(''); addButton.current?.focus() }}>Avbryt</button>
              </form>
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} accessibility={{ screenReaderInstructions: { draggable: 'Tryck mellanslag för att lyfta kortet. Använd piltangenterna för att flytta. Tryck mellanslag igen för att släppa eller Escape för att avbryta.' } }}>
            <SortableContext items={members.map((member) => member.id)} strategy={rectSortingStrategy}>
              <ul className="mt-6 grid list-none grid-cols-2 gap-4 p-0 max-[35rem]:grid-cols-1" aria-describedby="board-drag-help">
                {members.map((member) => <MemberCard key={member.id} member={member} locked={locked} sortable={!locked && !editor && deleting === null} deleting={deleting === member.id}
                  onEdit={() => { setEditor(member); setDeleting(null); setError(''); setNotice('') }}
                  onDelete={() => { setDeleting(member.id); setEditor(null) }}
                  onConfirmDelete={() => handleDelete(member)} onCancelDelete={() => setDeleting(null)} />)}
                <li className="flex min-h-48"><button ref={addButton} className="min-h-full w-full cursor-pointer rounded border-2 border-dashed border-black/35 bg-transparent text-6xl text-red hover:enabled:border-red hover:enabled:bg-red/5 disabled:cursor-default disabled:opacity-40" type="button" disabled={locked || Boolean(editor)} onClick={() => { setEditor('new'); setDeleting(null); setError(''); setNotice('') }} aria-label="Lägg till styrelsemedlem"><span aria-hidden="true">+</span></button></li>
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}
    </section>
  )
}

export default AdminBoard
