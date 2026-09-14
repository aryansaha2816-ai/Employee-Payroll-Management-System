const attendanceModel = require('../models/attendanceModel')

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0
const validStatuses = new Set(['Present', 'Absent'])

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const validateAttendance = (body) => {
  const requiredFields = ['emp_id', 'attendance_date', 'status']
  const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '')
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`
  if (!isValidId(body.emp_id)) return 'emp_id must be a valid positive integer'
  if (!isValidDate(body.attendance_date)) return 'attendance_date must be a valid date in YYYY-MM-DD format'
  if (!validStatuses.has(String(body.status))) return 'status must be Present or Absent'
  return null
}

const list = async (req, res) => {
  const { date = '', status = '', emp_id: empId = '' } = req.query
  if (date && !isValidDate(date)) return res.status(400).json({ success: false, message: 'date must be a valid date in YYYY-MM-DD format' })
  if (status && !validStatuses.has(String(status))) return res.status(400).json({ success: false, message: 'status must be Present or Absent' })
  if (empId && !isValidId(empId)) return res.status(400).json({ success: false, message: 'emp_id must be a valid positive integer' })
  const data = await attendanceModel.listAttendance({ date, status, empId: empId ? Number(empId) : '' })
  res.json({ success: true, data })
}

const getById = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid attendance ID' })
  const data = await attendanceModel.findAttendanceById(Number(req.params.id))
  if (!data) return res.status(404).json({ success: false, message: 'Attendance record not found' })
  res.json({ success: true, data })
}

const getByEmployee = async (req, res) => {
  if (!isValidId(req.params.empId)) return res.status(400).json({ success: false, message: 'Invalid employee ID' })
  const data = await attendanceModel.findAttendanceByEmployeeId(Number(req.params.empId))
  res.json({ success: true, data })
}

const create = async (req, res) => {
  const validationError = validateAttendance(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  if (!await attendanceModel.employeeExists(Number(req.body.emp_id))) return res.status(400).json({ success: false, message: 'Employee not found' })
  const data = await attendanceModel.createAttendance(req.body)
  res.status(201).json({ success: true, data })
}

const update = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid attendance ID' })
  const validationError = validateAttendance(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  if (!await attendanceModel.findAttendanceById(Number(req.params.id))) return res.status(404).json({ success: false, message: 'Attendance record not found' })
  if (!await attendanceModel.employeeExists(Number(req.body.emp_id))) return res.status(400).json({ success: false, message: 'Employee not found' })
  await attendanceModel.updateAttendance(Number(req.params.id), req.body)
  const data = await attendanceModel.findAttendanceById(Number(req.params.id))
  res.json({ success: true, data })
}

const remove = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid attendance ID' })
  if (!await attendanceModel.findAttendanceById(Number(req.params.id))) return res.status(404).json({ success: false, message: 'Attendance record not found' })
  await attendanceModel.deleteAttendance(Number(req.params.id))
  res.json({ success: true, data: { message: 'Attendance record deleted successfully' } })
}

module.exports = { list, getById, getByEmployee, create, update, remove }