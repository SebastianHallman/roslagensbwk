import { useEffect, useId, useRef } from 'react'

type Props = {
  title: string
  message: string
  confirmLabel?: string
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({ title, message, confirmLabel = 'Bekräfta', pending = false, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    cancelRef.current?.focus()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      aria-busy={pending}
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onCancel()
      }}
      className="fixed inset-0 m-auto max-h-[calc(100svh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-lg border-0 border-t-4 border-red bg-warm-white p-5 text-black shadow-xl [color-scheme:light] backdrop:bg-black/75 min-[40rem]:p-8"
    >
      <h2 id={titleId} className="font-heading text-2xl wrap-break-word">{title}</h2>
      <p id={messageId} className="mt-3 text-sm wrap-break-word">{message}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          ref={cancelRef}
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="min-h-11 cursor-pointer rounded border border-black/30 px-4 py-2 text-sm hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-default disabled:opacity-50"
        >
          Avbryt
        </button>
        <button type="button" disabled={pending} onClick={onConfirm} className="admin-button mt-0! w-auto!">
          {pending ? 'Vänta…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
