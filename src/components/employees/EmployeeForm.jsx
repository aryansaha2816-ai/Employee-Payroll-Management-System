import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'

const EmployeeForm = ({ employee, departments, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(() => ({
    emp_name: employee?.emp_name ?? '',
    gender: employee?.gender ?? '',
    department_id: employee?.department_id ? String(employee.department_id) : '',
    designation: employee?.designation ?? '',
    join_date: employee?.join_date ?? '',
    basic_salary: employee?.basic_salary ? String(employee.basic_salary) : '',
  }))
  const [errors, setErrors] = useState({})

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    const requiredFields = ['emp_name', 'gender', 'department_id', 'designation', 'join_date', 'basic_salary']

    requiredFields.forEach((field) => {
      if (!String(formData[field]).trim()) nextErrors[field] = 'This field is required.'
    })

    if (formData.basic_salary && Number(formData.basic_salary) <= 0) {
      nextErrors.basic_salary = 'Enter a salary greater than zero.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      emp_name: formData.emp_name.trim(),
      gender: formData.gender,
      department_id: Number(formData.department_id),
      designation: formData.designation.trim(),
      join_date: formData.join_date,
      basic_salary: Number(formData.basic_salary),
    })
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div>
          <Input
            label="Employee Name"
            value={formData.emp_name}
            onChange={(event) => updateField('emp_name', event.target.value)}
            placeholder="Enter full name"
          />
          {errors.emp_name && <span className="field-error">{errors.emp_name}</span>}
        </div>
        <div>
          <Select
            label="Gender"
            value={formData.gender}
            onChange={(event) => updateField('gender', event.target.value)}
            options={[{ value: '', label: 'Select gender' }, 'Male', 'Female', 'Other']}
          />
          {errors.gender && <span className="field-error">{errors.gender}</span>}
        </div>
        <div>
          <Select
            label="Department"
            value={formData.department_id}
            onChange={(event) => updateField('department_id', event.target.value)}
            options={[
              { value: '', label: 'Select department' },
              ...departments.map((department) => ({
                value: String(department.department_id),
                label: department.department_name,
              })),
            ]}
          />
          {errors.department_id && <span className="field-error">{errors.department_id}</span>}
        </div>
        <div>
          <Input
            label="Designation"
            value={formData.designation}
            onChange={(event) => updateField('designation', event.target.value)}
            placeholder="e.g. Senior Developer"
          />
          {errors.designation && <span className="field-error">{errors.designation}</span>}
        </div>
        <div>
          <Input
            label="Join Date"
            type="date"
            value={formData.join_date}
            onChange={(event) => updateField('join_date', event.target.value)}
          />
          {errors.join_date && <span className="field-error">{errors.join_date}</span>}
        </div>
        <div>
          <Input
            label="Basic Salary"
            type="number"
            min="1"
            value={formData.basic_salary}
            onChange={(event) => updateField('basic_salary', event.target.value)}
            placeholder="Enter monthly salary"
          />
          {errors.basic_salary && <span className="field-error">{errors.basic_salary}</span>}
        </div>
      </div>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{employee ? 'Update Employee' : 'Save Employee'}</Button>
      </div>
    </form>
  )
}

export default EmployeeForm
