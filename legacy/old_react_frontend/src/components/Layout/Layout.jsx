import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const Layout = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} />
      <div className="main-panel">
        <Topbar onLogout={onLogout} onMenuToggle={() => setIsSidebarOpen((open) => !open)} />
        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}

export default Layout
