export type InterestSubmission = {
  studentName: string
  email: string
  school: string
  grade: string
  eventIds: string[]
}

export interface InterestSubmissionAdapter {
  submit(data: InterestSubmission): Promise<{ id: number; submittedAt: string }>
}

export class InterestSubmissionError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message)
  }
}

const apiAdapter: InterestSubmissionAdapter = {
  async submit(data) {
    const response = await fetch('/api/interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await readResponse(response)
    if (!response.ok) {
      throw new InterestSubmissionError(
        typeof body.error === 'string' ? body.error : 'Your interest could not be submitted.',
        response.status,
        typeof body.code === 'string' ? body.code : undefined,
      )
    }
    return { id: Number(body.id), submittedAt: String(body.submittedAt) }
  },
}

export function getInterestSubmissionAdapter(): InterestSubmissionAdapter {
  return apiAdapter
}

async function readResponse(response: Response): Promise<Record<string, unknown>> {
  try {
    return await response.json() as Record<string, unknown>
  } catch {
    return {}
  }
}
