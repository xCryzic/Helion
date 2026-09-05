export type InterestInput = {
  studentName: string
  email: string
  school: string
  grade: string
  eventIds: string[]
}

export type Participant = InterestInput & {
  id: number
  submittedAt: string
}

export type ParticipantFilters = {
  search?: string
  eventId?: string
  school?: string
  grade?: string
  sort: 'newest' | 'oldest'
}

export type ParticipantList = {
  participants: Participant[]
  total: number
  overallTotal: number
  schools: string[]
  grades: string[]
}
