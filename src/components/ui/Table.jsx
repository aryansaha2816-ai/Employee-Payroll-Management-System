const Table = ({ columns = [], rows = [] }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.id ?? rowIndex}>
            {columns.map((column) => (
              <td key={`${row.id ?? rowIndex}-${column.key}`}>
                {column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default Table
