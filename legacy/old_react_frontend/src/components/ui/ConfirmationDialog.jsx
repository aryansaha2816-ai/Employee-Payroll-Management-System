const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          <div className="modal-actions">
            <button className="button button-secondary" onClick={onCancel}>Cancel</button>
            <button className="button button-danger" onClick={onConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog
