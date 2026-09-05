import type { InterestSubmission } from './interestSubmission'

export type InterestFormValues = InterestSubmission
export type InterestFormErrors = Partial<Record<keyof InterestFormValues, string>>

export function validateInterestForm(values: InterestFormValues): InterestFormErrors {
  const errors: InterestFormErrors = {}
  if (!values.studentName.trim()) errors.studentName = 'Enter the student name.'
  if (!values.email.trim()) errors.email = 'Enter an email address.'
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Enter a valid email address.'
  if (!values.school.trim()) errors.school = 'Enter the school name.'
  if (!values.grade.trim()) errors.grade = 'Enter the class or grade.'
  if (values.eventIds.length === 0) errors.eventIds = 'Choose at least one competition.'
  return errors
}
