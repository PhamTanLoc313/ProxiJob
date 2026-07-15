import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error"),
    warning: (msg) => showToast(msg, "warning"),
    info: (msg) => showToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Toast Container */}
      <div className="admin-toast-container">
        {toasts.map((t) => {
          let iconElement = null;

          if (t.type === "success") {
            iconElement = <CheckCircle size={20} fill="#10b981" stroke="#ffffff" style={{ flexShrink: 0 }} />;
          } else if (t.type === "error") {
            iconElement = <AlertCircle size={20} fill="#ef4444" stroke="#ffffff" style={{ flexShrink: 0 }} />;
          } else if (t.type === "warning") {
            iconElement = <AlertTriangle size={20} fill="#f59e0b" stroke="#ffffff" style={{ flexShrink: 0 }} />;
          } else if (t.type === "info") {
            iconElement = <Info size={20} fill="#3b82f6" stroke="#ffffff" style={{ flexShrink: 0 }} />;
          }

          return (
            <div
              key={t.id}
              className={`admin-toast-item admin-toast-${t.type}`}
            >
              {iconElement}
              <span className="admin-toast-message">{t.message}</span>
              <button className="admin-toast-close" onClick={() => removeToast(t.id)}>
                <X size={15} />
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
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
