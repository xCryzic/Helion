export type AdminParticipant = {
  id: number
  submittedAt: string
  studentName: string
  email: string
  school: string
  grade: string
  eventIds: string[]
}

export type AdminFilters = {
  search: string
  event: string
  school: string
  grade: string
  sort: 'newest' | 'oldest'
}

export type ParticipantResponse = {
  participants: AdminParticipant[]
  total: number
  overallTotal: number
  schools: string[]
  grades: string[]
}

export class AdminApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export async function getAdminSession(): Promise<boolean> {
  const response = await request('/api/admin/session')
  return response.authenticated === true
}

export async function loginAdmin(password: string): Promise<void> {
  await request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export async function logoutAdmin(): Promise<void> {
  await request('/api/admin/logout', { method: 'POST' }, true)
}

export async function getParticipants(filters: AdminFilters, signal?: AbortSignal): Promise<ParticipantResponse> {
  return await request(`/api/admin/participants?${filterParameters(filters)}`, { signal }) as ParticipantResponse
}

export function getExportUrl(filters: AdminFilters): string {
  return `/api/admin/export?${filterParameters(filters)}`
}

function filterParameters(filters: AdminFilters): URLSearchParams {
  const parameters = new URLSearchParams()
  if (filters.search) parameters.set('search', filters.search)
  if (filters.event) parameters.set('event', filters.event)
  if (filters.school) parameters.set('school', filters.school)
  if (filters.grade) parameters.set('grade', filters.grade)
  parameters.set('sort', filters.sort)
  return parameters
}

async function request(path: string, init?: RequestInit, allowEmpty = false): Promise<Record<string, unknown>> {
  const response = await fetch(path, { ...init, credentials: 'same-origin' })
  if (allowEmpty && response.status === 204) return {}
  let body: Record<string, unknown> = {}
  try {
    body = await response.json() as Record<string, unknown>
  } catch {
    // A generic error below handles non-JSON server responses.
  }
  if (!response.ok) {
    throw new AdminApiError(typeof body.error === 'string' ? body.error : 'The admin request failed.', response.status)
  }
  return body
}
