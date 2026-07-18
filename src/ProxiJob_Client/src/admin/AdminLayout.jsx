import { useState } from "react";
import { Link, useLocation, Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminSession, adminLogout } from "./adminData";
import { IDENTITY_API_URL } from "../apiConfig";
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
  Calendar,
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch real payments count for the sidebar badge
  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await fetch(`${IDENTITY_API_URL}/admin/payments`, {
        headers: { "Authorization": `Bearer ${session?.token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!session?.token
  });

  const pendingPaymentsCount = payments.filter(p => p.status === "Pending").length;

  if (!session || session.role !== "Admin") {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path, end) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const getHeaderInfo = () => {
    switch (location.pathname) {
      case "/admin":
        return {
          title: "Tổng quan hệ thống",
          subtitle: "Báo cáo hoạt động của ProxiJob hôm nay và phân tích tăng trưởng."
        };
      case "/admin/users":
        return {
          title: "Quản lý người dùng",
          subtitle: "Quản lý danh sách sinh viên, nhà tuyển dụng và quản trị viên hệ thống."
        };
      case "/admin/jobs":
        return {
          title: "Quản lý việc làm",
          subtitle: "Giám sát, duyệt bài hoặc gỡ bài đăng tuyển dụng của các nhà tuyển dụng."
        };
      case "/admin/payments":
        return {
          title: "Quản lý thanh toán",
          subtitle: "Phê duyệt các đơn thanh toán nâng cấp gói VIP và HRM của doanh nghiệp."
        };
      case "/admin/subscriptions":
        return {
          title: "Gói dịch vụ",
          subtitle: "Cấu hình giá cả, hạn mức và quyền lợi của các gói dịch vụ trên ProxiJob."
        };
      default:
        return {
          title: "Quản trị hệ thống",
          subtitle: "Trang quản trị ProxiJob"
        };
    }
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
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`} style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="admin-sidebar-logo" style={{ flexShrink: 0 }}>
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

          <nav className="admin-nav" style={{ flex: 1, overflowY: "auto" }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive(item.path, item.end) ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} className="admin-nav-icon" />
                <span>{item.label}</span>
                {item.badgeKey === "pendingPayments" && pendingPaymentsCount > 0 && (
                  <span className="admin-nav-badge">{pendingPaymentsCount}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* User profile footer info */}
        <div style={{ padding: 16, borderTop: "1px solid var(--admin-border)", display: "flex", flexDirection: "column", gap: 12, background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--admin-primary-glow)", color: "var(--admin-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
              🛠️
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: 13, color: "var(--admin-text)" }}>Admin</p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--admin-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.email || "admin@proxijob.test"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{ 
              width: "100%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 6, 
              background: "var(--admin-border)", 
              border: "1px solid var(--admin-border)", 
              padding: "9px 16px", 
              borderRadius: 12, 
              fontSize: 13, 
              fontWeight: 700, 
              color: "var(--admin-text)", 
              cursor: "pointer"
            }}
          >
            <LogOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-header" style={{ height: "auto", padding: "20px 32px", background: "#ffffff", borderBottom: "1px solid var(--admin-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 16 }}>
            {/* Left: Title & Subtitle */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  className="admin-menu-toggle"
                  onClick={() => setSidebarOpen(true)}
                  style={{ marginRight: 4 }}
                >
                  <Menu size={18} />
                </button>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.8px", margin: 0 }}>
                  {getHeaderInfo().title}
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "var(--admin-text-secondary)", margin: "4px 0 0 0", fontWeight: 500 }}>
                {getHeaderInfo().subtitle}
              </p>
            </div>

            {/* Right: Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              {/* Date Badge */}
              <div className="admin-date-badge" style={{ margin: 0, padding: "8px 14px", background: "var(--admin-bg)", borderRadius: 12, border: "1px solid var(--admin-border)" }}>
                <Calendar size={14} style={{ marginRight: 6, color: "var(--admin-primary)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text-secondary)" }}>
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-page-enter">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="admin-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <h3 className="admin-modal-title" style={{ color: "var(--admin-danger)", display: "flex", alignItems: "center", gap: 8 }}>
                <LogOut size={20} />
                Xác nhận đăng xuất
              </h3>
              <button className="admin-modal-close" onClick={() => setShowLogoutConfirm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ paddingTop: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--admin-text-secondary)", lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Quản trị viên của ProxiJob không?
              </p>
            </div>
            <div className="admin-modal-footer" style={{ borderTop: "none", paddingTop: 16 }}>
              <button className="admin-btn admin-btn-outline" onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  adminLogout();
                  localStorage.removeItem("@proxijob_auth_token");
                  localStorage.removeItem("@proxijob_auth_user");
                  window.location.href = "/login";
                }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
