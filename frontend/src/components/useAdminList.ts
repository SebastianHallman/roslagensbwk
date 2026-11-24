import { useEffect, useState } from 'react'

export function newDraftId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function useAdminList<T extends { id: number }>(load: (signal: AbortSignal) => Promise<T[]>) {
  const [entries, setEntries] = useState<T[] | null>(null)
  const [loadVersion, setLoadVersion] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)
  const [focusTarget, setFocusTarget] = useState<number | 'new' | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
      .then((rows) => { if (!controller.signal.aborted) setEntries(rows) })
      .catch(() => { if (!controller.signal.aborted) setLoadFailed(true) })
    return () => controller.abort()
  }, [load, loadVersion])

  function reloadList(target: number | 'new' = 'new') {
    setFocusTarget(target)
    setEntries(null)
    setLoadFailed(false)
    setLoadVersion((value) => value + 1)
  }

  const focusNew = focusTarget !== null && !entries?.some((entry) => entry.id === focusTarget)
  return { entries, loadFailed, reloadList, focusTarget, focusNew }
}
