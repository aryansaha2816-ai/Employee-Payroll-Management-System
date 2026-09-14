import Badge from '../ui/Badge'
import { formatCurrency } from '../../utils/payroll'

const PayrollDetails = ({ payroll }) => (
  <div className="payroll-details">
    <div className="payroll-profile-heading">
      <div className="employee-profile-avatar">{payroll.emp_name.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>{payroll.emp_name}</h3>
        <p>EMP-{String(payroll.emp_id).padStart(3, '0')} · {payroll.department_name}</p>
      </div>
      <Badge tone="success">Processed</Badge>
    </div>
    <div className="details-grid">
      <div><small>Payroll ID</small><strong>PAY-{String(payroll.payroll_id).padStart(3, '0')}</strong></div>
      <div><small>Month</small><strong>{payroll.month}</strong></div>
      <div><small>Basic Salary</small><strong>{formatCurrency(payroll.basic_salary)}</strong></div>
      <div><small>Bonus</small><strong>{formatCurrency(payroll.bonus)}</strong></div>
      <div><small>Deductions</small><strong>{formatCurrency(payroll.deductions)}</strong></div>
      <div><small>Net Salary</small><strong className="net-value">{formatCurrency(payroll.net_salary)}</strong></div>
    </div>
  </div>
)

export default PayrollDetails
