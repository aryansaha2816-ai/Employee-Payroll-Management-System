const { pool } = require('../config/db')

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0

const getPayslip = async (req, res) => {
  const { employeeId, month } = req.params
  if (!isValidId(employeeId) || !String(month || '').trim()) {
    return res.status(400).json({ success: false, message: 'A valid employee ID and month are required' })
  }

  const [employees] = await pool.query('SELECT emp_id FROM Employees WHERE emp_id = ?', [Number(employeeId)])
  if (!employees.length) return res.status(404).json({ success: false, message: 'Employee not found' })

  const [rows] = await pool.query(
        `SELECT p.payroll_id, e.emp_id, e.emp_name, e.gender, d.department_name,
          e.designation, DATE_FORMAT(e.join_date, '%Y-%m-%d') AS join_date, p.month, p.basic_salary,
            p.bonus, p.deductions, p.net_salary
     FROM Payroll p
     INNER JOIN Employees e ON p.emp_id = e.emp_id
     LEFT JOIN Departments d ON e.department_id = d.department_id
     WHERE p.emp_id = ? AND p.month = ?
     ORDER BY p.payroll_id DESC
     LIMIT 1`,
    [Number(employeeId), month],
  )

  if (!rows.length) return res.status(404).json({ success: false, message: 'Payslip not found for this employee and month' })
  res.json({ success: true, data: rows[0] })
}

module.exports = { getPayslip }