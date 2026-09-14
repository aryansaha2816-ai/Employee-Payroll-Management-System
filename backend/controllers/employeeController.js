const employeeModel = require('../models/employeeModel')

const isValidId = (value) => /^\d+$/.test(value) && Number(value) > 0

const requiredEmployeeFields = ['emp_name', 'gender', 'department_id', 'designation', 'join_date', 'basic_salary']

const validateEmployee = (body) => {
  const missing = requiredEmployeeFields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '')
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`
  if (!Number.isInteger(Number(body.department_id)) || Number(body.department_id) <= 0) return 'department_id must be a valid positive integer'
  if (Number.isNaN(Number(body.basic_salary)) || Number(body.basic_salary) < 0) return 'basic_salary must be a non-negative number'
  return null
}

const list = async (req, res) => {
  const data = await employeeModel.listEmployees(String(req.query.search || '').trim())
  res.json({ success: true, data })
}

const getById = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid employee ID' })
  const employee = await employeeModel.findEmployeeById(Number(req.params.id))
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' })
  res.json({ success: true, data: employee })
}

const create = async (req, res) => {
  const validationError = validateEmployee(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  const data = await employeeModel.createEmployee(req.body)
  res.status(201).json({ success: true, data })
}

const update = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid employee ID' })
  const validationError = validateEmployee(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  const affectedRows = await employeeModel.updateEmployee(Number(req.params.id), req.body)
  if (!affectedRows) return res.status(404).json({ success: false, message: 'Employee not found' })
  const data = await employeeModel.findEmployeeById(Number(req.params.id))
  res.json({ success: true, data })
}

const remove = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid employee ID' })
  const affectedRows = await employeeModel.deleteEmployee(Number(req.params.id))
  if (!affectedRows) return res.status(404).json({ success: false, message: 'Employee not found' })
  res.json({ success: true, data: { message: 'Employee deleted successfully' } })
}

module.exports = { list, getById, create, update, remove }
