const { pool } = require('../config/db')

const listDepartments = async () => {
  const [rows] = await pool.query(
    `SELECT d.department_id, d.department_name, COUNT(e.emp_id) AS employee_count
     FROM Departments d
     LEFT JOIN Employees e ON d.department_id = e.department_id
     GROUP BY d.department_id, d.department_name
     ORDER BY d.department_id`,
  )
  return rows
}

const findDepartmentById = async (departmentId) => {
  const [rows] = await pool.query(
    `SELECT d.department_id, d.department_name, COUNT(e.emp_id) AS employee_count
     FROM Departments d
     LEFT JOIN Employees e ON d.department_id = e.department_id
     WHERE d.department_id = ?
     GROUP BY d.department_id, d.department_name`,
    [departmentId],
  )
  return rows[0]
}

const createDepartment = async (departmentName) => {
  const [result] = await pool.query(
    'INSERT INTO Departments (department_name) VALUES (?)',
    [departmentName],
  )
  return findDepartmentById(result.insertId)
}

const updateDepartment = async (departmentId, departmentName) => {
  const [result] = await pool.query(
    'UPDATE Departments SET department_name = ? WHERE department_id = ?',
    [departmentName, departmentId],
  )
  return result.affectedRows
}

const deleteDepartment = async (departmentId) => {
  const [result] = await pool.query('DELETE FROM Departments WHERE department_id = ?', [departmentId])
  return result.affectedRows
}

const listDepartmentEmployees = async (departmentId) => {
  const [rows] = await pool.query(
    `SELECT e.emp_id, e.emp_name, e.gender, e.department_id,
            d.department_name, e.designation, e.join_date, e.basic_salary
     FROM Employees e
     INNER JOIN Departments d ON e.department_id = d.department_id
     WHERE e.department_id = ?
     ORDER BY e.emp_id`,
    [departmentId],
  )
  return rows
}

module.exports = { listDepartments, findDepartmentById, createDepartment, updateDepartment, deleteDepartment, listDepartmentEmployees }
