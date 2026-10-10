import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'

const DepartmentForm = ({ department, existingDepartments, onSubmit, onCancel }) => {
  const [name, setName] = useState(department?.department_name ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Department name is required.')
      return
    }

    const isDuplicate = existingDepartments.some((item) => (
      item.department_id !== department?.department_id
      && item.department_name.toLowerCase() === trimmedName.toLowerCase()
    ))

    if (isDuplicate) {
      setError('A department with this name already exists.')
      return
    }

    onSubmit(trimmedName)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input
        label="Department Name"
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          setError('')
        }}
        placeholder="Enter department name"
        autoFocus
      />
      {error && <span className="field-error">{error}</span>}
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{department ? 'Update Department' : 'Save Department'}</Button>
      </div>
    </form>
  )
}

export default DepartmentForm
