import { useState } from "react";
import { Link, useLocation, Navigate, Outlet } from "react-router-dom";
import { getAdminSession, adminLogout, getStats } from "./adminData";
import logoImg from "../assets/logoproxijobcamden.png";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Package,
  Briefcase,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
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
          <img src={logoImg} className="admin-sidebar-logo-img" style={{ width: 36, height: 36, borderRadius: 8, marginRight: 8, objectFit: "contain" }} />
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

        <nav className="admin-nav">
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
          <div className="admin-header-actions" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="admin-btn-icon" style={{ border: "none", background: "transparent", color: "var(--admin-text-muted)", position: "relative", cursor: "pointer", display: "flex", padding: 4 }}>
              <Bell size={20} />
              <span style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, background: "var(--admin-danger)", borderRadius: "50%" }} />
            </button>
            <button className="admin-btn-icon" style={{ border: "none", background: "transparent", color: "var(--admin-text-muted)", cursor: "pointer", display: "flex", padding: 4 }}>
              <Settings size={20} />
            </button>
            <button className="admin-logout-btn" onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--admin-border)", border: "1px solid var(--admin-border)", padding: "6px 12px", borderRadius: 8, fontSize: 13, color: "var(--admin-text)", cursor: "pointer" }}>
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
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
