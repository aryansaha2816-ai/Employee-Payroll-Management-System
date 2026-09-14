import { NavLink } from 'react-router-dom'

const menuItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Employees', to: '/employees' },
  { label: 'Departments', to: '/departments' },
  { label: 'Attendance', to: '/attendance' },
  { label: 'Leave Management', to: '/leave-management' },
  { label: 'Payroll', to: '/payroll' },
  { label: 'Payslip', to: '/payslip' },
  { label: 'Reports', to: '/reports' },
]

const Sidebar = ({ isOpen, onNavigate }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-box">
        <div className="brand-logo">EP</div>
        <div>
          <h2>Employee Payroll</h2>
          <small>Admin Portal</small>
        </div>
      </div>

      <nav className="nav-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
