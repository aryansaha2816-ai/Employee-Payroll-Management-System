const departmentModel = require('../models/departmentModel')

const isValidId = (value) => /^\d+$/.test(value) && Number(value) > 0

const validateDepartmentName = (body) => {
  if (!body.department_name || !String(body.department_name).trim()) return 'department_name is required'
  return null
}

const list = async (req, res) => {
  const data = await departmentModel.listDepartments()
  res.json({ success: true, data })
}

const getById = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid department ID' })
  const department = await departmentModel.findDepartmentById(Number(req.params.id))
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' })
  res.json({ success: true, data: department })
}

const create = async (req, res) => {
  const validationError = validateDepartmentName(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  const data = await departmentModel.createDepartment(String(req.body.department_name).trim())
  res.status(201).json({ success: true, data })
}

const update = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid department ID' })
  const validationError = validateDepartmentName(req.body)
  if (validationError) return res.status(400).json({ success: false, message: validationError })
  const affectedRows = await departmentModel.updateDepartment(Number(req.params.id), String(req.body.department_name).trim())
  if (!affectedRows) return res.status(404).json({ success: false, message: 'Department not found' })
  const data = await departmentModel.findDepartmentById(Number(req.params.id))
  res.json({ success: true, data })
}

const remove = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid department ID' })
  const affectedRows = await departmentModel.deleteDepartment(Number(req.params.id))
  if (!affectedRows) return res.status(404).json({ success: false, message: 'Department not found' })
  res.json({ success: true, data: { message: 'Department deleted successfully' } })
}

const employees = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid department ID' })
  const department = await departmentModel.findDepartmentById(Number(req.params.id))
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' })
  const data = await departmentModel.listDepartmentEmployees(Number(req.params.id))
  res.json({ success: true, data })
}

module.exports = { list, getById, create, update, remove, employees }
