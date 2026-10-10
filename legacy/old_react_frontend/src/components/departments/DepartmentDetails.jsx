import Badge from '../ui/Badge'

const DepartmentDetails = ({ department, employees }) => (
  <div className="department-details">
    <div className="department-profile-heading">
      <div className="department-profile-icon">{department.department_name.slice(0, 1).toUpperCase()}</div>
      <div>
        <h3>{department.department_name}</h3>
        <p>Department ID: DEP-{String(department.department_id).padStart(3, '0')}</p>
      </div>
      <Badge tone="info">Active</Badge>
    </div>
    <div className="department-detail-summary">
      <span>Number of Employees</span>
      <strong>{employees.length}</strong>
    </div>
    <h4>Employees in this department</h4>
    {employees.length > 0 ? (
      <div className="department-member-list">
        {employees.map((employee) => (
          <div className="department-member" key={employee.emp_id}>
            <span className="member-avatar">{employee.emp_name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{employee.emp_name}</strong>
              <small>{employee.designation}</small>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="empty-state">No employees are assigned to this department.</p>
    )}
  </div>
)

export default DepartmentDetails
