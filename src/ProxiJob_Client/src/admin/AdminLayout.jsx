import { useState } from "react";
import { Link, useLocation, Navigate, Outlet } from "react-router-dom";
import { getAdminSession, adminLogout, getStats } from "./adminData";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Package,
  Briefcase,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import "./admin.css";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Thanh toán", path: "/admin/payments", icon: CreditCard, badgeKey: "pendingPayments" },
  { label: "Người dùng", path: "/admin/users", icon: Users },
  { label: "Gói dịch vụ", path: "/admin/subscriptions", icon: Package },
  { label: "Việc làm", path: "/admin/jobs", icon: Briefcase },
];

export default function AdminLayout() {
  const session = getAdminSession();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stats = getStats();

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    adminLogout();
    window.location.href = "/admin/login";
  };

  const isActive = (path, end) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-root">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">P</div>
          <div className="admin-sidebar-logo-text">
            <span className="admin-sidebar-logo-title">ProxiJob</span>
            <span className="admin-sidebar-logo-sub">Admin Panel</span>
          </div>
          <button
            className="admin-menu-toggle"
            style={{ marginLeft: "auto" }}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <span className="admin-nav-label">Quản lý</span>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${isActive(item.path, item.end) ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} className="admin-nav-icon" />
              <span>{item.label}</span>
              {item.badgeKey && stats[item.badgeKey] > 0 && (
                <span className="admin-nav-badge">{stats[item.badgeKey]}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">
              {session.fullName?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="admin-sidebar-user-info">
              <div className="admin-sidebar-user-name">{session.fullName}</div>
              <div className="admin-sidebar-user-role">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <h1 className="admin-header-title">
              {navItems.find((item) => isActive(item.path, item.end))?.label || "Admin"}
            </h1>
          </div>
          <div className="admin-header-actions">
            <button className="admin-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-page-enter">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
