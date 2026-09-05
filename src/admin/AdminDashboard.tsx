import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import completeLogo from '../../assets/Helion-Logo-Complete.png'
import { eventFormats } from '../data/events'
import {
  AdminApiError,
  type AdminFilters,
  type AdminParticipant,
  getExportUrl,
  getParticipants,
  logoutAdmin,
} from '../services/adminApi'

type AdminDashboardProps = { onLoggedOut: () => void }
const initialFilters: AdminFilters = { search: '', event: '', school: '', grade: '', sort: 'newest' }
const eventNames = new Map(eventFormats.map((event) => [event.id, event.name]))

export function AdminDashboard({ onLoggedOut }: AdminDashboardProps) {
  const [filters, setFilters] = useState(initialFilters)
  const [searchDraft, setSearchDraft] = useState('')
  const [participants, setParticipants] = useState<AdminParticipant[]>([])
  const [schools, setSchools] = useState<string[]>([])
  const [grades, setGrades] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [overallTotal, setOverallTotal] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const loadParticipants = useCallback(async (signal?: AbortSignal) => {
    setStatus('loading')
    setMessage('')
    try {
      const result = await getParticipants(filters, signal)
      setParticipants(result.participants)
      setSchools(result.schools)
      setGrades(result.grades)
      setTotal(result.total)
      setOverallTotal(result.overallTotal)
      setStatus('ready')
    } catch (error) {
      if (signal?.aborted) return
      if (error instanceof AdminApiError && error.status === 401) {
        onLoggedOut()
        return
      }
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Participant data could not be loaded.')
    }
  }, [filters, onLoggedOut])

  useEffect(() => {
    const controller = new AbortController()
    void loadParticipants(controller.signal)
    return () => controller.abort()
  }, [loadParticipants, refreshKey])

  const filtered = useMemo(() => Boolean(filters.search || filters.event || filters.school || filters.grade), [filters])

  const applySearch = (event: FormEvent) => {
    event.preventDefault()
    setFilters((current) => ({ ...current, search: searchDraft.trim() }))
  }

  const logout = async () => {
    try {
      await logoutAdmin()
      onLoggedOut()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Logout failed. Please try again.')
    }
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <a className="admin-brand" href="/" aria-label="Return to HELION website"><img src={completeLogo} alt="HELION" /></a>
        <div className="admin-header__title"><span>Internal system</span><strong>Participation control</strong></div>
        <button type="button" onClick={logout}>Logout</button>
      </header>

      <div className="admin-dashboard__content">
        <section className="admin-overview" aria-labelledby="admin-dashboard-title">
          <div><p className="admin-kicker">HELION / 2027</p><h1 id="admin-dashboard-title">Interest registrations.</h1></div>
          <div className="admin-count"><span>Total submissions</span><strong>{overallTotal.toLocaleString()}</strong></div>
        </section>

        <section className="admin-controls" aria-label="Participant filters">
          <form className="admin-search" onSubmit={applySearch} role="search">
            <label htmlFor="admin-search">Search participants</label>
            <div><input id="admin-search" type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Name, email, school or grade" /><button type="submit">Search</button></div>
          </form>
          <AdminSelect label="Competition" value={filters.event} onChange={(value) => setFilters((current) => ({ ...current, event: value }))} options={eventFormats.map((event) => ({ value: event.id, label: event.name }))} />
          <AdminSelect label="School" value={filters.school} onChange={(value) => setFilters((current) => ({ ...current, school: value }))} options={schools.map((school) => ({ value: school, label: school }))} />
          <AdminSelect label="Class / grade" value={filters.grade} onChange={(value) => setFilters((current) => ({ ...current, grade: value }))} options={grades.map((grade) => ({ value: grade, label: grade }))} />
          <AdminSelect label="Order" value={filters.sort} onChange={(value) => setFilters((current) => ({ ...current, sort: value === 'oldest' ? 'oldest' : 'newest' }))} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }]} includeAll={false} />
        </section>

        <section className="admin-table-section" aria-labelledby="participant-table-title">
          <div className="admin-table-toolbar">
            <div><h2 id="participant-table-title">Participant data</h2><span>{participants.length} displayed / {total} {filtered ? 'matching' : 'total'}</span></div>
            <div>
              {filtered && <button type="button" className="admin-clear" onClick={() => { setFilters(initialFilters); setSearchDraft('') }}>Clear filters</button>}
              <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>Refresh</button>
              <a href={getExportUrl(filters)}>Export CSV</a>
            </div>
          </div>

          <p className="admin-status" aria-live="polite">{status === 'loading' ? 'Loading participant data…' : status === 'error' ? message : ''}</p>

          {status === 'ready' && participants.length === 0 ? (
            <div className="admin-empty"><span>00</span><h3>No interest registrations yet.</h3><p>{filtered ? 'No submissions match the active filters.' : 'New submissions will appear here.'}</p></div>
          ) : (
            <div className="admin-table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Submitted</th><th>Student</th><th>Email</th><th>School</th><th>Class / grade</th><th>Interested events</th></tr></thead>
                <tbody>{participants.map((participant) => (
                  <tr key={participant.id}>
                    <td data-label="ID">#{participant.id}</td>
                    <td data-label="Submitted"><time dateTime={participant.submittedAt}>{formatDate(participant.submittedAt)}</time></td>
                    <td data-label="Student"><strong>{participant.studentName}</strong></td>
                    <td data-label="Email"><a href={`mailto:${participant.email}`}>{participant.email}</a></td>
                    <td data-label="School">{participant.school}</td>
                    <td data-label="Class / grade">{participant.grade}</td>
                    <td data-label="Interested events"><div className="admin-event-list">{participant.eventIds.map((eventId) => <span key={eventId}>{eventNames.get(eventId) ?? eventId}</span>)}</div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

type AdminSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  includeAll?: boolean
}

function AdminSelect({ label, value, onChange, options, includeAll = true }: AdminSelectProps) {
  const id = `admin-filter-${label.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`
  return <div className="admin-select"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{includeAll && <option value="">All</option>}{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></div>
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
