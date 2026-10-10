import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ErrorMessage from '../components/ui/ErrorMessage'
import Input from '../components/ui/Input'
import Loading from '../components/ui/Loading'
import Select from '../components/ui/Select'
import PayslipDocument from '../components/payslip/PayslipDocument'
import { getDepartments, getEmployees, getPayrolls, getPayslip } from '../services/api'

const PayslipPage = () => {
  const [employees, setEmployees] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [payslip, setPayslip] = useState(null)
  const [isLoadingPayslip, setIsLoadingPayslip] = useState(false)
  const [payslipError, setPayslipError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('All')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedPayrollId, setSelectedPayrollId] = useState('')
  const [showPayslip, setShowPayslip] = useState(false)

  useEffect(() => {
    let isCurrent = true
    Promise.all([getEmployees(), getDepartments(), getPayrolls()])
      .then(([employeeData, departmentData, payrollData]) => {
        if (!isCurrent) return
        setEmployees(employeeData)
        setDepartments(departmentData)
        setPayrolls(payrollData)
      })
      .catch((error) => {
        if (isCurrent) setOptionsError(error.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoadingOptions(false)
      })
    return () => { isCurrent = false }
  }, [])

  const payrollRows = useMemo(() => payrolls.map((payroll) => {
    const employee = employees.find((item) => item.emp_id === payroll.emp_id)
    return employee ? { ...payroll, employee, department_id: employee.department_id, department_name: employee.department_name } : null
  }).filter(Boolean), [employees, payrolls])

  const months = [...new Set(payrollRows.map((payroll) => payroll.month))]
  const filteredPayrolls = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return payrollRows.filter((payroll) => {
      const matchesSearch = !query || [payroll.emp_id, payroll.employee.emp_name]
        .some((value) => String(value).toLowerCase().includes(query))
      const matchesDepartment = departmentFilter === 'all' || String(payroll.department_id) === departmentFilter
      const matchesMonth = monthFilter === 'All' || payroll.month === monthFilter
      return matchesSearch && matchesDepartment && matchesMonth
    })
  }, [departmentFilter, monthFilter, payrollRows, searchTerm])

  const employeeOptions = useMemo(() => {
    const availableEmployeeIds = new Set(filteredPayrolls.map((payroll) => payroll.emp_id))
    return employees.filter((employee) => availableEmployeeIds.has(employee.emp_id))
  }, [employees, filteredPayrolls])

  const employeePayrolls = filteredPayrolls.filter((payroll) => (
    !selectedEmployeeId || String(payroll.emp_id) === selectedEmployeeId
  ))
  const selectedPayroll = employeePayrolls.find((payroll) => String(payroll.payroll_id) === selectedPayrollId)

  const handleFiltersChange = (setter) => (event) => {
    setter(event.target.value)
    setSelectedPayrollId('')
    setShowPayslip(false)
  }

  const handleEmployeeChange = (event) => {
    setSelectedEmployeeId(event.target.value)
    setSelectedPayrollId('')
    setShowPayslip(false)
  }

  const handlePayrollChange = (event) => {
    setSelectedPayrollId(event.target.value)
    setShowPayslip(false)
  }

  const handleViewPayslip = () => {
    if (!selectedEmployeeId || !selectedPayroll) {
      setPayslipError('Select an employee and payroll record before viewing the payslip.')
      setShowPayslip(false)
      return
    }

    setIsLoadingPayslip(true)
    setPayslipError('')
    setShowPayslip(false)
    getPayslip(selectedEmployeeId, selectedPayroll.month)
      .then((data) => {
        setPayslip(data)
        setShowPayslip(true)
      })
      .catch((error) => setPayslipError(error.message))
      .finally(() => setIsLoadingPayslip(false))
  }

  return (
    <>
      <div className="non-printable">
        <PageHeader
          title="Payslip Generation"
          subtitle="Select an employee payroll record to view or print a salary slip"
        />

        <Card className="payslip-controls-card">
          <div className="payslip-filter-grid">
            <Input
              label="Search Employee"
              placeholder="Search by employee ID or name"
              value={searchTerm}
              onChange={handleFiltersChange(setSearchTerm)}
            />
            <Select
              label="Department"
              value={departmentFilter}
              onChange={handleFiltersChange(setDepartmentFilter)}
              options={[{ value: 'all', label: 'All departments' }, ...departments.map((department) => ({ value: String(department.department_id), label: department.department_name }))]}
            />
            <Select
              label="Month"
              value={monthFilter}
              onChange={handleFiltersChange(setMonthFilter)}
              options={['All', ...months]}
            />
            <Select
              label="Employee"
              value={selectedEmployeeId}
              onChange={handleEmployeeChange}
              options={[{ value: '', label: 'Select employee' }, ...employeeOptions.map((employee) => ({ value: String(employee.emp_id), label: `EMP-${String(employee.emp_id).padStart(3, '0')} · ${employee.emp_name}` }))]}
            />
            <Select
              label="Payroll Record"
              value={selectedPayrollId}
              onChange={handlePayrollChange}
              options={[{ value: '', label: employeePayrolls.length ? 'Select payroll record' : 'No matching payroll records' }, ...employeePayrolls.map((payroll) => ({ value: String(payroll.payroll_id), label: `PAY-${String(payroll.payroll_id).padStart(3, '0')} · ${payroll.month}` }))]}
            />
          </div>
          <div className="payslip-controls-footer">
            <p className="payslip-helper">{filteredPayrolls.length} payroll record{filteredPayrolls.length === 1 ? '' : 's'} available for the current filters.</p>
            <Button onClick={handleViewPayslip} disabled={!selectedPayroll || isLoadingPayslip}>{isLoadingPayslip ? 'Loading payslip...' : 'Generate / View Payslip'}</Button>
          </div>
        </Card>

        {isLoadingOptions && <Loading text="Loading payroll options..." />}
        {optionsError && <ErrorMessage message={optionsError} />}
        {payslipError && <ErrorMessage message={payslipError} />}
        {!isLoadingOptions && !optionsError && !selectedPayroll && selectedEmployeeId && monthFilter !== 'All' && (
          <div className="info-message" role="status">No payroll record found for this employee and month.</div>
        )}
        {!isLoadingOptions && !optionsError && !selectedPayroll && !selectedEmployeeId && <div className="info-message" role="status">Select an employee and payroll record to display a payslip.</div>}
      </div>

      {showPayslip && payslip ? (
        <section className="payslip-preview-section">
          <div className="payslip-preview-toolbar non-printable">
            <div>
              <h3>Salary Payslip Preview</h3>
              <p>Review the slip before printing.</p>
            </div>
            <Button variant="secondary" onClick={() => window.print()}>Print Payslip</Button>
          </div>
          <PayslipDocument employee={payslip} payroll={payslip} />
        </section>
      ) : null}
    </>
  )
}

export default PayslipPage
