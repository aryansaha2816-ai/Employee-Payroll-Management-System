const payrollModel = require('../models/payrollModel')

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0

const isValidSalary = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return false
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0
}

const validatePayroll = (body) => {
  const requiredFields = ['emp_id', 'month', 'basic_salary', 'bonus', 'deductions']
  const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '')
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`
  if (!isValidId(body.emp_id)) return 'emp_id must be a valid positive integer'
  if (!isValidSalary(body.basic_salary) || !isValidSalary(body.bonus) || !isValidSalary(body.deductions)) return 'Salary values must be non-negative numbers'
  return null
}

const list = async (req, res) => {
  const { month = '', emp_id: empId = '' } = req.query
  if (empId && !isValidId(empId)) return res.status(400).json({ success: false, message: 'emp_id must be a valid positive integer' })
  const data = await payrollModel.listPayroll({ month, empId: empId ? Number(empId) : '' })
  res.json({ success: true, data })
}

const getById = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payroll ID' })
  const data = await payrollModel.findPayrollById(Number(req.params.id))
  if (!data) return res.status(404).json({ success: false, message: 'Payroll record not found' })
  res.json({ success: true, data })
}

const getByEmployee = async (req, res) => {
  if (!isValidId(req.params.empId)) return res.status(400).json({ success: false, message: 'Invalid employee ID' })
  const data = await payrollModel.findPayrollByEmployeeId(Number(req.params.empId))
  res.json({ success: true, data })
}

const create = async (req, res) => {
  const validationError = validatePayroll(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  if (!await payrollModel.employeeExists(Number(req.body.emp_id))) return res.status(400).json({ success: false, message: 'Employee not found' })
  const data = await payrollModel.createPayroll(req.body)
  res.status(201).json({ success: true, data })
}

const update = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payroll ID' })
  const validationError = validatePayroll(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  if (!await payrollModel.findPayrollById(Number(req.params.id))) return res.status(404).json({ success: false, message: 'Payroll record not found' })
  if (!await payrollModel.employeeExists(Number(req.body.emp_id))) return res.status(400).json({ success: false, message: 'Employee not found' })
  await payrollModel.updatePayroll(Number(req.params.id), req.body)
  const data = await payrollModel.findPayrollById(Number(req.params.id))
  res.json({ success: true, data })
}

const remove = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payroll ID' })
  if (!await payrollModel.findPayrollById(Number(req.params.id))) return res.status(404).json({ success: false, message: 'Payroll record not found' })
  await payrollModel.deletePayroll(Number(req.params.id))
  res.json({ success: true, data: { message: 'Payroll record deleted successfully' } })
}

module.exports = { list, getById, getByEmployee, create, update, remove }