import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, MapPin, MessageCircle, User, Zap, LogOut, Menu, X, Users, Wallet, Compass, Sparkles } from "lucide-react";
import { getBusinessProfileApi } from "../api/businessApi";
import logoImg from "../assets/logoproxijobcamden.png";
import EmployerDashboard from "./EmployerDashboard";
import JobManagement from "./JobManagement";
import EmployerHRM from "./EmployerHRM";
import EmployerScheduling from "./EmployerScheduling";
import GPSLiveRadar from "./GPSLiveRadar";
import PayrollSettlement from "./PayrollSettlement";
import EmployerChat from "./EmployerChat";
import EmployerProfile from "./EmployerProfile";

export default function EmployerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | jobs | hrm | scheduling | radar | payroll | chat | profile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!user) return;
    getBusinessProfileApi()
      .then((data) => {
        setProfileData(data);
      })
      .catch((err) => {
        console.log("Failed to load business profile for sidebar:", err);
      });
  }, [user, activeTab]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    sessionStorage.setItem("logoutSuccess", "true");
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <EmployerDashboard onNavigateToSection={(section) => setActiveTab(section)} />;
      case "jobs":
        return <JobManagement />;
      case "hrm":
        return <EmployerHRM />;
      case "scheduling":
        return <EmployerScheduling />;
      case "radar":
        return <GPSLiveRadar />;
      case "payroll":
        return <PayrollSettlement />;
      case "chat":
        return <EmployerChat />;
      case "profile":
        return <EmployerProfile />;
      default:
        return <EmployerDashboard />;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Tổng Quan", icon: <Compass size={18} /> },
    { id: "jobs", label: "Tin Đăng Tuyển", icon: <Briefcase size={18} /> },
    { id: "hrm", label: "Nhân Sự HRM", icon: <Users size={18} /> },
    { id: "scheduling", label: "Xếp Lịch Trực", icon: <Calendar size={18} /> },
    { id: "radar", label: "Live GPS & QR", icon: <MapPin size={18} /> },
    { id: "payroll", label: "Chi Phí", icon: <Wallet size={18} /> },
    { id: "chat", label: "Trò Chuyện", icon: <MessageCircle size={18} /> },
    { id: "profile", label: "Cấu Hình Quán", icon: <User size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* 1. Left Sidebar for desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col justify-between shrink-0 shadow-xs h-screen sticky top-0">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="h-20 px-6 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-gradient-to-r from-orange-50/20 to-amber-50/10">
            <img src={logoImg} alt="ProxiJob Logo" className="h-10 w-10 object-contain shadow-xs shrink-0" />
            <div>
              <span className="font-black text-base tracking-tight text-slate-950 block">ProxiJob</span>
              <span className="text-[9px] font-black uppercase text-orange-600 tracking-wider bg-orange-50 px-1.5 py-0.5 rounded-md">Cổng Chủ Quán</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={`w-full relative flex items-center gap-3.5 px-4.5 h-12 rounded-2xl font-extrabold text-sm transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20 translate-x-1"
                      : "text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 hover:translate-x-1"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-3 bottom-3 w-1.5 bg-amber-300 rounded-r-full" />
                  )}
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile footer info */}
        <div className="p-4.5 border-t border-slate-100/80 flex flex-col gap-3.5 shrink-0 bg-gradient-to-b from-transparent to-slate-50/50">
          <div className="bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/60 rounded-3xl p-3.5 flex flex-col gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
            {/* Profile Info Row */}
            <div className="flex items-center gap-3 px-0.5">
              <div className="relative">
                {/* Glow ring around avatar */}
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 rounded-full blur-xs opacity-75 animate-pulse" />
                {profileData?.avatarUrl || user?.avatarUrl ? (
                  <img
                    src={profileData?.avatarUrl || user?.avatarUrl}
                    alt="Business Avatar"
                    className="relative w-10 h-10 rounded-full border border-white object-cover shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120";
                    }}
                  />
                ) : (
                  <div className="relative w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center font-bold text-sm border border-white text-white shrink-0">
                    🏪
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs z-10" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-black text-xs text-slate-800 truncate max-w-[95px]">{profileData?.businessName || user?.name || "Chủ quán"}</p>
                  <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider shadow-xs scale-90 shrink-0 text-center">B2B</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Separator line */}
            <hr className="border-slate-100" />

            {/* Subscription package details card */}
            <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/10 p-3 rounded-2xl relative overflow-hidden flex flex-col gap-2.5">
              <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-orange-450/15 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-1.5 text-orange-950 relative z-10">
                <Sparkles size={12} className="text-orange-600 fill-orange-200 animate-pulse shrink-0" />
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Gói Đối Tác</span>
              </div>
              
              <div className="flex justify-between items-center text-[10px] relative z-10">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-slate-400 font-semibold">Tên gói:</p>
                  <p className="font-extrabold text-slate-700">{profileData?.subscriptionTier || user?.subscriptionTier || "Trial"}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("dashboard");
                }}
                className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-[9.5px] font-black rounded-xl shadow-md shadow-orange-500/15 hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 hover:scale-[1.02] transform active:scale-95 relative z-10"
              >
                🚀 Nâng cấp gói ngay
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 h-10 border border-red-200/60 hover:border-red-600 text-red-500 hover:text-white bg-red-50/50 hover:bg-red-600 rounded-xl font-black text-xs transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md hover:shadow-red-600/10 hover:scale-[1.01] transform active:scale-95"
          >
            <LogOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* 2. Top Header and Mobile navigation bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 bg-white border-b border-slate-100 px-4 flex justify-between items-center z-20 shadow-xs">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="ProxiJob Logo" className="h-8 w-8 object-contain shrink-0" />
            <span className="font-black text-sm tracking-tight text-slate-800">ProxiJob B2B</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 focus:outline-none"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-16 inset-x-0 bg-white border-b border-slate-200 z-50 p-4 shadow-xl flex flex-col gap-2">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 h-11 rounded-xl font-bold text-xs transition ${
                    active ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
            <hr className="border-slate-100 my-2" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 h-11 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold text-xs transition"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}

        {/* 3. Main content body render */}
        <main className="flex-1 overflow-y-auto bg-slate-50 md:p-6 p-2 z-0 relative">
          {renderContent()}
        </main>
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Xác nhận đăng xuất</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản nhà tuyển dụng của ProxiJob không?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogoutConfirm();
                  }}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition shadow-md shadow-red-600/15 cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
