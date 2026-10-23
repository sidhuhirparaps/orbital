/** Strict form validators for workspace invites and similar flows. */

const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]{1,78}$/u

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function normalizePersonName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

export function isValidEmail(value) {
  const email = normalizeEmail(value)
  if (!email || email.length > 254) return false
  if (email.includes('..')) return false
  return EMAIL_RE.test(email)
}

export function isValidPersonName(value) {
  const name = normalizePersonName(value)
  if (name.length < 2 || name.length > 80) return false
  // Block obvious garbage / keyboard mash without letters spaced properly
  if (!NAME_RE.test(name)) return false
  if (/^(.)\1+$/u.test(name.replace(/[\s.'’-]/g, ''))) return false
  return true
}

export function validateInviteInput({ name, email, role }) {
  const errors = {}
  const cleanName = normalizePersonName(name)
  const cleanEmail = normalizeEmail(email)

  if (!cleanName) errors.name = 'Enter their full name.'
  else if (!isValidPersonName(cleanName)) {
    errors.name = 'Use a real name (letters only, at least 2 characters).'
  }

  if (!cleanEmail) errors.email = 'Enter an email address.'
  else if (!isValidEmail(cleanEmail)) {
    errors.email = 'Enter a valid email like name@company.com.'
  }

  const allowed = new Set(['lead', 'member', 'viewer'])
  if (!allowed.has(role)) errors.role = 'Choose Lead, Member, or Viewer.'

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { name: cleanName, email: cleanEmail, role },
  }
}
