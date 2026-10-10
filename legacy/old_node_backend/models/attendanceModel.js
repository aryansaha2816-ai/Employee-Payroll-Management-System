const { pool } = require('../config/db')

const attendanceSelect = `
  SELECT a.attendance_id, a.emp_id, e.emp_name, DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date, a.status
  FROM Attendance a
  INNER JOIN Employees e ON a.emp_id = e.emp_id`

const listAttendance = async ({ date = '', status = '', empId = '' } = {}) => {
  const conditions = []
  const values = []

  if (date) {
    conditions.push('a.attendance_date = ?')
    values.push(date)
  }
  if (status) {
    conditions.push('a.status = ?')
    values.push(status)
  }
  if (empId) {
    conditions.push('a.emp_id = ?')
    values.push(empId)
  }

  const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
  const [rows] = await pool.query(`${attendanceSelect}${whereClause} ORDER BY a.attendance_date DESC, a.attendance_id DESC`, values)
  return rows
}

const findAttendanceById = async (attendanceId) => {
  const [rows] = await pool.query(`${attendanceSelect} WHERE a.attendance_id = ?`, [attendanceId])
  return rows[0]
}

const findAttendanceByEmployeeId = async (employeeId) => listAttendance({ empId: employeeId })

const employeeExists = async (employeeId) => {
  const [rows] = await pool.query('SELECT emp_id FROM Employees WHERE emp_id = ?', [employeeId])
  return rows.length > 0
}

const createAttendance = async (attendance) => {
  const [result] = await pool.query(
    `INSERT INTO Attendance (emp_id, attendance_date, status)
     VALUES (?, ?, ?)`,
    [attendance.emp_id, attendance.attendance_date, attendance.status],
  )
  return findAttendanceById(result.insertId)
}

const updateAttendance = async (attendanceId, attendance) => {
  const [result] = await pool.query(
    `UPDATE Attendance
     SET emp_id = ?, attendance_date = ?, status = ?
     WHERE attendance_id = ?`,
    [attendance.emp_id, attendance.attendance_date, attendance.status, attendanceId],
  )
  return result.affectedRows
}

const deleteAttendance = async (attendanceId) => {
  const [result] = await pool.query('DELETE FROM Attendance WHERE attendance_id = ?', [attendanceId])
  return result.affectedRows
}

module.exports = {
  listAttendance,
  findAttendanceById,
  findAttendanceByEmployeeId,
  employeeExists,
  createAttendance,
  updateAttendance,
  deleteAttendance,
}