import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, MapPin, MessageCircle, User, Zap, LogOut, Menu, X, Users, Wallet, Compass } from "lucide-react";
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

  const handleLogout = () => {
    logout();
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
    { id: "payroll", label: "Quyết Toán Lương", icon: <Wallet size={18} /> },
    { id: "chat", label: "Trò Chuyện", icon: <MessageCircle size={18} /> },
    { id: "profile", label: "Cấu Hình Quán", icon: <User size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* 1. Left Sidebar for desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Logo */}
          <div className="h-16 px-6 border-b border-slate-50 flex items-center gap-2">
            <span className="h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-black">P</span>
            <span className="font-black text-lg tracking-tight text-slate-800">ProxiJob <span className="text-xs text-blue-600 font-bold uppercase bg-blue-50 px-2 py-0.5 rounded-md">B2B</span></span>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 h-11 rounded-2xl font-bold text-xs transition duration-200 ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile footer info */}
        <div className="p-4 border-t border-slate-50 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-sm border-2 border-blue-200 text-blue-700">
              🏪
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-800 truncate">{user?.name || "Chủ cửa hàng"}</p>
              <p className="text-[10px] text-slate-400 font-semibold truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 h-10 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl font-bold text-xs transition cursor-pointer"
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
            <span className="h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-black">P</span>
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
                    active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
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
      </div>
    </div>
  );
}
