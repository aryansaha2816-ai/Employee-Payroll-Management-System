import Badge from '../ui/Badge'
import Table from '../ui/Table'

const DepartmentTable = ({ departments, onView, onEdit, onDelete }) => (
  <Table
    columns={[
      { key: 'department_id', label: 'Department ID', render: (value) => `DEP-${String(value).padStart(3, '0')}` },
      { key: 'department_name', label: 'Department Name' },
      { key: 'employee_count', label: 'Number of Employees' },
      { key: 'status', label: 'Status', render: () => <Badge tone="info">Active</Badge> },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, department) => (
          <div className="table-actions">
            <button className="table-action view" onClick={() => onView(department)}>View</button>
            <button className="table-action edit" onClick={() => onEdit(department)}>Edit</button>
            <button className="table-action delete" onClick={() => onDelete(department)}>Delete</button>
          </div>
        ),
      },
    ]}
    rows={departments.map((department) => ({ ...department, id: department.department_id }))}
  />
)

export default DepartmentTable
