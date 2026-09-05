import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { InterestInput, Participant, ParticipantFilters, ParticipantList } from './types.js'

type ParticipantRow = {
  id: number
  submitted_at: string
  student_name: string
  email: string
  school: string
  grade: string
  event_ids: string
}

export type CreateParticipantResult =
  | { created: true; participant: Participant }
  | { created: false; duplicateId: number }

export class HelionDatabase {
  private readonly database: DatabaseSync

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true })
    this.database = new DatabaseSync(databasePath)
    this.database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;')
    this.initialize()
  }

  private initialize() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submitted_at TEXT NOT NULL,
        student_name TEXT NOT NULL,
        email TEXT NOT NULL,
        normalized_email TEXT NOT NULL,
        school TEXT NOT NULL,
        grade TEXT NOT NULL,
        duplicate_key TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS participant_events (
        participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL,
        PRIMARY KEY (participant_id, event_id)
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        token_hash TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_participants_submitted_at ON participants(submitted_at);
      CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(normalized_email);
      CREATE INDEX IF NOT EXISTS idx_participants_duplicate ON participants(duplicate_key, submitted_at);
      CREATE INDEX IF NOT EXISTS idx_participant_events_event ON participant_events(event_id);
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);
    `)
  }

  createParticipant(input: InterestInput): CreateParticipantResult {
    const submittedAt = new Date().toISOString()
    const normalizedEmail = input.email.toLowerCase()
    const duplicateKey = createHash('sha256')
      .update(`${normalizedEmail}\0${[...input.eventIds].sort().join(',')}`)
      .digest('hex')
    const duplicateSince = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const duplicate = this.database.prepare(
      'SELECT id FROM participants WHERE duplicate_key = ? AND submitted_at >= ? ORDER BY submitted_at DESC LIMIT 1',
    ).get(duplicateKey, duplicateSince) as { id: number } | undefined

    if (duplicate) return { created: false, duplicateId: duplicate.id }

    this.database.exec('BEGIN IMMEDIATE')
    try {
      const result = this.database.prepare(`
        INSERT INTO participants (submitted_at, student_name, email, normalized_email, school, grade, duplicate_key)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(submittedAt, input.studentName, input.email, normalizedEmail, input.school, input.grade, duplicateKey)
      const participantId = Number(result.lastInsertRowid)
      const insertEvent = this.database.prepare('INSERT INTO participant_events (participant_id, event_id) VALUES (?, ?)')
      for (const eventId of input.eventIds) insertEvent.run(participantId, eventId)
      this.database.exec('COMMIT')
      return { created: true, participant: { id: participantId, submittedAt, ...input } }
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  listParticipants(filters: ParticipantFilters, limit = 500): ParticipantList {
    const { whereSql, parameters } = buildWhere(filters)
    const order = filters.sort === 'oldest' ? 'ASC' : 'DESC'
    const rows = this.database.prepare(`
      SELECT p.id, p.submitted_at, p.student_name, p.email, p.school, p.grade,
             group_concat(pe.event_id, ',') AS event_ids
      FROM participants p
      JOIN participant_events pe ON pe.participant_id = p.id
      ${whereSql}
      GROUP BY p.id
      ORDER BY p.submitted_at ${order}, p.id ${order}
      LIMIT ?
    `).all(...parameters, limit) as unknown as ParticipantRow[]

    const filteredCount = this.database.prepare(`SELECT COUNT(*) AS count FROM participants p ${whereSql}`).get(...parameters) as { count: number }
    const overallCount = this.database.prepare('SELECT COUNT(*) AS count FROM participants').get() as { count: number }
    const schools = this.database.prepare('SELECT DISTINCT school FROM participants ORDER BY school COLLATE NOCASE').all() as unknown as Array<{ school: string }>
    const grades = this.database.prepare('SELECT DISTINCT grade FROM participants ORDER BY grade COLLATE NOCASE').all() as unknown as Array<{ grade: string }>

    return {
      participants: rows.map(mapParticipant),
      total: filteredCount.count,
      overallTotal: overallCount.count,
      schools: schools.map((row) => row.school),
      grades: grades.map((row) => row.grade),
    }
  }

  allParticipants(filters: ParticipantFilters): Participant[] {
    const { whereSql, parameters } = buildWhere(filters)
    const order = filters.sort === 'oldest' ? 'ASC' : 'DESC'
    const rows = this.database.prepare(`
      SELECT p.id, p.submitted_at, p.student_name, p.email, p.school, p.grade,
             group_concat(pe.event_id, ',') AS event_ids
      FROM participants p
      JOIN participant_events pe ON pe.participant_id = p.id
      ${whereSql}
      GROUP BY p.id
      ORDER BY p.submitted_at ${order}, p.id ${order}
    `).all(...parameters) as unknown as ParticipantRow[]
    return rows.map(mapParticipant)
  }

  createSession(tokenHash: string, expiresAt: string) {
    this.database.prepare('INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)')
      .run(tokenHash, new Date().toISOString(), expiresAt)
  }

  sessionIsValid(tokenHash: string): boolean {
    this.purgeExpiredSessions()
    return Boolean(this.database.prepare('SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND expires_at > ?')
      .get(tokenHash, new Date().toISOString()))
  }

  deleteSession(tokenHash: string) {
    this.database.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash)
  }

  purgeExpiredSessions() {
    this.database.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(new Date().toISOString())
  }

  close() {
    this.database.close()
  }
}

function buildWhere(filters: ParticipantFilters): { whereSql: string; parameters: string[] } {
  const conditions: string[] = []
  const parameters: string[] = []
  if (filters.search) {
    conditions.push('(p.student_name LIKE ? ESCAPE \'\\\' OR p.email LIKE ? ESCAPE \'\\\' OR p.school LIKE ? ESCAPE \'\\\' OR p.grade LIKE ? ESCAPE \'\\\')')
    const search = `%${escapeLike(filters.search)}%`
    parameters.push(search, search, search, search)
  }
  if (filters.eventId) {
    conditions.push('EXISTS (SELECT 1 FROM participant_events event_filter WHERE event_filter.participant_id = p.id AND event_filter.event_id = ?)')
    parameters.push(filters.eventId)
  }
  if (filters.school) {
    conditions.push('p.school = ? COLLATE NOCASE')
    parameters.push(filters.school)
  }
  if (filters.grade) {
    conditions.push('p.grade = ? COLLATE NOCASE')
    parameters.push(filters.grade)
  }
  return { whereSql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', parameters }
}

function escapeLike(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')
}

function mapParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    submittedAt: row.submitted_at,
    studentName: row.student_name,
    email: row.email,
    school: row.school,
    grade: row.grade,
    eventIds: row.event_ids.split(',').filter(Boolean),
  }
}
