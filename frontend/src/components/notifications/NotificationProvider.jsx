import React, { useCallback, useMemo, useState } from 'react';
import { NotificationContext } from './NotificationContext';
import './NotificationProvider.css';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const dismiss = useCallback((id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((options) => {
    const id = `${Date.now()}-${Math.random()}`;
    const notification = {
      id,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
    };

    setNotifications((current) => [...current, notification]);

    window.setTimeout(() => {
      dismiss(id);
    }, options.duration || 3500);
  }, [dismiss]);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        title: options.title || 'Xác nhận',
        message: options.message || '',
        confirmLabel: options.confirmLabel || 'Đồng ý',
        cancelLabel: options.cancelLabel || 'Hủy',
        destructive: Boolean(options.destructive),
        resolve,
      });
    });
  }, []);

  const closeConfirm = useCallback((result) => {
    setConfirmState((current) => {
      if (current) {
        current.resolve(result);
      }
      return null;
    });
  }, []);

  const value = useMemo(() => ({
    notify,
    confirm,
  }), [notify, confirm]);

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div className="toast-viewport" aria-live="polite" aria-relevant="additions removals">
        {notifications.map((notification) => (
          <div key={notification.id} className={`toast toast-${notification.type}`}>
            <div className="toast-content">
              {notification.title && (
                <div className="toast-title">{notification.title}</div>
              )}
              {notification.message && (
                <div className="toast-message">{notification.message}</div>
              )}
            </div>
            <button
              type="button"
              className="toast-close"
              aria-label="Đóng thông báo"
              onClick={() => dismiss(notification.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div className="confirm-overlay" role="presentation">
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <h3 id="confirm-title" className="confirm-title">{confirmState.title}</h3>
            {confirmState.message && (
              <p className="confirm-message">{confirmState.message}</p>
            )}
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-button confirm-cancel"
                onClick={() => closeConfirm(false)}
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                className={`confirm-button ${confirmState.destructive ? 'confirm-danger' : 'confirm-primary'}`}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
