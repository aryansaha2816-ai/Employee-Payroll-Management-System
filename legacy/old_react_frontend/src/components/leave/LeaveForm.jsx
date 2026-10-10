import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'

const leaveTypes = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Other']

const LeaveForm = ({ employees, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    emp_id: '',
    leave_type: '',
    from_date: '',
    to_date: '',
    reason: '',
  })
  const [errors, setErrors] = useState({})

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    const requiredFields = ['emp_id', 'leave_type', 'from_date', 'to_date', 'reason']

    requiredFields.forEach((field) => {
      if (!String(formData[field]).trim()) nextErrors[field] = 'This field is required.'
    })

    if (formData.from_date && formData.to_date && formData.to_date < formData.from_date) {
      nextErrors.to_date = 'To date cannot be before the from date.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const employee = employees.find((item) => item.emp_id === Number(formData.emp_id))
    onSubmit({
      emp_id: employee.emp_id,
      emp_name: employee.emp_name,
      department_id: employee.department_id,
      department_name: employee.department_name,
      leave_type: formData.leave_type,
      from_date: formData.from_date,
      to_date: formData.to_date,
      reason: formData.reason.trim(),
      status: 'Pending',
    })
  }

  return (
    <form className="leave-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div>
          <Select
            label="Employee"
            value={formData.emp_id}
            onChange={(event) => updateField('emp_id', event.target.value)}
            options={[
              { value: '', label: 'Select employee' },
              ...employees.map((employee) => ({
                value: String(employee.emp_id),
                label: `EMP-${String(employee.emp_id).padStart(3, '0')} · ${employee.emp_name}`,
              })),
            ]}
          />
          {errors.emp_id && <span className="field-error">{errors.emp_id}</span>}
        </div>
        <div>
          <Select
            label="Leave Type"
            value={formData.leave_type}
            onChange={(event) => updateField('leave_type', event.target.value)}
            options={[{ value: '', label: 'Select leave type' }, ...leaveTypes]}
          />
          {errors.leave_type && <span className="field-error">{errors.leave_type}</span>}
        </div>
        <div>
          <Input label="From Date" type="date" value={formData.from_date} onChange={(event) => updateField('from_date', event.target.value)} />
          {errors.from_date && <span className="field-error">{errors.from_date}</span>}
        </div>
        <div>
          <Input label="To Date" type="date" value={formData.to_date} onChange={(event) => updateField('to_date', event.target.value)} />
          {errors.to_date && <span className="field-error">{errors.to_date}</span>}
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="leave-reason">Reason</label>
        <textarea
          id="leave-reason"
          className="textarea"
          rows="3"
          value={formData.reason}
          onChange={(event) => updateField('reason', event.target.value)}
          placeholder="Add a short reason for this leave request"
        />
        {errors.reason && <span className="field-error">{errors.reason}</span>}
      </div>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Submit Leave</Button>
      </div>
    </form>
  )
}

export default LeaveForm
