import { useEffect, useState } from 'react'
import { requestJson } from './requestJson.js'

export type Series = { name: string; url: string }
type TeamInput = { name: string; series: Series[] }
export type Team = TeamInput & { id: number; version: string }

const endpoint = `${import.meta.env.VITE_API_URL}/teams`

export async function getTeams(signal?: AbortSignal): Promise<Team[]> {
  return requestJson(endpoint, { signal })
}

export function saveTeam(team: TeamInput, target: Team | string) {
  const creating = typeof target === 'string'
  return requestJson(creating ? endpoint : `${endpoint}/${target.id}`, {
    method: creating ? 'POST' : 'PUT',
    credentials: 'include',
    data: creating ? { ...team, requestId: target } : { ...team, version: target.version },
  })
}

export function deleteTeam(team: Team) {
  return requestJson(`${endpoint}/${team.id}?version=${encodeURIComponent(team.version)}`, { method: 'DELETE', credentials: 'include' })
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
