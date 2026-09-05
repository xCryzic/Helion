import { type FormEvent, useMemo, useState } from 'react'
import { eventFormats } from '../../data/events'
import { getInterestSubmissionAdapter, InterestSubmissionError } from '../../services/interestSubmission'
import {
  type InterestFormErrors,
  type InterestFormValues,
  validateInterestForm,
} from '../../services/interestValidation'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

const initialValues: InterestFormValues = { studentName: '', email: '', school: '', grade: '', eventIds: [] }

export function InterestForm() {
  const [values, setValues] = useState<InterestFormValues>(initialValues)
  const [errors, setErrors] = useState<InterestFormErrors>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [submissionError, setSubmissionError] = useState('')
  const adapter = useMemo(() => getInterestSubmissionAdapter(), [])

  const setField = (field: keyof Omit<InterestFormValues, 'eventIds'>, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const toggleEvent = (eventId: string) => {
    setValues((current) => ({
      ...current,
      eventIds: current.eventIds.includes(eventId) ? current.eventIds.filter((id) => id !== eventId) : [...current.eventIds, eventId],
    }))
    if (errors.eventIds) setErrors((current) => ({ ...current, eventIds: undefined }))
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateInterestForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus('idle')
      document.getElementById(`interest-${Object.keys(nextErrors)[0]}`)?.focus()
      return
    }

    setStatus('loading')
    setSubmissionError('')
    try {
      await adapter.submit(values)
      setStatus('success')
      setValues(initialValues)
    } catch (error) {
      setSubmissionError(error instanceof InterestSubmissionError ? error.message : 'Your details were not sent. Please try again later.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="interest-form__result" role="status" tabIndex={-1}>
        <span aria-hidden="true">✓</span><h3>Interest noted.</h3>
        <p>Your interest has been securely submitted. Keep the same email for official registration later.</p>
        <button type="button" onClick={() => setStatus('idle')}>Submit another response</button>
      </div>
    )
  }

  return (
    <form className="interest-form" noValidate onSubmit={onSubmit} aria-busy={status === 'loading'}>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="interest-studentName">Student name</label>
          <input id="interest-studentName" name="studentName" type="text" autoComplete="name" value={values.studentName} onChange={(event) => setField('studentName', event.target.value)} aria-invalid={Boolean(errors.studentName)} aria-describedby={errors.studentName ? 'error-studentName' : undefined} />
          {errors.studentName && <span className="field__error" id="error-studentName">{errors.studentName}</span>}
        </div>
        <div className="field">
          <label htmlFor="interest-email">Email address</label>
          <input id="interest-email" name="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(event) => setField('email', event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-note error-email' : 'email-note'} />
          <span className="field__note" id="email-note">Use this email again when official registration opens.</span>
          {errors.email && <span className="field__error" id="error-email">{errors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="interest-school">School</label>
          <input id="interest-school" name="school" type="text" autoComplete="organization" value={values.school} onChange={(event) => setField('school', event.target.value)} aria-invalid={Boolean(errors.school)} aria-describedby={errors.school ? 'error-school' : undefined} />
          {errors.school && <span className="field__error" id="error-school">{errors.school}</span>}
        </div>
        <div className="field">
          <label htmlFor="interest-grade">Class / grade</label>
          <input id="interest-grade" name="grade" type="text" autoComplete="off" value={values.grade} onChange={(event) => setField('grade', event.target.value)} aria-invalid={Boolean(errors.grade)} aria-describedby={errors.grade ? 'error-grade' : undefined} />
          {errors.grade && <span className="field__error" id="error-grade">{errors.grade}</span>}
        </div>
      </div>

      <fieldset className="event-picker" aria-describedby={errors.eventIds ? 'error-eventIds' : 'event-picker-note'}>
        <legend>Competition interests <span>Select all that apply</span></legend>
        <p id="event-picker-note">Choose one or more confirmed competitions.</p>
        <div className="event-picker__options">
          {eventFormats.map((event, index) => (
            <label key={event.id}>
              <input id={index === 0 ? 'interest-eventIds' : undefined} type="checkbox" name="eventIds" value={event.id} checked={values.eventIds.includes(event.id)} onChange={() => toggleEvent(event.id)} />
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><strong>{event.shortName}</strong>
            </label>
          ))}
        </div>
        {errors.eventIds && <span className="field__error" id="error-eventIds">{errors.eventIds}</span>}
      </fieldset>

      <div className="interest-form__footer">
        <p>This is interest registration, not official registration. Discount amount and full conditions are not yet finalized.</p>
        <button className="submit-button" type="submit" disabled={status === 'loading'}><span>{status === 'loading' ? 'Submitting…' : 'Submit interest'}</span><i aria-hidden="true">↗</i></button>
      </div>
      <div className="form-status" aria-live="polite">
        {status === 'loading' && <p>Submitting your interest…</p>}
        {status === 'error' && <p>{submissionError}</p>}
      </div>
    </form>
  )
}
