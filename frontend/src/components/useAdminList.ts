import { useEffect, useRef, useState } from 'react'

export function newDraftId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function useAdminList<T extends { id: number }>(load: (signal: AbortSignal) => Promise<T[]>) {
  const [entries, setEntries] = useState<T[] | null>(null)
  const [loadVersion, setLoadVersion] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)
  const [focusTarget, setFocusTarget] = useState<number | 'new' | null>(null)
  const confirmation = useRef<{ id: number; onResult: (found: boolean) => void } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return
        const check = confirmation.current
        confirmation.current = null
        if (check) check.onResult(rows.some((entry) => entry.id === check.id))
        setEntries(rows)
      })
      .catch(() => { if (!controller.signal.aborted) setLoadFailed(true) })
    return () => controller.abort()
  }, [load, loadVersion])

  function reloadList(target: number | 'new' = 'new') {
    setFocusTarget(target)
    setEntries(null)
    setLoadFailed(false)
    setLoadVersion((value) => value + 1)
  }

  function confirmCreation(id: number, onResult: (found: boolean) => void) {
    confirmation.current = { id, onResult }
    reloadList(id)
  }

  const focusNew = focusTarget !== null && !entries?.some((entry) => entry.id === focusTarget)
  return { entries, loadFailed, reloadList, confirmCreation, focusTarget, focusNew }
}
