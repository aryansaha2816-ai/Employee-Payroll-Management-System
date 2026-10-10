import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import DepartmentDetails from '../components/departments/DepartmentDetails'
import DepartmentForm from '../components/departments/DepartmentForm'
import DepartmentTable from '../components/departments/DepartmentTable'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { createDepartment, deleteDepartment, getDepartmentEmployees, getDepartments, updateDepartment } from '../services/api'

const DepartmentsPage = () => {
  const [employees, setEmployees] = useState([])
  const [departmentList, setDepartmentList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [modalMode, setModalMode] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [departmentToDelete, setDepartmentToDelete] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const departments = await getDepartments()
      const employeeGroups = await Promise.all(departments.map((department) => getDepartmentEmployees(department.department_id)))
      setDepartmentList(departments)
      setEmployees(employeeGroups.flat())
      setError('')
    } catch (loadError) { setError(loadError.message) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { void Promise.resolve().then(loadData) }, [loadData])

  const departments = useMemo(() => departmentList.map((department) => ({
    ...department,
    employee_count: employees.filter((employee) => employee.department_id === department.department_id).length,
  })), [departmentList, employees])

  const filteredDepartments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return departments.filter((department) => (
      !query
      || String(department.department_id).toLowerCase().includes(query)
      || department.department_name.toLowerCase().includes(query)
    ))
  }, [departments, searchTerm])

  const showSuccess = (message) => {
    setSuccessMessage(message)
    window.setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleSave = async (departmentName) => {
    try {
      if (modalMode === 'edit') await updateDepartment(selectedDepartment.department_id, departmentName)
      else await createDepartment(departmentName)
      await loadData()
      showSuccess(modalMode === 'edit' ? 'Department updated successfully. Employee records were synchronized.' : 'Department added successfully.')
      setModalMode(null)
      setSelectedDepartment(null)
    } catch (saveError) { setError(saveError.message) }
  }

  const handleDelete = async () => {
    try {
      await deleteDepartment(departmentToDelete.department_id)
      await loadData()
      showSuccess('Department deleted successfully.')
      setDepartmentToDelete(null)
    } catch (deleteError) { setError(deleteError.message) }
  }

  const assignedEmployees = selectedDepartment
    ? employees.filter((employee) => employee.department_id === selectedDepartment.department_id)
    : []
  const deleteEmployeeCount = departmentToDelete
    ? employees.filter((employee) => employee.department_id === departmentToDelete.department_id).length
    : 0

  return (
    <>
      <PageHeader
        title="Department Management"
        subtitle="Organize teams and manage employee department assignments"
        action={<Button size="sm" onClick={() => { setSelectedDepartment(null); setModalMode('add') }}>Add Department</Button>}
      />

      {successMessage && <div className="success-message" role="status">{successMessage}</div>}
      {error && <ErrorMessage message={error} />}

      <Card className="department-list-card">
        <div className="department-toolbar">
          <Input
            className="department-search"
            placeholder="Search by department ID or name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search departments"
          />
          <span className="employee-count">{filteredDepartments.length} of {departments.length} departments</span>
        </div>
        {isLoading ? <Loading text="Loading departments..." /> : <DepartmentTable
          departments={filteredDepartments}
          onView={(department) => { setSelectedDepartment(department); setModalMode('view') }}
          onEdit={(department) => { setSelectedDepartment(department); setModalMode('edit') }}
          onDelete={setDepartmentToDelete}
        />}
        {!isLoading && filteredDepartments.length === 0 && <p className="empty-state">No departments match your search.</p>}
      </Card>

      <Modal
        isOpen={modalMode === 'add' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        title={modalMode === 'edit' ? 'Edit Department' : 'Add Department'}
      >
        <DepartmentForm
          department={selectedDepartment}
          existingDepartments={departmentList}
          onSubmit={handleSave}
          onCancel={() => setModalMode(null)}
        />
      </Modal>

      <Modal isOpen={modalMode === 'view'} onClose={() => setModalMode(null)} title="Department Details">
        <DepartmentDetails department={selectedDepartment} employees={assignedEmployees} />
      </Modal>

      <ConfirmationDialog
        isOpen={Boolean(departmentToDelete)}
        title="Delete Department"
        message={deleteEmployeeCount > 0
          ? `This department has ${deleteEmployeeCount} assigned employee${deleteEmployeeCount === 1 ? '' : 's'}. Deleting it will mark them as Unassigned. Do you want to continue?`
          : 'Are you sure you want to delete this department?'}
        onConfirm={handleDelete}
        onCancel={() => setDepartmentToDelete(null)}
      />
    </>
  )
}

export default DepartmentsPage
