export const reportTypes = [
  { value: 'employees', label: 'Employee Report' },
  { value: 'attendance', label: 'Attendance Report' },
  { value: 'leave', label: 'Leave Report' },
  { value: 'payroll', label: 'Payroll Report' },
  { value: 'departments', label: 'Department Report' },
]

export const normalizeAttendanceStatus = (status) => (status === 'Late' ? 'Present' : status)

export const sortRows = (rows, sortKey, direction) => {
  if (!sortKey) return rows
  return [...rows].sort((left, right) => {
    const leftValue = String(left[sortKey] ?? '').toLowerCase()
    const rightValue = String(right[sortKey] ?? '').toLowerCase()
    const comparison = leftValue.localeCompare(rightValue, undefined, { numeric: true })
    return direction === 'desc' ? -comparison : comparison
  })
}
