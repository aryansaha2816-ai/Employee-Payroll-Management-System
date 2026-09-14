const Card = ({ title, subtitle, children, className = '', action }) => (
  <div className={`card ${className}`.trim()}>
    {(title || subtitle || action) && (
      <div className="card-header">
        <div>
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
)

export default Card
