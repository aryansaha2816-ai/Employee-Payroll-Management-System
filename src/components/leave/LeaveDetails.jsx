import Badge from '../ui/Badge'

const LeaveDetails = ({ leave }) => (
  <div className="leave-details">
    <div className="leave-profile-heading">
      <div className="employee-profile-avatar">{leave.emp_name.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>{leave.emp_name}</h3>
        <p>EMP-{String(leave.emp_id).padStart(3, '0')} · {leave.department_name}</p>
      </div>
      <Badge tone={leave.status === 'Approved' ? 'success' : leave.status === 'Pending' ? 'warning' : 'danger'}>{leave.status}</Badge>
    </div>
    <div className="details-grid">
      <div><small>Leave ID</small><strong>LEAVE-{String(leave.leave_id).padStart(3, '0')}</strong></div>
      <div><small>Leave Type</small><strong>{leave.leave_type}</strong></div>
      <div><small>From Date</small><strong>{leave.from_date}</strong></div>
      <div><small>To Date</small><strong>{leave.to_date}</strong></div>
      <div className="detail-wide"><small>Department</small><strong>{leave.department_name}</strong></div>
      <div className="detail-wide"><small>Reason</small><strong>{leave.reason || 'No reason provided'}</strong></div>
    </div>
  </div>
)

export default LeaveDetails
