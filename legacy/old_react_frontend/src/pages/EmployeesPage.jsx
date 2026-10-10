import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/ui/Button'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Table from '../components/ui/Table'
import EmployeeDetails from '../components/employees/EmployeeDetails'
import EmployeeForm from '../components/employees/EmployeeForm'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { createEmployee, deleteEmployee, getDepartments, getEmployees, updateEmployee } from '../services/api'

const EmployeesPage = () => {
  const [employeeList, setEmployeeList] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [modalMode, setModalMode] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [employees, departmentData] = await Promise.all([getEmployees(), getDepartments()])
      setEmployeeList(employees)
      setDepartments(departmentData)
      setError('')
    } catch (loadError) { setError(loadError.message) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { void Promise.resolve().then(loadData) }, [loadData])

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return employeeList.filter((employee) => {
      const matchesSearch = !query || [
        employee.emp_id,
        employee.emp_name,
        employee.department_name,
        employee.designation,
      ].some((value) => String(value).toLowerCase().includes(query))
      const matchesDepartment = departmentFilter === 'all' || String(employee.department_id) === departmentFilter
      return matchesSearch && matchesDepartment
    })
  }, [departmentFilter, employeeList, searchTerm])

  const openAddModal = () => {
    setSelectedEmployee(null)
    setModalMode('add')
  }

  const openEditModal = (employee) => {
    setSelectedEmployee(employee)
    setModalMode('edit')
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    window.setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleSave = async (formData) => {
    try {
      if (modalMode === 'edit') await updateEmployee(selectedEmployee.emp_id, formData)
      else await createEmployee(formData)
      await loadData()
      showSuccess(modalMode === 'edit' ? 'Employee details updated successfully.' : 'Employee added successfully.')
      setModalMode(null)
      setSelectedEmployee(null)
    } catch (saveError) { setError(saveError.message) }
  }

  const handleDelete = async () => {
    try {
      await deleteEmployee(employeeToDelete.emp_id)
      await loadData()
      showSuccess('Employee deleted successfully.')
      setEmployeeToDelete(null)
    } catch (deleteError) { setError(deleteError.message) }
  }

  const tableRows = filteredEmployees.map((employee) => ({ ...employee, id: employee.emp_id }))

  return (
    <>
      <PageHeader
        title="Employee Management"
        subtitle="Manage employee profiles and employment details"
        action={<Button size="sm" onClick={openAddModal}>Add Employee</Button>}
      />

      {successMessage && <div className="success-message" role="status">{successMessage}</div>}
      {error && <ErrorMessage message={error} />}

      <Card className="employee-list-card">
        <div className="employee-toolbar">
          <Input
            className="employee-search"
            placeholder="Search by ID, name, department or designation"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search employees"
          />
          <select
            className="select department-filter"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            aria-label="Filter by department"
          >
            <option value="all">All departments</option>
            {departments.map((department) => (
              <option key={department.department_id} value={department.department_id}>{department.department_name}</option>
            ))}
          </select>
          <span className="employee-count">{filteredEmployees.length} of {employeeList.length} employees</span>
        </div>
        {isLoading ? <Loading text="Loading employees..." /> : <Table
          columns={[
            { key: 'emp_id', label: 'Employee ID', render: (value) => `EMP-${String(value).padStart(3, '0')}` },
            { key: 'emp_name', label: 'Employee Name' },
            { key: 'gender', label: 'Gender' },
            { key: 'department_name', label: 'Department' },
            { key: 'designation', label: 'Designation' },
            { key: 'join_date', label: 'Join Date' },
            { key: 'basic_salary', label: 'Basic Salary', render: (value) => `₹ ${value.toLocaleString()}` },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, employee) => (
                <div className="table-actions">
                  <button className="table-action view" onClick={() => { setSelectedEmployee(employee); setModalMode('view') }}>View</button>
                  <button className="table-action edit" onClick={() => openEditModal(employee)}>Edit</button>
                  <button className="table-action delete" onClick={() => setEmployeeToDelete(employee)}>Delete</button>
                </div>
              ),
            },
          ]}
          rows={tableRows}
        />}
        {!isLoading && filteredEmployees.length === 0 && <p className="empty-state">No employees match your search or department filter.</p>}
      </Card>

      <Modal
        isOpen={modalMode === 'add' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        title={modalMode === 'edit' ? 'Edit Employee' : 'Add Employee'}
      >
        <EmployeeForm
          employee={selectedEmployee}
          departments={departments}
          onSubmit={handleSave}
          onCancel={() => setModalMode(null)}
        />
      </Modal>

      <Modal isOpen={modalMode === 'view'} onClose={() => setModalMode(null)} title="Employee Details">
        <EmployeeDetails employee={selectedEmployee} />
      </Modal>

      <ConfirmationDialog
        isOpen={Boolean(employeeToDelete)}
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        onConfirm={handleDelete}
        onCancel={() => setEmployeeToDelete(null)}
      />
    </>
  )
}

export default EmployeesPage
