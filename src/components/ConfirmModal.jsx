import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                <div className="modal-header-container">
                    <div className="modal-icon-wrapper modal-icon-danger">
                        <AlertTriangle size={22} />
                    </div>
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onCancel} className="btn-close">
                        <X size={18} />
                    </button>
                </div>
                <p className="modal-body-text">{message}</p>
                <div className="modal-footer">
                    <button onClick={onCancel} disabled={loading} className="btn-cancel">
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={loading} 
                        className="btn-confirm danger"
                        style={{ opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
