import { useState } from 'react'
import { departments as initialDepartments, employees as initialEmployees, payrolls as initialPayrolls } from '../data/mockData'

import { MockDataContext } from './mockDataContextDefinition'

export const MockDataProvider = ({ children }) => {
  const [employees, setEmployees] = useState(initialEmployees)
  const [departments, setDepartments] = useState(initialDepartments)
  const [payrolls, setPayrolls] = useState(initialPayrolls)

  const addEmployee = (employee) => {
    const nextId = employees.reduce((highest, item) => Math.max(highest, item.emp_id), 0) + 1
    const department = departments.find((item) => item.department_id === employee.department_id)
    setEmployees((current) => [
      ...current,
      { ...employee, emp_id: nextId, department_name: department?.department_name ?? 'Unassigned' },
    ])
  }

  const updateEmployee = (employeeId, employeeData) => {
    const department = departments.find((item) => item.department_id === employeeData.department_id)
    setEmployees((current) => current.map((employee) => (
      employee.emp_id === employeeId
        ? { ...employee, ...employeeData, department_name: department?.department_name ?? 'Unassigned' }
        : employee
    )))
  }

  const deleteEmployee = (employeeId) => {
    setEmployees((current) => current.filter((employee) => employee.emp_id !== employeeId))
  }

  const addDepartment = (departmentName) => {
    const nextId = departments.reduce((highest, item) => Math.max(highest, item.department_id), 0) + 1
    setDepartments((current) => [...current, { department_id: nextId, department_name: departmentName }])
  }

  const updateDepartment = (departmentId, departmentName) => {
    setDepartments((current) => current.map((department) => (
      department.department_id === departmentId ? { ...department, department_name: departmentName } : department
    )))
    setEmployees((current) => current.map((employee) => (
      employee.department_id === departmentId ? { ...employee, department_name: departmentName } : employee
    )))
  }

  const deleteDepartment = (departmentId) => {
    setDepartments((current) => current.filter((department) => department.department_id !== departmentId))
    setEmployees((current) => current.map((employee) => (
      employee.department_id === departmentId
        ? { ...employee, department_id: null, department_name: 'Unassigned' }
        : employee
    )))
  }

  const addPayroll = (payroll) => {
    const nextId = payrolls.reduce((highest, item) => Math.max(highest, item.payroll_id), 0) + 1
    setPayrolls((current) => [...current, { ...payroll, payroll_id: nextId }])
  }

  const updatePayroll = (payrollId, payrollData) => {
    setPayrolls((current) => current.map((payroll) => (
      payroll.payroll_id === payrollId ? { ...payroll, ...payrollData } : payroll
    )))
  }

  const deletePayroll = (payrollId) => {
    setPayrolls((current) => current.filter((payroll) => payroll.payroll_id !== payrollId))
  }

  const value = {
    employees,
    departments,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    payrolls,
    addPayroll,
    updatePayroll,
    deletePayroll,
  }

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>
}

