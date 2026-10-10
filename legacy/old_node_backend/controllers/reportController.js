const { pool } = require('../config/db')

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0
const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const employees = async (req, res) => {
  const search = String(req.query.search || '').trim()
  const departmentId = String(req.query.department_id || '').trim()
  if (departmentId && !isValidId(departmentId)) return res.status(400).json({ success: false, message: 'department_id must be a valid positive integer' })
  const searchValue = `%${search}%`
  const conditions = ['(? = "" OR e.emp_name LIKE ? OR e.designation LIKE ? OR d.department_name LIKE ?)']
  const values = [search, searchValue, searchValue, searchValue]
  if (departmentId) {
    conditions.push('e.department_id = ?')
    values.push(Number(departmentId))
  }
  const [rows] = await pool.query(
    `SELECT e.emp_id, e.emp_name, e.gender, d.department_name,
            e.designation, DATE_FORMAT(e.join_date, '%Y-%m-%d') AS join_date,
            e.basic_salary
     FROM Employees e
     LEFT JOIN Departments d ON e.department_id = d.department_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY e.emp_id`,
    values,
  )
  res.json({ success: true, data: rows })
}

const attendance = async (req, res) => {
  const { date = '', status = '', emp_id: employeeId = '' } = req.query
  if (date && !isValidDate(date)) return res.status(400).json({ success: false, message: 'date must be a valid date in YYYY-MM-DD format' })
  if (employeeId && !isValidId(employeeId)) return res.status(400).json({ success: false, message: 'emp_id must be a valid positive integer' })
  const conditions = []
  const values = []
  if (date) { conditions.push('a.attendance_date = ?'); values.push(date) }
  if (status) { conditions.push('a.status = ?'); values.push(status) }
  if (employeeId) { conditions.push('a.emp_id = ?'); values.push(Number(employeeId)) }
  const [rows] = await pool.query(
    `SELECT a.attendance_id, a.emp_id, e.emp_name, e.department_id, d.department_name,
            DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date, a.status
     FROM Attendance a
     INNER JOIN Employees e ON a.emp_id = e.emp_id
     LEFT JOIN Departments d ON e.department_id = d.department_id
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY a.attendance_date DESC, a.attendance_id DESC`,
    values,
  )
  res.json({ success: true, data: rows })
}

const leaves = async (req, res) => {
  const { status = '', leave_type: leaveType = '', emp_id: employeeId = '' } = req.query
  if (employeeId && !isValidId(employeeId)) return res.status(400).json({ success: false, message: 'emp_id must be a valid positive integer' })
  const conditions = []
  const values = []
  if (status) { conditions.push('l.status = ?'); values.push(status) }
  if (leaveType) { conditions.push('l.leave_type = ?'); values.push(leaveType) }
  if (employeeId) { conditions.push('l.emp_id = ?'); values.push(Number(employeeId)) }
  const [rows] = await pool.query(
    `SELECT l.leave_id, l.emp_id, e.emp_name, e.department_id, d.department_name, l.leave_type,
            DATE_FORMAT(l.from_date, '%Y-%m-%d') AS from_date,
            DATE_FORMAT(l.to_date, '%Y-%m-%d') AS to_date, l.status
     FROM Leave_Record l
     INNER JOIN Employees e ON l.emp_id = e.emp_id
     LEFT JOIN Departments d ON e.department_id = d.department_id
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY l.from_date DESC, l.leave_id DESC`,
    values,
  )
  res.json({ success: true, data: rows })
}

const payroll = async (req, res) => {
  const { month = '', emp_id: employeeId = '' } = req.query
  if (employeeId && !isValidId(employeeId)) return res.status(400).json({ success: false, message: 'emp_id must be a valid positive integer' })
  const conditions = []
  const values = []
  if (month) { conditions.push('p.month = ?'); values.push(month) }
  if (employeeId) { conditions.push('p.emp_id = ?'); values.push(Number(employeeId)) }
  const [rows] = await pool.query(
    `SELECT p.payroll_id, p.emp_id, e.emp_name, e.department_id, d.department_name,
            p.month, p.basic_salary, p.bonus, p.deductions, p.net_salary
     FROM Payroll p
     INNER JOIN Employees e ON p.emp_id = e.emp_id
     LEFT JOIN Departments d ON e.department_id = d.department_id
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY p.payroll_id DESC`,
    values,
  )
  res.json({ success: true, data: rows })
}

const departments = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT d.department_id, d.department_name, COUNT(e.emp_id) AS employee_count
     FROM Departments d
     LEFT JOIN Employees e ON d.department_id = e.department_id
     GROUP BY d.department_id, d.department_name
     ORDER BY d.department_id`,
  )
  res.json({ success: true, data: rows })
}

const salarySummary = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT emp_id) AS total_employees,
            COALESCE(SUM(basic_salary), 0) AS total_basic_salary,
            COALESCE(SUM(bonus), 0) AS total_bonus,
            COALESCE(SUM(deductions), 0) AS total_deductions,
            COALESCE(SUM(net_salary), 0) AS total_net_salary
     FROM Payroll`,
  )
  res.json({ success: true, data: rows[0] })
}

module.exports = { employees, attendance, leaves, payroll, departments, salarySummary }