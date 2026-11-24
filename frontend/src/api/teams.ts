import { useEffect, useState } from 'react'
import { requestJson } from './requestJson.js'

export type Series = { name: string; url: string }
type TeamInput = { name: string; series: Series[] }
export type Team = TeamInput & { id: number }

const endpoint = `${import.meta.env.VITE_API_URL}/teams`

export async function getTeams(signal?: AbortSignal): Promise<Team[]> {
  const rows: Team[] = await requestJson(endpoint, { signal })
  return rows.map(({ id, name, series }) => ({ id, name, series }))
}

export function saveTeam(team: TeamInput, id?: number) {
  return requestJson(id === undefined ? endpoint : `${endpoint}/${id}`, {
    method: id === undefined ? 'POST' : 'PUT',
    credentials: 'include',
    data: team,
  })
}

export function deleteTeam(id: number) {
  return requestJson(`${endpoint}/${id}`, { method: 'DELETE', credentials: 'include' })
}

export function useTeams(fallback: Team[]) {
  const [teams, setTeams] = useState(fallback)

  useEffect(() => {
    const controller = new AbortController()
    getTeams(controller.signal)
      .then((rows) => { if (!controller.signal.aborted) setTeams(rows) })
      .catch(() => { if (!controller.signal.aborted) setTeams(fallback) })
    return () => controller.abort()
  }, [fallback])

  return teams
}
