import Badge from '../ui/Badge'
import { formatCurrency } from '../../utils/payroll'

const PayslipDocument = ({ employee, payroll }) => (
  <article className="payslip-document" id="payslip-print-area">
    <header className="payslip-document-header">
      <div className="payslip-company-mark">EP</div>
      <div>
        <h2>Employee Payroll Management System</h2>
        <p>Salary Payslip</p>
      </div>
      <div className="payslip-month">
        <span>Salary Month</span>
        <strong>{payroll.month}</strong>
      </div>
    </header>

    <section className="payslip-employee-section">
      <div>
        <small>Employee ID</small>
        <strong>EMP-{String(employee.emp_id).padStart(3, '0')}</strong>
      </div>
      <div>
        <small>Employee Name</small>
        <strong>{employee.emp_name}</strong>
      </div>
      <div>
        <small>Department</small>
        <strong>{employee.department_name}</strong>
      </div>
      <div>
        <small>Designation</small>
        <strong>{employee.designation}</strong>
      </div>
      <div>
        <small>Join Date</small>
        <strong>{employee.join_date}</strong>
      </div>
    </section>

    <section className="payslip-salary-section">
      <div className="payslip-section-heading">
        <h3>Salary Details</h3>
        <Badge tone="success">Processed</Badge>
      </div>
      <div className="payslip-salary-row"><span>Basic Salary</span><strong>{formatCurrency(payroll.basic_salary)}</strong></div>
      <div className="payslip-salary-row"><span>Bonus</span><strong>{formatCurrency(payroll.bonus)}</strong></div>
      <div className="payslip-salary-row deduction"><span>Deductions</span><strong>- {formatCurrency(payroll.deductions)}</strong></div>
      <div className="payslip-net-row"><span>Net Salary</span><strong>{formatCurrency(payroll.net_salary)}</strong></div>
    </section>

    <footer className="payslip-document-footer">
      <span>Payroll ID: PAY-{String(payroll.payroll_id).padStart(3, '0')}</span>
      <span>Generated from Employee Payroll Management System</span>
    </footer>
  </article>
)

export default PayslipDocument
