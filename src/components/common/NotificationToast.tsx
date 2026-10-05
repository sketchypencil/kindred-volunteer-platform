import React from 'react';
import { useVolunteer } from '../../context/VolunteerContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { toasts, removeToast } = useVolunteer();

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} className="text-emerald" style={{ color: '#10b981' }} />;
      case 'warning':
        return <AlertTriangle size={20} className="text-amber" style={{ color: '#f59e0b' }} />;
      case 'alert':
        return <AlertCircle size={20} className="text-rose" style={{ color: '#f43f5e' }} />;
      default:
        return <Info size={20} className="text-indigo" style={{ color: '#6366f1' }} />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type}`}>
          <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon(toast.type)}</div>
          <div className="toast-body" style={{ flex: 1 }}>
            <h5>{toast.title}</h5>
            <p>{toast.message}</p>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
