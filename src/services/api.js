const API_BASE_URL = ""

const toQuery = (filters = {}) => {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All' && value !== 'all') query.set(key, value)
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

const request = async (path, options = {}) => {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options)
  } catch {
    throw new Error('Unable to reach the backend. Please check that the server is running.')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('The backend returned an invalid response.')
  }

  if (!response.ok || !payload.success) throw new Error(payload.message || 'The request could not be completed.')
  return payload.data
}

const requestWithBody = async (path, method, body) => {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Unable to reach the backend. Please check that the server is running.')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) throw new Error(payload?.message || 'The request could not be completed.')
  return payload.data
}

export const getEmployees = () => request('/api/employees')
export const getDepartments = () => request('/api/departments')
export const getPayrolls = () => request('/api/payroll')
export const getPayslip = (employeeId, month) => request(`/api/payslips/${encodeURIComponent(employeeId)}/${encodeURIComponent(month)}`)

export const getReport = (reportType, filters = {}) => {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'All' && value !== 'all') query.set(key, value)
  })
  const queryString = query.toString()
  return request(`/api/reports/${reportType}${queryString ? `?${queryString}` : ''}`)
}

export const getSalarySummary = () => request('/api/reports/salary-summary')
export const createEmployee = (employee) => requestWithBody('/api/employees', 'POST', employee)
export const updateEmployee = (id, employee) => requestWithBody(`/api/employees/${id}`, 'PUT', employee)
export const deleteEmployee = (id) => request(`/api/employees/${id}`, { method: 'DELETE' })
export const createDepartment = (department_name) => requestWithBody('/api/departments', 'POST', { department_name })
export const updateDepartment = (id, department_name) => requestWithBody(`/api/departments/${id}`, 'PUT', { department_name })
export const deleteDepartment = (id) => request(`/api/departments/${id}`, { method: 'DELETE' })
export const getDepartmentEmployees = (id) => request(`/api/departments/${id}/employees`)
export const getAttendance = (filters = {}) => request(`/api/attendance${toQuery(filters)}`)
export const createAttendance = (attendance) => requestWithBody('/api/attendance', 'POST', attendance)
export const updateAttendance = (id, attendance) => requestWithBody(`/api/attendance/${id}`, 'PUT', attendance)
export const deleteAttendance = (id) => request(`/api/attendance/${id}`, { method: 'DELETE' })
export const getLeaves = (filters = {}) => request(`/api/leaves${toQuery(filters)}`)
export const createLeave = (leave) => requestWithBody('/api/leaves', 'POST', leave)
export const updateLeave = (id, leave) => requestWithBody(`/api/leaves/${id}`, 'PUT', leave)
export const deleteLeave = (id) => request(`/api/leaves/${id}`, { method: 'DELETE' })
export const getPayroll = (filters = {}) => request(`/api/payroll${toQuery(filters)}`)
export const createPayroll = (payroll) => requestWithBody('/api/payroll', 'POST', payroll)
export const updatePayroll = (id, payroll) => requestWithBody(`/api/payroll/${id}`, 'PUT', payroll)
export const deletePayroll = (id) => request(`/api/payroll/${id}`, { method: 'DELETE' })