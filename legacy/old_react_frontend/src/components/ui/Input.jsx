const Input = ({ label, className = '', ...props }) => (
  <div className="field-group">
    {label && <label className="field-label">{label}</label>}
    <input className={`input ${className}`.trim()} {...props} />
  </div>
)

export default Input
