import { useEffect, useState } from 'react'
import { requestJson } from './requestJson.js'

type SponsorInput = { name: string; image?: string | null }
export type Sponsor = { id: number; name: string; image: string | null; version: string }

const endpoint = `${import.meta.env.VITE_API_URL}/sponsors`

export async function getSponsors(signal?: AbortSignal): Promise<Sponsor[]> {
  const rows: { id: number; name: string; hasImage: number; version: string }[] = await requestJson(endpoint, { signal })
  return rows.map(({ id, name, hasImage, version }) => ({
    id,
    name,
    version,
    image: hasImage ? `${endpoint}/${id}/image?v=${version}` : null,
  }))
}

export function saveSponsor(sponsor: SponsorInput, target: Sponsor | string) {
  const creating = typeof target === 'string'
  return requestJson(creating ? endpoint : `${endpoint}/${target.id}`, {
    method: creating ? 'POST' : 'PUT',
    credentials: 'include',
    data: creating ? { ...sponsor, requestId: target } : { ...sponsor, version: target.version },
  })
}

export function deleteSponsor(sponsor: Sponsor) {
  return requestJson(`${endpoint}/${sponsor.id}?version=${encodeURIComponent(sponsor.version)}`, { method: 'DELETE', credentials: 'include' })
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
