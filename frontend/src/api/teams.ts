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

type TeamList = { status: 'loading' | 'ready' | 'error'; teams: Team[] }

export function useTeams() {
  const [list, setList] = useState<TeamList>({ status: 'loading', teams: [] })

  useEffect(() => {
    const controller = new AbortController()
    getTeams(controller.signal)
      .then((teams) => {
        if (!controller.signal.aborted) setList({ status: 'ready', teams })
      })
      .catch(() => {
        if (!controller.signal.aborted) setList({ status: 'error', teams: [] })
      })
    return () => controller.abort()
  }, [])

  return list
}
