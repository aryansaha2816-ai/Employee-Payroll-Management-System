const { pool } = require('../config/db')

const leaveSelect = `
    SELECT l.leave_id, l.emp_id, e.emp_name, l.leave_type,
      DATE_FORMAT(l.from_date, '%Y-%m-%d') AS from_date,
      DATE_FORMAT(l.to_date, '%Y-%m-%d') AS to_date, l.status
  FROM Leave_Record l
  INNER JOIN Employees e ON l.emp_id = e.emp_id`

const listLeaves = async ({ status = '', leaveType = '', empId = '' } = {}) => {
  const conditions = []
  const values = []

  if (status) {
    conditions.push('l.status = ?')
    values.push(status)
  }
  if (leaveType) {
    conditions.push('l.leave_type = ?')
    values.push(leaveType)
  }
  if (empId) {
    conditions.push('l.emp_id = ?')
    values.push(empId)
  }

  const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
  const [rows] = await pool.query(`${leaveSelect}${whereClause} ORDER BY l.from_date DESC, l.leave_id DESC`, values)
  return rows
}

const findLeaveById = async (leaveId) => {
  const [rows] = await pool.query(`${leaveSelect} WHERE l.leave_id = ?`, [leaveId])
  return rows[0]
}

const findLeavesByEmployeeId = async (employeeId) => listLeaves({ empId: employeeId })

const employeeExists = async (employeeId) => {
  const [rows] = await pool.query('SELECT emp_id FROM Employees WHERE emp_id = ?', [employeeId])
  return rows.length > 0
}

const createLeave = async (leave) => {
  const [result] = await pool.query(
    `INSERT INTO Leave_Record (emp_id, leave_type, from_date, to_date, status)
     VALUES (?, ?, ?, ?, ?)`,
    [leave.emp_id, leave.leave_type, leave.from_date, leave.to_date, leave.status],
  )
  return findLeaveById(result.insertId)
}

const updateLeave = async (leaveId, leave) => {
  const [result] = await pool.query(
    `UPDATE Leave_Record
     SET emp_id = ?, leave_type = ?, from_date = ?, to_date = ?, status = ?
     WHERE leave_id = ?`,
    [leave.emp_id, leave.leave_type, leave.from_date, leave.to_date, leave.status, leaveId],
  )
  return result.affectedRows
}

const deleteLeave = async (leaveId) => {
  const [result] = await pool.query('DELETE FROM Leave_Record WHERE leave_id = ?', [leaveId])
  return result.affectedRows
}

module.exports = {
  listLeaves,
  findLeaveById,
  findLeavesByEmployeeId,
  employeeExists,
  createLeave,
  updateLeave,
  deleteLeave,
}