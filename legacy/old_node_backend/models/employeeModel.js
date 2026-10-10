const { pool } = require('../config/db')

const listEmployees = async (search = '') => {
  const searchValue = `%${search}%`
  const [rows] = await pool.query(
    `SELECT e.emp_id, e.emp_name, e.gender, e.department_id,
            d.department_name, e.designation, DATE_FORMAT(e.join_date, '%Y-%m-%d') AS join_date, e.basic_salary
     FROM Employees e
     LEFT JOIN Departments d ON e.department_id = d.department_id
     WHERE (? = '' OR e.emp_name LIKE ? OR e.designation LIKE ?)
     ORDER BY e.emp_id`,
    [search, searchValue, searchValue],
  )
  return rows
}

const findEmployeeById = async (employeeId) => {
  const [rows] = await pool.query(
    `SELECT e.emp_id, e.emp_name, e.gender, e.department_id,
            d.department_name, e.designation, DATE_FORMAT(e.join_date, '%Y-%m-%d') AS join_date, e.basic_salary
     FROM Employees e
     LEFT JOIN Departments d ON e.department_id = d.department_id
     WHERE e.emp_id = ?`,
    [employeeId],
  )
  return rows[0]
}

const createEmployee = async (employee) => {
  const [result] = await pool.query(
    `INSERT INTO Employees
      (emp_name, gender, department_id, designation, join_date, basic_salary)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [employee.emp_name, employee.gender, employee.department_id, employee.designation, employee.join_date, employee.basic_salary],
  )
  return findEmployeeById(result.insertId)
}

const updateEmployee = async (employeeId, employee) => {
  const [result] = await pool.query(
    `UPDATE Employees
     SET emp_name = ?, gender = ?, department_id = ?, designation = ?, join_date = ?, basic_salary = ?
     WHERE emp_id = ?`,
    [employee.emp_name, employee.gender, employee.department_id, employee.designation, employee.join_date, employee.basic_salary, employeeId],
  )
  return result.affectedRows
}

const deleteEmployee = async (employeeId) => {
  const [result] = await pool.query('DELETE FROM Employees WHERE emp_id = ?', [employeeId])
  return result.affectedRows
}

module.exports = { listEmployees, findEmployeeById, createEmployee, updateEmployee, deleteEmployee }
