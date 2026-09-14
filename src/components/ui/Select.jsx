const Select = ({ label, options = [], className = '', ...props }) => (
  <div className="field-group">
    {label && <label className="field-label">{label}</label>}
    <select className={`select ${className}`.trim()} {...props}>
      {options.map((option) => (
        <option key={option.value ?? option} value={option.value ?? option}>
          {option.label ?? option}
        </option>
      ))}
    </select>
  </div>
)

export default Select
