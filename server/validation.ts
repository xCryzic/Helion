import { eventIds } from '../shared/events.js'
import type { InterestInput } from './types.js'

export type ValidationResult =
  | { ok: true; value: InterestInput }
  | { ok: false; errors: Record<string, string> }

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.trim().replace(/\s+/g, ' ')
  if (!cleaned || cleaned.length > maxLength) return null
  return cleaned
}

export function validateInterestInput(input: unknown): ValidationResult {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: { form: 'Invalid submission.' } }
  }

  const record = input as Record<string, unknown>
  const studentName = cleanString(record.studentName, 120)
  const email = cleanString(record.email, 254)?.toLowerCase() ?? null
  const school = cleanString(record.school, 160)
  const grade = cleanString(record.grade, 40)
  const submittedEvents = Array.isArray(record.eventIds) ? record.eventIds : []
  const normalizedEvents = [...new Set(submittedEvents.filter((value): value is string => typeof value === 'string').map((value) => value.trim()))]
  const errors: Record<string, string> = {}

  if (!studentName) errors.studentName = 'A student name is required.'
  if (!email) errors.email = 'An email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'
  if (!school) errors.school = 'A school is required.'
  if (!grade) errors.grade = 'A class or grade is required.'
  if (normalizedEvents.length === 0) errors.eventIds = 'Choose at least one competition.'
  else if (normalizedEvents.length !== submittedEvents.length || normalizedEvents.some((eventId) => !eventIds.has(eventId))) {
    errors.eventIds = 'One or more selected competitions are not valid.'
  }

  if (Object.keys(errors).length > 0 || !studentName || !email || !school || !grade) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: { studentName, email, school, grade, eventIds: normalizedEvents },
  }
}
