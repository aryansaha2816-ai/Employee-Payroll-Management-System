import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Table from '../components/ui/Table'
import LeaveDetails from '../components/leave/LeaveDetails'
import LeaveForm from '../components/leave/LeaveForm'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import { createLeave, getEmployees, getLeaves, updateLeave } from '../services/api'

const statusOptions = ['Pending', 'Approved', 'Rejected']

const statusTone = (status) => (status === 'Approved' ? 'success' : status === 'Pending' ? 'warning' : 'danger')

const LeaveManagementPage = () => {
  const [employees, setEmployees] = useState([])
  const [leaveList, setLeaveList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [modalMode, setModalMode] = useState(null)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [employeeData, leaveData] = await Promise.all([getEmployees(), getLeaves()])
      setEmployees(employeeData)
      setLeaveList(leaveData)
      setError('')
    } catch (loadError) { setError(loadError.message) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { void Promise.resolve().then(loadData) }, [loadData])

  const syncedLeaves = useMemo(() => leaveList.map((leave) => {
    const employee = employees.find((item) => item.emp_id === leave.emp_id)
    return employee ? { ...leave, emp_name: employee.emp_name, department_id: employee.department_id, department_name: employee.department_name } : leave
  }), [employees, leaveList])

  const filteredLeaves = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return syncedLeaves.filter((leave) => {
      const matchesSearch = !query || [leave.leave_id, leave.emp_id, leave.emp_name, leave.department_name, leave.leave_type]
        .some((value) => String(value).toLowerCase().includes(query))
      const matchesStatus = statusFilter === 'All' || leave.status === statusFilter
      const matchesType = typeFilter === 'All' || leave.leave_type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [searchTerm, statusFilter, syncedLeaves, typeFilter])

  const leaveTypes = [...new Set(syncedLeaves.map((leave) => leave.leave_type))]
  const summary = statusOptions.reduce((counts, status) => ({
    ...counts,
    [status]: filteredLeaves.filter((leave) => leave.status === status).length,
  }), {})

  const showSuccess = (message) => {
    setSuccessMessage(message)
    window.setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleSubmit = async (leave) => {
    try {
      await createLeave(leave)
      await loadData()
      setModalMode(null)
      showSuccess('Leave request submitted successfully and marked Pending.')
    } catch (saveError) { setError(saveError.message) }
  }

  const updateStatus = async (leaveId, status) => {
    try {
      const leave = leaveList.find((item) => item.leave_id === leaveId)
      await updateLeave(leaveId, { emp_id: leave.emp_id, leave_type: leave.leave_type, from_date: leave.from_date, to_date: leave.to_date, status })
      await loadData()
      setPendingAction(null)
      showSuccess(`Leave request ${status.toLowerCase()} successfully.`)
    } catch (saveError) { setError(saveError.message) }
  }

  return (
    <>
      <PageHeader
        title="Leave Management"
        subtitle="Review, submit, and manage employee leave requests"
        action={<Button size="sm" onClick={() => setModalMode('apply')}>Apply Leave</Button>}
      />

      {successMessage && <div className="success-message" role="status">{successMessage}</div>}
      {error && <ErrorMessage message={error} />}

      <div className="leave-summary-grid">
        <Card className="leave-summary-card total"><span>Total Leave Requests</span><strong>{filteredLeaves.length}</strong></Card>
        <Card className="leave-summary-card pending"><span>Pending</span><strong>{summary.Pending}</strong></Card>
        <Card className="leave-summary-card approved"><span>Approved</span><strong>{summary.Approved}</strong></Card>
        <Card className="leave-summary-card rejected"><span>Rejected</span><strong>{summary.Rejected}</strong></Card>
      </div>

      <Card className="leave-list-card">
        <div className="leave-toolbar">
          <Input
            className="leave-search"
            placeholder="Search by leave ID, employee, department or leave type"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search leave records"
          />
          <select className="select leave-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option>All</option>
            {statusOptions.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select className="select leave-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by leave type">
            <option>All</option>
            {leaveTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>
        {isLoading ? <Loading text="Loading leave records..." /> : <Table
          columns={[
            { key: 'leave_id', label: 'Leave ID', render: (value) => `LEAVE-${String(value).padStart(3, '0')}` },
            { key: 'emp_id', label: 'Employee ID', render: (value) => `EMP-${String(value).padStart(3, '0')}` },
            { key: 'emp_name', label: 'Employee Name' },
            { key: 'department_name', label: 'Department' },
            { key: 'leave_type', label: 'Leave Type' },
            { key: 'from_date', label: 'From Date' },
            { key: 'to_date', label: 'To Date' },
            { key: 'status', label: 'Status', render: (value) => <Badge tone={statusTone(value)}>{value}</Badge> },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, leave) => (
                <div className="table-actions leave-actions">
                  <button className="table-action view" onClick={() => { setSelectedLeave(leave); setModalMode('view') }}>View</button>
                  {leave.status === 'Pending' && <>
                    <button className="table-action approve" onClick={() => setPendingAction({ leave, status: 'Approved' })}>Approve</button>
                    <button className="table-action delete" onClick={() => setPendingAction({ leave, status: 'Rejected' })}>Reject</button>
                  </>}
                </div>
              ),
            },
          ]}
          rows={filteredLeaves.map((leave) => ({ ...leave, id: leave.leave_id }))}
        />}
        {!isLoading && filteredLeaves.length === 0 && <p className="empty-state">No leave records match the selected filters.</p>}
      </Card>

      <Modal isOpen={modalMode === 'apply'} onClose={() => setModalMode(null)} title="Apply Leave">
        <LeaveForm employees={employees} onSubmit={handleSubmit} onCancel={() => setModalMode(null)} />
      </Modal>

      <Modal isOpen={modalMode === 'view'} onClose={() => setModalMode(null)} title="Leave Request Details">
        <LeaveDetails leave={selectedLeave} />
      </Modal>

      <ConfirmationDialog
        isOpen={Boolean(pendingAction)}
        title={`${pendingAction?.status ?? ''} Leave Request`}
        message={pendingAction ? `Are you sure you want to mark this leave request as ${pendingAction.status}?` : ''}
        onConfirm={() => updateStatus(pendingAction.leave.leave_id, pendingAction.status)}
        onCancel={() => setPendingAction(null)}
      />
    </>
  )
}

export default LeaveManagementPage
