const PageHeader = ({ title, subtitle, action }) => (
  <div className="page-header">
    <div>
      <p className="eyebrow">Management</p>
      <h2>{title}</h2>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {action}
  </div>
)

export default PageHeader
