import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import ErrorMessage from '../components/ui/ErrorMessage'
import Input from '../components/ui/Input'
import Loading from '../components/ui/Loading'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'
import { getReport, getSalarySummary } from '../services/api'
import { formatCurrency } from '../utils/payroll'
import { reportTypes, sortRows } from '../utils/reports'

const statusTone = (status) => (status === 'Approved' || status === 'Present' ? 'success' : status === 'Pending' ? 'warning' : 'danger')

const SummaryCards = ({ cards }) => (
  <div className="report-summary-grid">
    {cards.map((card) => (
      <Card className={`report-summary-card ${card.tone ?? ''}`} key={card.label}>
        <span>{card.label}</span>
        <strong>{card.value}</strong>
      </Card>
    ))}
  </div>
)

const AnalyticsChart = ({ title, items, valueFormatter = (value) => value }) => {
  const maximum = Math.max(...items.map((item) => item.value), 1)
  return (
    <Card title={title} className="report-chart-card">
      <div className="report-bars">
        {items.map((item) => (
          <div className="report-bar-item" key={item.label}>
            <div className="report-bar-value">{valueFormatter(item.value)}</div>
            <div className="report-bar-track"><span className={`report-bar ${item.tone ?? 'blue'}`} style={{ height: `${Math.max((item.value / maximum) * 100, 4)}%` }} /></div>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </Card>
  )
}

const reportEndpoints = { employees: 'employees', attendance: 'attendance', leave: 'leaves', payroll: 'payroll', departments: 'departments' }

const ReportsPage = () => {
  const [reportType, setReportType] = useState('employees')
  const [rows, setRows] = useState([])
  const [departments, setDepartments] = useState([])
  const [salarySummary, setSalarySummary] = useState(null)
  const [loadedQueryKey, setLoadedQueryKey] = useState('')
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('All')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('All')
  const [monthFilter, setMonthFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  const queryFilters = useMemo(() => {
    const numericSearch = /^\d+$/.test(searchTerm.trim()) ? searchTerm.trim() : ''
    if (reportType === 'employees') return { search: searchTerm.trim(), department_id: departmentFilter }
    if (reportType === 'attendance') return { date: dateFilter, status: statusFilter, emp_id: numericSearch }
    if (reportType === 'leave') return { status: statusFilter, leave_type: leaveTypeFilter, emp_id: numericSearch }
    if (reportType === 'payroll') return { month: monthFilter, emp_id: numericSearch }
    return {}
  }, [dateFilter, departmentFilter, leaveTypeFilter, monthFilter, reportType, searchTerm, statusFilter])

  useEffect(() => {
    let isCurrent = true
    const queryKey = JSON.stringify([reportType, queryFilters])
    Promise.all([
      getReport(reportEndpoints[reportType], queryFilters),
      getReport('departments'),
      getSalarySummary(),
    ])
      .then(([reportData, departmentData, summaryData]) => {
        if (!isCurrent) return
        setRows(reportData)
        setDepartments(departmentData)
        setSalarySummary(summaryData)
        setError('')
        setLoadedQueryKey(queryKey)
      })
      .catch((requestError) => {
        if (isCurrent) {
          setRows([])
          setError(requestError.message)
          setLoadedQueryKey(queryKey)
        }
      })
    return () => { isCurrent = false }
  }, [queryFilters, reportType])

  const leaveTypes = useMemo(() => [...new Set(rows.map((row) => row.leave_type).filter(Boolean))], [rows])
  const months = useMemo(() => [...new Set(rows.map((row) => row.month).filter(Boolean))], [rows])
  const query = searchTerm.trim().toLowerCase()
  const matchesSearch = (values) => !query || values.some((value) => String(value ?? '').toLowerCase().includes(query))
  const matchesDepartment = (departmentId) => departmentFilter === 'all' || String(departmentId) === departmentFilter
  const filteredRows = rows.filter((row) => reportType === 'employees' || (matchesSearch([row.emp_id, row.emp_name, row.department_name, row.leave_type]) && matchesDepartment(row.department_id)))

  const resetFilters = () => {
    setSearchTerm('')
    setDepartmentFilter('all')
    setStatusFilter('All')
    setLeaveTypeFilter('All')
    setMonthFilter('All')
    setDateFilter('')
    setSortKey('')
    setSortDirection('asc')
  }

  const toggleSort = (key) => {
    if (sortKey === key) setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDirection('asc') }
  }

  const sortIndicator = (key) => (sortKey === key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '')
  const sortedRows = sortRows(filteredRows, sortKey, sortDirection)
  const attendanceSummary = filteredRows.reduce((summary, row) => ({ ...summary, [row.status]: (summary[row.status] ?? 0) + 1 }), {})
  const leaveSummary = filteredRows.reduce((summary, row) => ({ ...summary, [row.status]: (summary[row.status] ?? 0) + 1 }), {})
  const total = (key) => Number(salarySummary?.[key] ?? 0)
  const reportTitle = reportTypes.find((type) => type.value === reportType)?.label
  const isLoading = loadedQueryKey !== JSON.stringify([reportType, queryFilters])
  const noRows = !isLoading && !error && sortedRows.length === 0

  const renderReport = () => {
    if (reportType === 'employees') return (
      <>
        <SummaryCards cards={[{ label: 'Employees Shown', value: sortedRows.length, tone: 'blue' }, { label: 'Departments Covered', value: new Set(sortedRows.map((row) => row.department_name)).size, tone: 'teal' }]} />
        <Card title="Employee Report" subtitle="Workforce profile and salary overview"><Table columns={[{ key: 'emp_id', label: `Employee ID${sortIndicator('emp_id')}`, render: (value) => <button className="report-sort-button" onClick={() => toggleSort('emp_id')}>EMP-{String(value).padStart(3, '0')}</button> }, { key: 'emp_name', label: `Employee Name${sortIndicator('emp_name')}`, render: (value) => <button className="report-sort-button" onClick={() => toggleSort('emp_name')}>{value}</button> }, { key: 'gender', label: 'Gender' }, { key: 'department_name', label: 'Department' }, { key: 'designation', label: 'Designation' }, { key: 'join_date', label: `Join Date${sortIndicator('join_date')}` }, { key: 'basic_salary', label: `Basic Salary${sortIndicator('basic_salary')}`, render: (value) => formatCurrency(value) }]} rows={sortedRows.map((row) => ({ ...row, id: row.emp_id }))} /></Card>
        <AnalyticsChart title="Department-wise Employee Count" items={departments.map((department) => ({ label: department.department_name, value: Number(department.employee_count), tone: 'blue' }))} />
      </>
    )
    if (reportType === 'attendance') return (
      <>
        <SummaryCards cards={[{ label: 'Total Employees', value: sortedRows.length, tone: 'blue' }, { label: 'Present', value: attendanceSummary.Present ?? 0, tone: 'green' }, { label: 'Absent', value: attendanceSummary.Absent ?? 0, tone: 'rose' }, { label: 'On Leave', value: attendanceSummary['On Leave'] ?? 0, tone: 'amber' }]} />
        <Card title="Attendance Report" subtitle="Daily attendance records"><Table columns={[{ key: 'emp_id', label: `Employee ID${sortIndicator('emp_id')}`, render: (value) => <button className="report-sort-button" onClick={() => toggleSort('emp_id')}>EMP-{String(value).padStart(3, '0')}</button> }, { key: 'emp_name', label: `Employee Name${sortIndicator('emp_name')}`, render: (value) => <button className="report-sort-button" onClick={() => toggleSort('emp_name')}>{value}</button> }, { key: 'attendance_date', label: `Attendance Date${sortIndicator('attendance_date')}` }, { key: 'status', label: `Status${sortIndicator('status')}`, render: (value) => <Badge tone={statusTone(value)}>{value}</Badge> }]} rows={sortedRows.map((row) => ({ ...row, id: row.attendance_id }))} /></Card>
        <AnalyticsChart title="Attendance Status Summary" items={['Present', 'Absent', 'On Leave'].map((status) => ({ label: status, value: attendanceSummary[status] ?? 0, tone: status === 'Present' ? 'green' : status === 'Absent' ? 'rose' : 'amber' }))} />
      </>
    )
    if (reportType === 'leave') return (
      <>
        <SummaryCards cards={[{ label: 'Total Requests', value: sortedRows.length, tone: 'blue' }, { label: 'Pending', value: leaveSummary.Pending ?? 0, tone: 'amber' }, { label: 'Approved', value: leaveSummary.Approved ?? 0, tone: 'green' }, { label: 'Rejected', value: leaveSummary.Rejected ?? 0, tone: 'rose' }]} />
        <Card title="Leave Report" subtitle="Employee leave request history"><Table columns={[{ key: 'leave_id', label: 'Leave ID', render: (value) => `LEAVE-${String(value).padStart(3, '0')}` }, { key: 'emp_id', label: 'Employee ID', render: (value) => `EMP-${String(value).padStart(3, '0')}` }, { key: 'emp_name', label: `Employee Name${sortIndicator('emp_name')}`, render: (value) => <button className="report-sort-button" onClick={() => toggleSort('emp_name')}>{value}</button> }, { key: 'leave_type', label: 'Leave Type' }, { key: 'from_date', label: 'From Date' }, { key: 'to_date', label: 'To Date' }, { key: 'status', label: `Status${sortIndicator('status')}`, render: (value) => <Badge tone={statusTone(value)}>{value}</Badge> }]} rows={sortedRows.map((row) => ({ ...row, id: row.leave_id }))} /></Card>
        <AnalyticsChart title="Leave Status Summary" items={['Pending', 'Approved', 'Rejected'].map((status) => ({ label: status, value: leaveSummary[status] ?? 0, tone: status === 'Approved' ? 'green' : status === 'Pending' ? 'amber' : 'rose' }))} />
      </>
    )
    if (reportType === 'payroll') return (
      <>
        <SummaryCards cards={[{ label: 'Total Basic Salary', value: formatCurrency(total('total_basic_salary')), tone: 'teal' }, { label: 'Total Bonus', value: formatCurrency(total('total_bonus')), tone: 'green' }, { label: 'Total Deductions', value: formatCurrency(total('total_deductions')), tone: 'amber' }, { label: 'Total Net Salary', value: formatCurrency(total('total_net_salary')), tone: 'blue' }]} />
        <Card title="Payroll Report" subtitle="Salary records and net pay analysis"><Table columns={[{ key: 'payroll_id', label: 'Payroll ID', render: (value) => `PAY-${String(value).padStart(3, '0')}` }, { key: 'emp_id', label: 'Employee ID', render: (value) => `EMP-${String(value).padStart(3, '0')}` }, { key: 'emp_name', label: `Employee Name${sortIndicator('emp_name')}`, render: (value) => <button className="report-sort-button" onClick={() => toggleSort('emp_name')}>{value}</button> }, { key: 'department_name', label: 'Department' }, { key: 'month', label: 'Month' }, { key: 'basic_salary', label: `Basic Salary${sortIndicator('basic_salary')}`, render: (value) => formatCurrency(value) }, { key: 'bonus', label: 'Bonus', render: (value) => formatCurrency(value) }, { key: 'deductions', label: 'Deductions', render: (value) => formatCurrency(value) }, { key: 'net_salary', label: `Net Salary${sortIndicator('net_salary')}`, render: (value) => formatCurrency(value) }]} rows={sortedRows.map((row) => ({ ...row, id: row.payroll_id }))} /></Card>
        <AnalyticsChart title="Payroll Salary Summary" items={[{ label: 'Basic', value: total('total_basic_salary'), tone: 'blue' }, { label: 'Bonus', value: total('total_bonus'), tone: 'green' }, { label: 'Deductions', value: total('total_deductions'), tone: 'amber' }, { label: 'Net', value: total('total_net_salary'), tone: 'teal' }]} valueFormatter={formatCurrency} />
      </>
    )
    return (
      <>
        <SummaryCards cards={[{ label: 'Departments Shown', value: sortedRows.length, tone: 'blue' }, { label: 'Employees Covered', value: sortedRows.reduce((totalCount, row) => totalCount + Number(row.employee_count), 0), tone: 'teal' }]} />
        <Card title="Department Report" subtitle="Department-wise employee count"><Table columns={[{ key: 'department_id', label: 'Department ID', render: (value) => `DEP-${String(value).padStart(3, '0')}` }, { key: 'department_name', label: `Department Name${sortIndicator('department_name')}`, render: (value) => <button className="report-sort-button" onClick={() => toggleSort('department_name')}>{value}</button> }, { key: 'employee_count', label: `Number of Employees${sortIndicator('employee_count')}` }]} rows={sortedRows.map((row) => ({ ...row, id: row.department_id }))} /></Card>
        <AnalyticsChart title="Department-wise Employee Count" items={sortedRows.map((row) => ({ label: row.department_name, value: Number(row.employee_count), tone: 'blue' }))} />
      </>
    )
  }

  return (
    <>
      <div className="non-printable">
        <PageHeader title="Reports & Analytics" subtitle="Generate focused HR, attendance, leave, payroll, and department reports" />
        <Card className="report-controls-card">
          <div className="report-controls-grid">
            <Select label="Report Type" value={reportType} onChange={(event) => { setReportType(event.target.value); resetFilters() }} options={reportTypes} />
            <Input label="Employee Search" placeholder="Search ID or name" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            <Select label="Department" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} options={[{ value: 'all', label: 'All departments' }, ...departments.map((department) => ({ value: String(department.department_id), label: department.department_name }))]} />
            {reportType === 'attendance' && <Input label="Attendance Date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />}
            {reportType === 'attendance' && <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} options={['All', 'Present', 'Absent', 'On Leave']} />}
            {reportType === 'leave' && <Select label="Leave Type" value={leaveTypeFilter} onChange={(event) => setLeaveTypeFilter(event.target.value)} options={['All', ...leaveTypes]} />}
            {reportType === 'leave' && <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} options={['All', 'Pending', 'Approved', 'Rejected']} />}
            {reportType === 'payroll' && <Select label="Month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} options={['All', ...months]} />}
          </div>
          <div className="report-controls-footer"><span>{reportTitle} · {sortedRows.length} record{sortedRows.length === 1 ? '' : 's'}</span><div className="report-control-actions"><Button variant="secondary" size="sm" onClick={resetFilters}>Reset Filters</Button><Button size="sm" onClick={() => window.print()}>Print Report</Button></div></div>
        </Card>
      </div>
      <section className="report-output" id="report-print-area">
        <div className="report-print-heading"><h2>{reportTitle}</h2><p>Generated from Employee Payroll Management System</p></div>
        {isLoading && <Loading text="Loading report..." />}
        {error && <ErrorMessage message={error} />}
        {noRows && <div className="info-message" role="status">No records found.</div>}
        {!isLoading && !error && !noRows && renderReport()}
      </section>
    </>
  )
}

export default ReportsPage
