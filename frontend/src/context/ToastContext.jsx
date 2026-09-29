import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss for Success and Info (Section 7: Auto-dismisses after 4s; Error persists until dismissed)
    if (type !== 'error' && duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((message, duration = 4000) => {
    return addToast({ message, type: 'success', duration });
  }, [addToast]);

  const error = useCallback((message) => {
    // Errors persist until dismissed per UI/UX Section 7
    return addToast({ message, type: 'error', duration: 0 });
  }, [addToast]);

  const info = useCallback((message, duration = 4000) => {
    return addToast({ message, type: 'info', duration });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          let bg = 'bg-slate-900 text-white border-slate-700';
          let Icon = Info;
          let iconColor = 'text-blue-400';

          if (toast.type === 'success') {
            bg = 'bg-emerald-950 text-emerald-50 border-emerald-700';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (toast.type === 'error') {
            bg = 'bg-red-950 text-red-50 border-red-700';
            Icon = AlertCircle;
            iconColor = 'text-red-400';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3.5 rounded-lg border shadow-xl flex items-start space-x-3 text-xs animate-slideInUp ${bg}`}
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 font-medium leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition p-0.5"
                title="Dismiss"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
