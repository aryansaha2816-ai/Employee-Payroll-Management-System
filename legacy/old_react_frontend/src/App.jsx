import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import AttendancePage from './pages/AttendancePage'
import DashboardPage from './pages/DashboardPage'
import DepartmentsPage from './pages/DepartmentsPage'
import EmployeesPage from './pages/EmployeesPage'
import LeaveManagementPage from './pages/LeaveManagementPage'
import LoginPage from './pages/LoginPage'
import PayrollPage from './pages/PayrollPage'
import PayslipPage from './pages/PayslipPage'
import ReportsPage from './pages/ReportsPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => (
    localStorage.getItem('payroll-authenticated') === 'true'
  ))

  const handleLogin = (rememberMe) => {
    localStorage.setItem('payroll-authenticated', 'true')
    localStorage.setItem('payroll-remembered', String(rememberMe))
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('payroll-authenticated')
    localStorage.removeItem('payroll-remembered')
    setIsAuthenticated(false)
  }

  return (
    <BrowserRouter>
        <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/departments" element={<DepartmentsPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/leave-management" element={<LeaveManagementPage />} />
                  <Route path="/payroll" element={<PayrollPage />} />
                  <Route path="/payslip" element={<PayslipPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        </Routes>
    </BrowserRouter>
  )
}

export default App
