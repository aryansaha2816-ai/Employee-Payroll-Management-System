import { useEffect, useState } from 'react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loading from '../components/ui/Loading'
import Table from '../components/ui/Table'
import PageHeader from '../components/common/PageHeader'
import { useNavigate } from 'react-router-dom'
import { getAttendance, getDepartments, getEmployees, getLeaves, getPayroll, getSalarySummary } from '../services/api'
import { formatCurrency } from '../utils/payroll'

const quickActions = [
  { label: 'Add Employee', description: 'Create employee profile', route: '/employees', icon: '+' },
  { label: 'Mark Attendance', description: 'Record today\'s status', route: '/attendance', icon: '✓' },
  { label: 'Apply Leave', description: 'Submit leave request', route: '/leave-management', icon: '↗' },
  { label: 'Generate Payroll', description: 'Process monthly salary', route: '/payroll', icon: '₹' },
  { label: 'View Payslip', description: 'Open employee payslip', route: '/payslip', icon: '▤' },
]

const DashboardPage = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    Promise.all([getEmployees(), getDepartments(), getAttendance(), getLeaves(), getPayroll(), getSalarySummary()])
      .then(([employees, departments, attendance, leaves, payroll, salarySummary]) => {
        if (isCurrent) setData({ employees, departments, attendance, leaves, payroll, salarySummary })
      })
      .catch((requestError) => { if (isCurrent) setError(requestError.message) })
      .finally(() => { if (isCurrent) setIsLoading(false) })
    return () => { isCurrent = false }
  }, [])

  if (isLoading) return <Loading text="Loading dashboard..." />
  if (error) return <ErrorMessage message={error} />

  const { employees, departments, attendance, leaves, payroll, salarySummary } = data
  const latestAttendanceDate = attendance.reduce((latest, record) => record.attendance_date > latest ? record.attendance_date : latest, '')
  const latestAttendance = attendance.filter((record) => record.attendance_date === latestAttendanceDate)
  const attendanceCounts = latestAttendance.reduce((counts, record) => ({ ...counts, [record.status]: (counts[record.status] ?? 0) + 1 }), {})
  const attendanceTotal = latestAttendance.length || 1
  const pendingLeaves = leaves.filter((leave) => leave.status === 'Pending').length
  const recentPayrollRows = payroll.slice(0, 4).map((item) => ({ ...item, id: item.payroll_id }))
  const recentMonth = payroll[0]?.month ?? 'Current month'
  const netTotal = Number(salarySummary.total_net_salary ?? 0)
  const payrollSummary = [
    { label: 'Basic Salary', value: Number(salarySummary.total_basic_salary ?? 0), color: 'blue' },
    { label: 'Bonus', value: Number(salarySummary.total_bonus ?? 0), color: 'teal' },
    { label: 'Deductions', value: Number(salarySummary.total_deductions ?? 0), color: 'amber' },
    { label: 'Net Salary', value: netTotal, color: 'green' },
  ]
  const summaryCards = [
    { label: 'Total Employees', value: employees.length, detail: 'Live database records', tone: 'blue' },
    { label: 'Total Departments', value: departments.length, detail: 'Live database records', tone: 'teal' },
    { label: 'Present Today', value: attendanceCounts.Present ?? 0, detail: latestAttendanceDate || 'No attendance date', tone: 'green' },
    { label: 'Pending Leaves', value: pendingLeaves, detail: 'Awaiting review', tone: 'amber' },
    { label: 'Current Payroll', value: formatCurrency(netTotal), detail: 'All payroll records', tone: 'violet' },
    { label: 'Payroll Records', value: payroll.length, detail: 'Stored payroll records', tone: 'rose' },
  ]
  const activities = [
    { title: 'Live data connected', detail: `${employees.length} employees and ${payroll.length} payroll records loaded`, tone: 'success' },
    { title: 'Attendance date', detail: latestAttendanceDate || 'No attendance records available', tone: 'info' },
    { title: 'Leave queue', detail: `${pendingLeaves} pending leave request${pendingLeaves === 1 ? '' : 's'}`, tone: 'warning' },
  ]

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Payroll administration overview" action={<Button variant="primary" size="sm" onClick={() => navigate('/reports')}>Generate Report</Button>} />
      <section className="stats-grid dashboard-stats" aria-label="Payroll summary">
        {summaryCards.map((stat) => <Card key={stat.label} className={`stat-card stat-card-${stat.tone}`}><p>{stat.label}</p><h3>{stat.value}</h3><span className="stat-detail">{stat.detail}</span></Card>)}
      </section>
      <Card title="Quick Actions" subtitle="Common payroll administration tasks" className="quick-actions-card"><div className="quick-actions-grid">{quickActions.map((action) => <button className="quick-action" key={action.label} onClick={() => navigate(action.route)}><span className="quick-action-icon">{action.icon}</span><span><strong>{action.label}</strong><small>{action.description}</small></span><span className="quick-action-arrow">→</span></button>)}</div></Card>
      <div className="dashboard-grid">
        <Card title="Attendance Summary" subtitle={latestAttendanceDate || 'Latest available date'} className="span-2"><div className="attendance-summary"><div className="attendance-ring" aria-label={`${Math.round(((attendanceCounts.Present ?? 0) / attendanceTotal) * 100)} percent attendance`}><strong>{Math.round(((attendanceCounts.Present ?? 0) / attendanceTotal) * 100)}%</strong><span>Present</span></div><div className="attendance-breakdown">{['Present', 'Absent', 'On Leave'].map((status) => <div className="attendance-stat" key={status}><div className="attendance-stat-label"><span className={`status-dot ${status === 'Present' ? 'success' : status === 'Absent' ? 'danger' : 'warning'}`} /><span>{status}</span></div><strong>{attendanceCounts[status] ?? 0}</strong><small>{Math.round(((attendanceCounts[status] ?? 0) / attendanceTotal) * 100)}%</small></div>)}</div></div></Card>
        <Card title="Recent Activities" subtitle="Live system information"><div className="activity-list">{activities.map((activity) => <div className="activity-item" key={activity.title}><span className={`activity-icon ${activity.tone}`}>•</span><div><strong>{activity.title}</strong><small>{activity.detail}</small></div></div>)}</div></Card>
        <Card title="Payroll Summary" subtitle={recentMonth} className="span-2"><div className="payroll-summary">{payrollSummary.map((item) => <div className="payroll-summary-row" key={item.label}><div className="payroll-summary-label"><span className={`status-dot ${item.color}`} /><span>{item.label}</span></div><div className="payroll-bar-track"><span className={`payroll-bar ${item.color}`} style={{ width: `${netTotal ? Math.min(Math.round((item.value / netTotal) * 100), 100) : 0}%` }} /></div><strong>{formatCurrency(item.value)}</strong></div>)}</div></Card>
        <Card title="Recent Payroll" subtitle="Latest stored records"><Table columns={[{ key: 'emp_name', label: 'Employee' }, { key: 'month', label: 'Month' }, { key: 'net_salary', label: 'Net Salary', render: (value) => formatCurrency(value) }, { key: 'status', label: 'Status', render: () => <Badge tone="success">Processed</Badge> }]} rows={recentPayrollRows} /></Card>
      </div>
    </>
  )
}

export default DashboardPage
