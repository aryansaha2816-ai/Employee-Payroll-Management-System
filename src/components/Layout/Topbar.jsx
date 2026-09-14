import Button from '../ui/Button'

const Topbar = ({ onLogout, onMenuToggle }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-button" aria-label="Toggle menu" onClick={onMenuToggle}>☰</button>
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Employee Payroll Management</h1>
        </div>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <span>⌕</span>
          <input type="text" placeholder="Search" />
        </div>
        <div className="user-pill">
          <span className="avatar">AD</span>
          <div>
            <strong>Admin</strong>
            <small>HR Manager</small>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onLogout}>Logout</Button>
      </div>
    </header>
  )
}

export default Topbar
