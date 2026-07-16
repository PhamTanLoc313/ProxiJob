import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, MapPin, MessageCircle, User, Zap, LogOut, Menu, X } from "lucide-react";
import StudentDashboard from "./StudentDashboard";
import JobDetail from "./JobDetail";
import StudentCalendar from "./StudentCalendar";
import StudentCheckIn from "./StudentCheckIn";
import StudentPortfolio from "./StudentPortfolio";
import StudentChat from "./StudentChat";
import StudentUpgrade from "./StudentUpgrade";

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | calendar | checkin | chat | portfolio | upgrade | job-detail
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <StudentDashboard
            onSelectJob={(jobId) => {
              setSelectedJobId(jobId);
              setActiveTab("job-detail");
            }}
          />
        );
      case "job-detail":
        return (
          <JobDetail
            jobId={selectedJobId}
            onBack={() => {
              setSelectedJobId(null);
              setActiveTab("dashboard");
            }}
            onNavigateToCalendar={() => {
              setActiveTab("calendar");
            }}
          />
        );
      case "calendar":
        return <StudentCalendar />;
      case "checkin":
        return <StudentCheckIn />;
      case "chat":
        return <StudentChat />;
      case "portfolio":
        return <StudentPortfolio />;
      case "upgrade":
        return <StudentUpgrade />;
      default:
        return <StudentDashboard />;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Tìm Việc", icon: <Briefcase size={18} /> },
    { id: "calendar", label: "Lịch Roster", icon: <Calendar size={18} /> },
    { id: "checkin", label: "Điểm Danh", icon: <MapPin size={18} /> },
    { id: "chat", label: "Trò Chuyện", icon: <MessageCircle size={18} /> },
    { id: "portfolio", label: "Hồ Sơ", icon: <User size={18} /> },
    { id: "upgrade", label: "Nâng Cấp", icon: <Zap size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* 1. Left Sidebar for desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Logo */}
          <div className="h-16 px-6 border-b border-slate-50 flex items-center gap-2">
            <span className="h-8 w-8 bg-orange-600 rounded-xl flex items-center justify-center text-white text-lg font-black">P</span>
            <span className="font-black text-lg tracking-tight text-slate-800">ProxiJob <span className="text-xs text-orange-600 font-bold uppercase bg-orange-50 px-2 py-0.5 rounded-md">GenZ</span></span>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id || (item.id === "dashboard" && activeTab === "job-detail");
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedJobId(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 h-11 rounded-2xl font-bold text-xs transition duration-200 ${
                    active
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/10"
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
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-sm border-2 border-orange-200 text-orange-700">
              🎓
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-800 truncate">{user?.name || "Sinh viên"}</p>
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
            <span className="h-8 w-8 bg-orange-600 rounded-xl flex items-center justify-center text-white text-lg font-black">P</span>
            <span className="font-black text-sm tracking-tight text-slate-800">ProxiJob</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 focus:outline-none"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile menu dropdown dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-16 inset-x-0 bg-white border-b border-slate-200 z-50 p-4 shadow-xl flex flex-col gap-2">
            {navItems.map((item) => {
              const active = activeTab === item.id || (item.id === "dashboard" && activeTab === "job-detail");
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedJobId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 h-11 rounded-xl font-bold text-xs transition ${
                    active ? "bg-orange-600 text-white" : "text-slate-600 hover:bg-slate-50"
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
