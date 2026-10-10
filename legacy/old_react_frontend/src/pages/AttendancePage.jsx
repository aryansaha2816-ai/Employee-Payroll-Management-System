import PageHeader from '../components/common/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import Input from '../components/ui/Input'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { createAttendance, getAttendance, getDepartments, getEmployees, updateAttendance } from '../services/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

const statusOptions = ['Present', 'Absent']

const AttendancePage = () => {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [successMessage, setSuccessMessage] = useState('')
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [employeeData, departmentData, attendanceData] = await Promise.all([getEmployees(), getDepartments(), getAttendance({ date: selectedDate })])
      setEmployees(employeeData)
      setDepartments(departmentData)
      setAttendanceRecords(attendanceData)
      if (!selectedDate && attendanceData.length) {
        setSelectedDate(attendanceData.reduce((latest, record) => record.attendance_date > latest ? record.attendance_date : latest, ''))
      }
      setError('')
    } catch (loadError) { setError(loadError.message) }
    finally { setIsLoading(false) }
  }, [selectedDate])

  useEffect(() => { void Promise.resolve().then(loadData) }, [loadData])

  const showSuccess = (message) => {
    setSuccessMessage(message)
    window.setTimeout(() => setSuccessMessage(''), 3000)
  }

  const updateStatus = async (employeeId, status) => {
    try {
      const existing = attendanceRecords.find((record) => record.emp_id === employeeId)
      if (existing) await updateAttendance(existing.attendance_id, { emp_id: employeeId, attendance_date: selectedDate, status })
      else await createAttendance({ emp_id: employeeId, attendance_date: selectedDate, status })
      await loadData()
      showSuccess(`Attendance marked ${status.toLowerCase()} successfully.`)
    } catch (saveError) { setError(saveError.message) }
  }

  const markAllPresent = async () => {
    try {
      await Promise.all(employees.map((employee) => updateStatus(employee.emp_id, 'Present')))
      setShowBulkConfirmation(false)
      showSuccess('All employees marked present for the selected date.')
    } catch (saveError) { setError(saveError.message) }
  }

  const dateRecords = useMemo(() => attendanceRecords.map((record) => ({
    ...record,
    department_id: employees.find((employee) => employee.emp_id === record.emp_id)?.department_id,
    department_name: employees.find((employee) => employee.emp_id === record.emp_id)?.department_name,
  })), [attendanceRecords, employees])

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return dateRecords.filter((record) => {
      const matchesSearch = !query || [record.emp_id, record.emp_name].some((value) => (
        String(value).toLowerCase().includes(query)
      ))
      const matchesDepartment = departmentFilter === 'all' || String(record.department_id) === departmentFilter
      return matchesSearch && matchesDepartment
    })
  }, [dateRecords, departmentFilter, searchTerm])

  const summary = statusOptions.reduce((counts, status) => ({
    ...counts,
    [status]: filteredRecords.filter((record) => record.status === status).length,
  }), {})

  const rows = filteredRecords.map((record) => ({ ...record, id: record.attendance_id }))

  return (
    <>
      <PageHeader
        title="Attendance Management"
        subtitle="Track and update daily employee attendance"
        action={<Button size="sm" onClick={() => setShowBulkConfirmation(true)}>Mark All Present</Button>}
      />

      {successMessage && <div className="success-message" role="status">{successMessage}</div>}
      {error && <ErrorMessage message={error} />}

      <Card className="attendance-controls-card">
        <div className="attendance-toolbar">
          <Input
            label="Attendance Date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
          <Input
            label="Search Employee"
            placeholder="Search by ID or name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="field-group">
            <label className="field-label" htmlFor="attendance-department-filter">Department</label>
            <select
              id="attendance-department-filter"
              className="select"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="all">All departments</option>
              {departments.map((department) => (
                <option key={department.department_id} value={department.department_id}>{department.department_name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="attendance-summary-grid">
        <Card className="attendance-summary-card total"><span>Total Employees</span><strong>{filteredRecords.length}</strong></Card>
        <Card className="attendance-summary-card present"><span>Present</span><strong>{summary.Present}</strong></Card>
        <Card className="attendance-summary-card absent"><span>Absent</span><strong>{summary.Absent}</strong></Card>
        <Card className="attendance-summary-card leave"><span>On Leave</span><strong>{summary['On Leave']}</strong></Card>
      </div>

      <Card className="attendance-table-card">
        <div className="attendance-table-heading">
          <div>
            <h3 className="card-title">Daily Attendance</h3>
            <p className="card-subtitle">{selectedDate} · {filteredRecords.length} employees shown</p>
          </div>
          <span className="attendance-legend"><span className="status-dot success" /> Present <span className="status-dot danger" /> Absent <span className="status-dot warning" /> On Leave</span>
        </div>
        {isLoading ? <Loading text="Loading attendance..." /> : <Table
          columns={[
            { key: 'emp_id', label: 'Employee ID', render: (value) => `EMP-${String(value).padStart(3, '0')}` },
            { key: 'emp_name', label: 'Employee Name' },
            { key: 'department_name', label: 'Department' },
            { key: 'attendance_date', label: 'Attendance Date' },
            {
              key: 'status',
              label: 'Status',
              render: (value) => <Badge tone={value === 'Present' ? 'success' : value === 'Absent' ? 'danger' : 'warning'}>{value}</Badge>,
            },
            {
              key: 'actions',
              label: 'Action',
              render: (_, record) => (
                <div className="attendance-actions">
                  {statusOptions.map((status) => (
                    <button
                      className={`attendance-action ${status === record.status ? 'selected' : ''} ${status.toLowerCase().replace(' ', '-')}`}
                      key={status}
                      onClick={() => updateStatus(record.emp_id, status)}
                    >
                      {status === 'On Leave' ? 'Leave' : status}
                    </button>
                  ))}
                </div>
              ),
            },
          ]}
          rows={rows}
        />}
        {!isLoading && filteredRecords.length === 0 && <p className="empty-state">No attendance records found for this date.</p>}
      </Card>

      <ConfirmationDialog
        isOpen={showBulkConfirmation}
        title="Mark All Present"
        message={`Mark all ${employees.length} employees as Present for ${selectedDate}?`}
        onConfirm={markAllPresent}
        onCancel={() => setShowBulkConfirmation(false)}
      />
    </>
  )
}

export default AttendancePage
