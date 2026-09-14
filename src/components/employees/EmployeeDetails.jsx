import Badge from '../ui/Badge'

const EmployeeDetails = ({ employee }) => (
  <div className="employee-details">
    <div className="employee-profile-heading">
      <div className="employee-profile-avatar">{employee.emp_name.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>{employee.emp_name}</h3>
        <p>{employee.designation}</p>
      </div>
      <Badge tone="success">Active</Badge>
    </div>
    <div className="details-grid">
      <div><small>Employee ID</small><strong>EMP-{String(employee.emp_id).padStart(3, '0')}</strong></div>
      <div><small>Gender</small><strong>{employee.gender}</strong></div>
      <div><small>Department</small><strong>{employee.department_name}</strong></div>
      <div><small>Join Date</small><strong>{employee.join_date}</strong></div>
      <div><small>Basic Salary</small><strong>₹ {employee.basic_salary.toLocaleString()}</strong></div>
    </div>
  </div>
)

export default EmployeeDetails
