import { eventFormats } from '../shared/events.js'
import type { Participant } from './types.js'

const eventNames = new Map(eventFormats.map((event) => [event.id, event.name]))

function cell(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function participantsToCsv(participants: Participant[]): string {
  const headers = ['ID', 'Timestamp', 'Student Name', 'Email', 'School', 'Class / Grade', 'Interested Events']
  const rows = participants.map((participant) => [
    participant.id,
    participant.submittedAt,
    participant.studentName,
    participant.email,
    participant.school,
    participant.grade,
    participant.eventIds.map((eventId) => eventNames.get(eventId) ?? eventId).join('; '),
  ])
  return `\uFEFF${[headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`
}
