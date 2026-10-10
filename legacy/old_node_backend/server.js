require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { testDatabaseConnection } = require('./config/db')
const employeeRoutes = require('./routes/employeeRoutes')
const departmentRoutes = require('./routes/departmentRoutes')
const attendanceRoutes = require('./routes/attendanceRoutes')
const leaveRoutes = require('./routes/leaveRoutes')
const payrollRoutes = require('./routes/payrollRoutes')
const payslipRoutes = require('./routes/payslipRoutes')
const reportRoutes = require('./routes/reportRoutes')

const app = express()
const port = Number(process.env.PORT || 5000)

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Employee Payroll Management System API is running',
  })
})

app.use('/api/employees', employeeRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/leaves', leaveRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/payslips', payslipRoutes)
app.use('/api/reports', reportRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

app.use((error, req, res, next) => {
  console.error(`Server error: ${error.message}`)

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with the same unique value already exists',
    })
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'The referenced department does not exist',
    })
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({
      success: false,
      message: 'This record cannot be deleted because related records exist',
    })
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
})

const startServer = async () => {
  await testDatabaseConnection()
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })

  server.on('error', (error) => {
    console.error(`Server startup failed: ${error.message}`)
    process.exitCode = 1
  })
}

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`)
  process.exitCode = 1
})
