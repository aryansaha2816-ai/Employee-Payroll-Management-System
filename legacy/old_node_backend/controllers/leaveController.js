const leaveModel = require('../models/leaveModel')

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0
const validStatuses = new Set(['Pending', 'Approved', 'Rejected'])

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const validateLeave = (body) => {
  const requiredFields = ['emp_id', 'leave_type', 'from_date', 'to_date', 'status']
  const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '')
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`
  if (!isValidId(body.emp_id)) return 'emp_id must be a valid positive integer'
  if (!isValidDate(body.from_date) || !isValidDate(body.to_date)) return 'from_date and to_date must be valid dates in YYYY-MM-DD format'
  if (body.from_date > body.to_date) return 'from_date must not be after to_date'
  if (!validStatuses.has(String(body.status))) return 'status must be Pending, Approved, or Rejected'
  return null
}

const list = async (req, res) => {
  const { status = '', leave_type: leaveType = '', emp_id: empId = '' } = req.query
  if (status && !validStatuses.has(String(status))) return res.status(400).json({ success: false, message: 'status must be Pending, Approved, or Rejected' })
  if (empId && !isValidId(empId)) return res.status(400).json({ success: false, message: 'emp_id must be a valid positive integer' })
  const data = await leaveModel.listLeaves({ status, leaveType, empId: empId ? Number(empId) : '' })
  res.json({ success: true, data })
}

const getById = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid leave ID' })
  const data = await leaveModel.findLeaveById(Number(req.params.id))
  if (!data) return res.status(404).json({ success: false, message: 'Leave record not found' })
  res.json({ success: true, data })
}

const getByEmployee = async (req, res) => {
  if (!isValidId(req.params.empId)) return res.status(400).json({ success: false, message: 'Invalid employee ID' })
  const data = await leaveModel.findLeavesByEmployeeId(Number(req.params.empId))
  res.json({ success: true, data })
}

const create = async (req, res) => {
  const validationError = validateLeave(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  if (!await leaveModel.employeeExists(Number(req.body.emp_id))) return res.status(400).json({ success: false, message: 'Employee not found' })
  const data = await leaveModel.createLeave(req.body)
  res.status(201).json({ success: true, data })
}

const update = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid leave ID' })
  const validationError = validateLeave(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  if (!await leaveModel.findLeaveById(Number(req.params.id))) return res.status(404).json({ success: false, message: 'Leave record not found' })
  if (!await leaveModel.employeeExists(Number(req.body.emp_id))) return res.status(400).json({ success: false, message: 'Employee not found' })
  await leaveModel.updateLeave(Number(req.params.id), req.body)
  const data = await leaveModel.findLeaveById(Number(req.params.id))
  res.json({ success: true, data })
}

const remove = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid leave ID' })
  if (!await leaveModel.findLeaveById(Number(req.params.id))) return res.status(404).json({ success: false, message: 'Leave record not found' })
  await leaveModel.deleteLeave(Number(req.params.id))
  res.json({ success: true, data: { message: 'Leave record deleted successfully' } })
}

module.exports = { list, getById, getByEmployee, create, update, remove }