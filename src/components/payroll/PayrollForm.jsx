import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { calculateNetSalary, formatCurrency } from '../../utils/payroll'

const PayrollForm = ({ employees, payroll, existingPayrolls, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    emp_id: payroll ? String(payroll.emp_id) : '',
    month: payroll?.month ?? 'Sep 2026',
    bonus: payroll ? String(payroll.bonus) : '0',
    deductions: payroll ? String(payroll.deductions) : '0',
  })
  const [errors, setErrors] = useState({})
  const selectedEmployee = employees.find((employee) => employee.emp_id === Number(formData.emp_id))
  const basicSalary = payroll?.basic_salary ?? selectedEmployee?.basic_salary ?? 0
  const netSalary = calculateNetSalary(basicSalary, formData.bonus, formData.deductions)

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!formData.emp_id) nextErrors.emp_id = 'Employee is required.'
    if (!formData.month) nextErrors.month = 'Month is required.'
    if (Number(formData.bonus) < 0) nextErrors.bonus = 'Bonus cannot be negative.'
    if (Number(formData.deductions) < 0) nextErrors.deductions = 'Deductions cannot be negative.'
    if (netSalary < 0) nextErrors.deductions = 'Deductions cannot exceed the total salary.'

    const isDuplicate = existingPayrolls.some((item) => (
      item.emp_id === Number(formData.emp_id)
      && item.month === formData.month
      && item.payroll_id !== payroll?.payroll_id
    ))
    if (isDuplicate) nextErrors.emp_id = 'Payroll already exists for this employee and month.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      emp_id: Number(formData.emp_id),
      month: formData.month,
      basic_salary: basicSalary,
      bonus: Number(formData.bonus || 0),
      deductions: Number(formData.deductions || 0),
      net_salary: netSalary,
    })
  }

  return (
    <form className="payroll-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div>
          <Select
            label="Employee"
            value={formData.emp_id}
            disabled={Boolean(payroll)}
            onChange={(event) => updateField('emp_id', event.target.value)}
            options={[{ value: '', label: 'Select employee' }, ...employees.map((employee) => ({
              value: String(employee.emp_id),
              label: `EMP-${String(employee.emp_id).padStart(3, '0')} · ${employee.emp_name}`,
            }))]}
          />
          {errors.emp_id && <span className="field-error">{errors.emp_id}</span>}
        </div>
        <div>
          <Select
            label="Month"
            value={formData.month}
            disabled={Boolean(payroll)}
            onChange={(event) => updateField('month', event.target.value)}
            options={['Sep 2026', 'Aug 2026', 'Jul 2026', 'Jun 2026']}
          />
          {errors.month && <span className="field-error">{errors.month}</span>}
        </div>
        <div>
          <Input label="Basic Salary" value={basicSalary ? formatCurrency(basicSalary) : 'Select an employee'} readOnly />
        </div>
        <div>
          <Input label="Bonus" type="number" min="0" value={formData.bonus} onChange={(event) => updateField('bonus', event.target.value)} />
          {errors.bonus && <span className="field-error">{errors.bonus}</span>}
        </div>
        <div>
          <Input label="Deductions" type="number" min="0" value={formData.deductions} onChange={(event) => updateField('deductions', event.target.value)} />
          {errors.deductions && <span className="field-error">{errors.deductions}</span>}
        </div>
        <div className="net-salary-preview">
          <span>Calculated Net Salary</span>
          <strong>{formatCurrency(netSalary)}</strong>
        </div>
      </div>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{payroll ? 'Update Payroll' : 'Generate Payroll'}</Button>
      </div>
    </form>
  )
}

export default PayrollForm
