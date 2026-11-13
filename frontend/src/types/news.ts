export type ClubNews = {
  id: string
  date: string | null
  title: string
  body: string
  updated?: string
}

export type ApiNews = Omit<ClubNews, 'id' | 'updated'> & {
  id: number
  status: 'draft' | 'published'
  updated: string
}
