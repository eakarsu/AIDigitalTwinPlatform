import React, { useEffect, useState } from 'react';
import { FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

function formatValue(value) {
  if (value === null || value === undefined) return <span className="text-muted">--</span>;
  if (typeof value === 'boolean') return value ? <span className="badge badge-success">Yes</span> : <span className="badge badge-danger">No</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted">Empty</span>;
    return (
      <div className="tags-container">
        {value.map((item, i) => (
          <span key={i} className="tag">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <div style={{ marginTop: 6 }}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="detail-field" style={{ marginLeft: 12, marginBottom: 8 }}>
            <div className="detail-field-label">{k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</div>
            <div className="detail-field-value">{formatValue(v)}</div>
          </div>
        ))}
      </div>
    );
  }
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    try { return format(new Date(str), 'MMM d, yyyy h:mm a'); } catch { return str; }
  }
  return str;
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, s => s.toUpperCase())
    .replace(/Id$/, 'ID');
}

export default function DetailModal({ isOpen, onClose, title, data, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const excludeKeys = ['__v'];

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2>{title || 'Details'}</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">
          {confirmDelete ? (
            <div className="confirm-dialog">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this item? This action cannot be undone.</p>
              <div className="confirm-dialog-actions">
                <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => { onDelete(); setConfirmDelete(false); }}>Delete</button>
              </div>
            </div>
          ) : (
            Object.entries(data)
              .filter(([key]) => !excludeKeys.includes(key))
              .map(([key, value]) => (
                <div key={key} className="detail-field">
                  <div className="detail-field-label">{formatLabel(key)}</div>
                  <div className="detail-field-value">{formatValue(value)}</div>
                </div>
              ))
          )}
        </div>
        {!confirmDelete && (
          <div className="modal-footer">
            {onDelete && (
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
                <FiTrash2 /> Delete
              </button>
            )}
            {onEdit && (
              <button className="btn btn-primary btn-sm" onClick={onEdit}>
                <FiEdit2 /> Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
