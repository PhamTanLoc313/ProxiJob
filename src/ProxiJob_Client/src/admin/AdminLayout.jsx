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
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3 shrink-0 bg-gradient-to-b from-transparent to-slate-50/50">
          <div className="bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/60 rounded-2xl p-3 flex flex-col gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all">
            <div className="flex items-center gap-3 px-0.5">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 rounded-full blur-xs opacity-75 animate-pulse" />
                <div className="relative w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center font-bold text-xs border border-white text-white shrink-0">
                  🛠️
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-slate-800 text-xs truncate">Quản trị viên</h4>
                <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{session?.email || "admin@proxijob.test"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full h-9 bg-slate-100 hover:bg-slate-200/80 text-slate-650 rounded-xl font-black text-xs transition duration-300 flex items-center justify-center gap-2 cursor-pointer border border-slate-200/10"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
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
