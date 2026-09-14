import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Table from '../components/ui/Table'
import PayrollDetails from '../components/payroll/PayrollDetails'
import PayrollForm from '../components/payroll/PayrollForm'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { createPayroll, deletePayroll, getDepartments, getEmployees, getPayroll, updatePayroll } from '../services/api'
import { formatCurrency } from '../utils/payroll'

const PayrollPage = () => {
  const [employees, setEmployees] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('All')
  const [modalMode, setModalMode] = useState(null)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [payrollToDelete, setPayrollToDelete] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [employeeData, departmentData, payrollData] = await Promise.all([getEmployees(), getDepartments(), getPayroll()])
      setEmployees(employeeData)
      setDepartments(departmentData)
      setPayrolls(payrollData)
      setError('')
    } catch (loadError) { setError(loadError.message) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { void Promise.resolve().then(loadData) }, [loadData])

  const syncedPayrolls = useMemo(() => payrolls.map((payroll) => {
    const employee = employees.find((item) => item.emp_id === payroll.emp_id)
    return employee ? { ...payroll, emp_name: employee.emp_name, department_id: employee.department_id, department_name: employee.department_name, basic_salary: employee.basic_salary } : payroll
  }), [employees, payrolls])

  const filteredPayrolls = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return syncedPayrolls.filter((payroll) => {
      const matchesSearch = !query || [payroll.emp_id, payroll.emp_name, payroll.department_name]
        .some((value) => String(value).toLowerCase().includes(query))
      const matchesDepartment = departmentFilter === 'all' || String(payroll.department_id) === departmentFilter
      const matchesMonth = monthFilter === 'All' || payroll.month === monthFilter
      return matchesSearch && matchesDepartment && matchesMonth
    })
  }, [departmentFilter, monthFilter, searchTerm, syncedPayrolls])

  const months = [...new Set(syncedPayrolls.map((payroll) => payroll.month))]
  const totals = filteredPayrolls.reduce((summary, payroll) => ({
    basic: summary.basic + Number(payroll.basic_salary || 0),
    bonus: summary.bonus + Number(payroll.bonus || 0),
    deductions: summary.deductions + Number(payroll.deductions || 0),
    net: summary.net + Number(payroll.net_salary || 0),
  }), { basic: 0, bonus: 0, deductions: 0, net: 0 })

  const showSuccess = (message) => {
    setSuccessMessage(message)
    window.setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleSave = async (payrollData) => {
    try {
      if (modalMode === 'edit') await updatePayroll(selectedPayroll.payroll_id, payrollData)
      else await createPayroll(payrollData)
      await loadData()
      showSuccess(modalMode === 'edit' ? 'Payroll record updated successfully.' : 'Payroll generated successfully.')
      setModalMode(null)
      setSelectedPayroll(null)
    } catch (saveError) { setError(saveError.message) }
  }

  const handleDelete = async () => {
    try {
      await deletePayroll(payrollToDelete.payroll_id)
      await loadData()
      setPayrollToDelete(null)
      showSuccess('Payroll record deleted successfully.')
    } catch (deleteError) { setError(deleteError.message) }
  }

  return (
    <>
      <PageHeader
        title="Payroll Management"
        subtitle="Generate, review, and manage employee salary records"
        action={<Button size="sm" onClick={() => { setSelectedPayroll(null); setModalMode('generate') }}>Generate Payroll</Button>}
      />

      {successMessage && <div className="success-message" role="status">{successMessage}</div>}
      {error && <ErrorMessage message={error} />}

      <div className="payroll-summary-grid">
        <Card className="payroll-summary-card total"><span>Total Payroll Records</span><strong>{filteredPayrolls.length}</strong></Card>
        <Card className="payroll-summary-card basic"><span>Total Basic Salary</span><strong>{formatCurrency(totals.basic)}</strong></Card>
        <Card className="payroll-summary-card bonus"><span>Total Bonus</span><strong>{formatCurrency(totals.bonus)}</strong></Card>
        <Card className="payroll-summary-card deductions"><span>Total Deductions</span><strong>{formatCurrency(totals.deductions)}</strong></Card>
        <Card className="payroll-summary-card net"><span>Total Net Salary</span><strong>{formatCurrency(totals.net)}</strong></Card>
      </div>

      <Card className="payroll-list-card">
        <div className="payroll-toolbar">
          <Input
            className="payroll-search"
            placeholder="Search by employee ID, name or department"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search payroll records"
          />
          <select className="select payroll-filter" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} aria-label="Filter payroll by department">
            <option value="all">All departments</option>
            {departments.map((department) => <option key={department.department_id} value={department.department_id}>{department.department_name}</option>)}
          </select>
          <select className="select payroll-filter" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} aria-label="Filter payroll by month">
            <option>All</option>
            {months.map((month) => <option key={month}>{month}</option>)}
          </select>
        </div>
        {isLoading ? <Loading text="Loading payroll records..." /> : <Table
          columns={[
            { key: 'payroll_id', label: 'Payroll ID', render: (value) => `PAY-${String(value).padStart(3, '0')}` },
            { key: 'emp_id', label: 'Employee ID', render: (value) => `EMP-${String(value).padStart(3, '0')}` },
            { key: 'emp_name', label: 'Employee Name' },
            { key: 'department_name', label: 'Department' },
            { key: 'month', label: 'Month' },
            { key: 'basic_salary', label: 'Basic Salary', render: (value) => formatCurrency(value) },
            { key: 'bonus', label: 'Bonus', render: (value) => formatCurrency(value) },
            { key: 'deductions', label: 'Deductions', render: (value) => formatCurrency(value) },
            { key: 'net_salary', label: 'Net Salary', render: (value) => formatCurrency(value) },
            { key: 'status', label: 'Status', render: () => <Badge tone="success">Processed</Badge> },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, payroll) => (
                <div className="table-actions">
                  <button className="table-action view" onClick={() => { setSelectedPayroll(payroll); setModalMode('view') }}>View</button>
                  <button className="table-action edit" onClick={() => { setSelectedPayroll(payroll); setModalMode('edit') }}>Edit</button>
                  <button className="table-action delete" onClick={() => setPayrollToDelete(payroll)}>Delete</button>
                </div>
              ),
            },
          ]}
          rows={filteredPayrolls.map((payroll) => ({ ...payroll, id: payroll.payroll_id }))}
        />}
        {!isLoading && filteredPayrolls.length === 0 && <p className="empty-state">No payroll records match the selected filters.</p>}
      </Card>

      <Modal isOpen={modalMode === 'generate' || modalMode === 'edit'} onClose={() => setModalMode(null)} title={modalMode === 'edit' ? 'Edit Payroll' : 'Generate Payroll'}>
        <PayrollForm employees={employees} payroll={selectedPayroll} existingPayrolls={payrolls} onSubmit={handleSave} onCancel={() => setModalMode(null)} />
      </Modal>

      <Modal isOpen={modalMode === 'view'} onClose={() => setModalMode(null)} title="Payroll Details">
        <PayrollDetails payroll={selectedPayroll} />
      </Modal>

      <ConfirmationDialog
        isOpen={Boolean(payrollToDelete)}
        title="Delete Payroll Record"
        message="Are you sure you want to delete this payroll record?"
        onConfirm={handleDelete}
        onCancel={() => setPayrollToDelete(null)}
      />
    </>
  )
}

export default PayrollPage
