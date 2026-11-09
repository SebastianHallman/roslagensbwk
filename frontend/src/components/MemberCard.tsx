import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const cardActionClass = 'min-h-11 cursor-pointer border-0 bg-transparent px-0 py-1 text-sm underline underline-offset-4 disabled:cursor-default disabled:opacity-50'

export type Member = { id: number; name: string | null; role: string; sort_order: number; is_visible: number | boolean }
type CardProps = {
  member: Member
  locked: boolean
  sortable: boolean
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

function MemberCard({ member, locked, sortable, deleting, onEdit, onDelete, onConfirmDelete, onCancelDelete }: CardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: member.id, disabled: !sortable })
  return (
    <li ref={setNodeRef} className={`relative flex min-w-0 flex-col rounded border bg-[#fff] p-5 wrap-anywhere motion-reduce:transition-none! ${isDragging ? 'z-2 border-red shadow-xl' : 'border-black/20'}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div className="flex items-center justify-between gap-2">
        <span className="admin-muted">{member.is_visible ? 'Synlig' : 'Dold'}</span>
        <button ref={setActivatorNodeRef} className="min-h-11 min-w-11 touch-none cursor-grab rounded border border-black/20 bg-transparent text-3xl leading-none active:cursor-grabbing disabled:cursor-default disabled:opacity-40" type="button" {...attributes} {...listeners} disabled={!sortable} aria-label={`Flytta ${member.name || member.role}`}><span aria-hidden="true">⠿</span></button>
      </div>
      <p className="mt-3 mb-1 font-heading text-2xl leading-tight">{member.name || 'Namn saknas'}</p>
      <p className="mb-4 text-sm text-black/70">{member.role}</p>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2">
        <button className={cardActionClass} type="button" disabled={locked} onClick={onEdit}>Redigera</button>
        <button className={cardActionClass} type="button" disabled={locked} onClick={onDelete}>Ta bort</button>
      </div>
      {deleting && (
        <div className="mt-3 border-t border-black/20 pt-3 text-sm">
          <p>Ta bort {member.name || member.role} permanent?</p>
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2">
            <button className={cardActionClass} type="button" disabled={locked} onClick={onConfirmDelete}>Ja, ta bort</button>
            <button className={cardActionClass} type="button" disabled={locked} onClick={onCancelDelete}>Avbryt</button>
          </div>
        </div>
      )}
    </li>
  )
}

export default MemberCard
