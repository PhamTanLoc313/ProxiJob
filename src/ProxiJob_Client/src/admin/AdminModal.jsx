import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./admin.css";

export default function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  maxWidth = 560,
  footer
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="admin-portal-overlay" onClick={onClose}>
      <div
        className="admin-portal-card"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="admin-portal-header">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 border border-amber-500/20 shadow-2xs">
                <Icon size={20} />
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight m-0">{title}</h3>
              {subtitle && <p className="text-xs text-slate-600 font-medium m-0 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors border-0 cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="admin-portal-body">{children}</div>

        {/* Pinned Footer */}
        {footer && <div className="admin-portal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
