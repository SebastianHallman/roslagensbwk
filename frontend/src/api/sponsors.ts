import { useEffect, useState } from 'react'
import { requestJson } from './requestJson.js'

type SponsorInput = { name: string; image?: string | null }
export type Sponsor = { id: number; name: string; image: string | null }

const endpoint = `${import.meta.env.VITE_API_URL}/sponsors`

export async function getSponsors(signal?: AbortSignal): Promise<Sponsor[]> {
  const rows: { id: number; name: string; hasImage: number }[] = await requestJson(endpoint, { signal })
  return rows.map(({ id, name, hasImage }) => ({
    id,
    name,
    image: hasImage ? `${endpoint}/${id}/image` : null,
  }))
}

export function saveSponsor(sponsor: SponsorInput, id?: number) {
  return requestJson(id === undefined ? endpoint : `${endpoint}/${id}`, {
    method: id === undefined ? 'POST' : 'PUT',
    credentials: 'include',
    data: sponsor,
  })
}

export function deleteSponsor(id: number) {
  return requestJson(`${endpoint}/${id}`, { method: 'DELETE', credentials: 'include' })
}

export function useSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])

  useEffect(() => {
    const controller = new AbortController()
    getSponsors(controller.signal)
      .then((rows) => { if (!controller.signal.aborted) setSponsors(rows) })
      .catch(() => { if (!controller.signal.aborted) setSponsors([]) })
    return () => controller.abort()
  }, [])

  return sponsors
}
