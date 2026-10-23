import {
  format,
  formatDistanceToNow,
  isPast,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from 'date-fns'

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  return parseISO(value)
}

export function relativeTime(value) {
  const date = toDate(value)
  if (!date) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatDate(value, pattern = 'MMM d, yyyy') {
  const date = toDate(value)
  if (!date) return ''
  return format(date, pattern)
}

export function formatDateLong(value) {
  const date = toDate(value)
  if (!date) return ''
  return format(date, 'EEEE, MMMM d')
}

export function isOverdue(value) {
  const date = toDate(value)
  if (!date) return false
  return isPast(startOfDay(date)) && !isToday(date)
}

export function isDueToday(value) {
  const date = toDate(value)
  if (!date) return false
  return isToday(date)
}

export function dueLabel(value) {
  const date = toDate(value)
  if (!date) return ''
  if (isOverdue(value)) {
    return `Overdue · ${format(date, 'MMM d')}`
  }
  if (isDueToday(value)) {
    return 'Due today'
  }
  if (isTomorrow(date)) {
    return 'Due tomorrow'
  }
  return `Due ${format(date, 'MMM d')}`
}

export function dueClassName(value) {
  if (isOverdue(value)) return 'text-terracotta'
  if (isDueToday(value)) return 'text-terracotta'
  return 'text-muted'
}

export function greetingForNow(date = new Date()) {
  const hour = date.getHours()
  // 5:00–11:59 morning · 12:00–17:59 afternoon · otherwise evening
  if (hour >= 5 && hour < 12) return 'Good morning.'
  if (hour >= 12 && hour < 18) return 'Good afternoon.'
  return 'Good evening.'
}
