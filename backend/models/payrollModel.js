const { pool } = require('../config/db')

const payrollSelect = `
  SELECT p.payroll_id, p.emp_id, e.emp_name, p.month,
         p.basic_salary, p.bonus, p.deductions, p.net_salary
  FROM Payroll p
  INNER JOIN Employees e ON p.emp_id = e.emp_id`

const listPayroll = async ({ month = '', empId = '' } = {}) => {
  const conditions = []
  const values = []

  if (month) {
    conditions.push('p.month = ?')
    values.push(month)
  }
  if (empId) {
    conditions.push('p.emp_id = ?')
    values.push(empId)
  }

  const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
  const [rows] = await pool.query(`${payrollSelect}${whereClause} ORDER BY p.payroll_id DESC`, values)
  return rows
}

const findPayrollById = async (payrollId) => {
  const [rows] = await pool.query(`${payrollSelect} WHERE p.payroll_id = ?`, [payrollId])
  return rows[0]
}

const findPayrollByEmployeeId = async (employeeId) => listPayroll({ empId: employeeId })

const employeeExists = async (employeeId) => {
  const [rows] = await pool.query('SELECT emp_id FROM Employees WHERE emp_id = ?', [employeeId])
  return rows.length > 0
}

const createPayroll = async (payroll) => {
  const [result] = await pool.query(
    `INSERT INTO Payroll (emp_id, month, basic_salary, bonus, deductions)
     VALUES (?, ?, ?, ?, ?)`,
    [payroll.emp_id, payroll.month, payroll.basic_salary, payroll.bonus, payroll.deductions],
  )
  return findPayrollById(result.insertId)
}

const updatePayroll = async (payrollId, payroll) => {
  const [result] = await pool.query(
    `UPDATE Payroll
     SET emp_id = ?, month = ?, basic_salary = ?, bonus = ?, deductions = ?,
         net_salary = basic_salary + bonus - deductions
     WHERE payroll_id = ?`,
    [payroll.emp_id, payroll.month, payroll.basic_salary, payroll.bonus, payroll.deductions, payrollId],
  )
  return result.affectedRows
}

const deletePayroll = async (payrollId) => {
  const [result] = await pool.query('DELETE FROM Payroll WHERE payroll_id = ?', [payrollId])
  return result.affectedRows
}

module.exports = {
  listPayroll,
  findPayrollById,
  findPayrollByEmployeeId,
  employeeExists,
  createPayroll,
  updatePayroll,
  deletePayroll,
}