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
  Sparkles,
  Calendar,
  ChevronRight,
  ShieldCheck
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
          subtitle: "Báo cáo hoạt động real-time của ProxiJob và phân tích tăng trưởng.",
          category: "Dashboard"
        };
      case "/admin/users":
        return {
          title: "Quản lý người dùng",
          subtitle: "Giám sát tài khoản sinh viên, nhà tuyển dụng và phân quyền hệ thống.",
          category: "Người dùng"
        };
      case "/admin/jobs":
        return {
          title: "Quản lý việc làm",
          subtitle: "Kiểm duyệt, theo dõi và gỡ bỏ tin tuyển dụng vi phạm quy định.",
          category: "Việc làm"
        };
      case "/admin/payments":
        return {
          title: "Quản lý thanh toán",
          subtitle: "Xác thực & phê duyệt đơn chuyển khoản nâng cấp gói dịch vụ.",
          category: "Thanh toán"
        };
      case "/admin/subscriptions":
        return {
          title: "Gói dịch vụ ProxiJob",
          subtitle: "Cấu hình giá cả, quyền lợi và hạn mức đăng bài các gói VIP & HRM.",
          category: "Gói dịch vụ"
        };
      default:
        return {
          title: "Quản trị hệ thống",
          subtitle: "Trang quản trị ProxiJob Executive Suite",
          category: "Admin"
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
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="admin-sidebar-logo">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur-xs opacity-60 animate-pulse" />
              <img src={logoImg} className="relative w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-amber-200/50 shadow-sm" alt="Logo" />
            </div>
            <div className="admin-sidebar-logo-text">
              <span className="admin-sidebar-logo-title flex items-center gap-1">
                ProxiJob
                <Sparkles size={13} className="text-amber-500 inline fill-amber-400" />
              </span>
              <span className="admin-sidebar-logo-sub">Executive Suite</span>
            </div>
            <button
              className="admin-menu-toggle md:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="admin-nav">
            <div className="admin-nav-label">Chức năng quản trị</div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive(item.path, item.end) ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={19} className="admin-nav-icon" />
                <span>{item.label}</span>
                {item.badgeKey === "pendingPayments" && pendingPaymentsCount > 0 && (
                  <span className="admin-nav-badge">{pendingPaymentsCount}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* User profile footer info */}
        <div className="p-4 border-t border-slate-100/80 flex flex-col gap-3 shrink-0 bg-gradient-to-b from-transparent to-amber-50/20">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200/70 rounded-2xl p-3 flex flex-col gap-3 shadow-[0_4px_20px_rgb(249,115,22,0.04)]">
            <div className="flex items-center gap-3 px-0.5">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 rounded-full blur-xs opacity-75 animate-pulse" />
                <div className="relative w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center font-bold text-xs border border-white text-white shrink-0 shadow-sm">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-900 text-xs truncate flex items-center gap-1">
                  Quản trị viên
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{session?.email || "admin@proxijob.test"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full h-9 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-slate-200/60 shadow-xs"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        <header className="admin-header glassmorphism-light">
          <div className="flex justify-between items-center w-full flex-wrap gap-4">
            {/* Left: Breadcrumbs & Title */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 pt-1 mb-1.5">
                <button
                  className="admin-menu-toggle md:hidden mr-1 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={18} />
                </button>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20 shadow-2xs">
                  ProxiJob Admin
                </span>
                <ChevronRight size={13} className="text-slate-300" />
                <span className="text-xs font-bold text-slate-500">
                  {getHeaderInfo().category}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight margin-0">
                {getHeaderInfo().title}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {getHeaderInfo().subtitle}
              </p>
            </div>

            {/* Right: Date & System Status Badge */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Hệ thống Live</span>
              </div>

              <div className="admin-date-badge shadow-xs bg-white/80 border border-slate-200/80 rounded-xl px-3.5 py-1.5 flex items-center text-xs font-bold text-slate-700">
                <Calendar size={14} className="mr-2 text-amber-500" />
                <span>
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
          <div className="dashboard-fade-in">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="admin-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="admin-modal max-w-sm rounded-3xl p-6 shadow-2xl bg-white border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header border-b-0 pb-0">
              <h3 className="admin-modal-title text-rose-600 flex items-center gap-2 font-black text-lg">
                <LogOut size={20} />
                Xác nhận đăng xuất
              </h3>
              <button className="admin-modal-close text-slate-400 hover:text-slate-600" onClick={() => setShowLogoutConfirm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body pt-3">
              <p className="m-0 text-sm text-slate-600 font-medium leading-relaxed">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Quản trị viên của ProxiJob không?
              </p>
            </div>
            <div className="admin-modal-footer border-t-0 pt-4 flex gap-3 justify-end">
              <button className="px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer" onClick={() => setShowLogoutConfirm(false)}>
                Hủy
              </button>
              <button
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md shadow-rose-600/20"
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

