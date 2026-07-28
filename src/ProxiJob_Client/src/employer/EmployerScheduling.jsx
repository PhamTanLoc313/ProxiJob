import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon, Clock, Plus, Trash2, Pencil, UserPlus, Search, X,
  Sun, CloudSun, Moon, Star, Timer, ChevronLeft, ChevronRight, Check,
  AlertTriangle, Users, Zap, Wallet, Sparkles, UserCheck
} from "lucide-react";
import { getEmployees, getSchedules, createSchedule, deleteSchedule } from "../api/management";
import { useAuth } from "../auth/AuthContext";

/* ─── helpers ─── */
function getCurrentWeekDays() {
  const today = new Date();
  const currentDay = today.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMonday);

  const days = [];
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const apiDateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    const isToday = d.toDateString() === today.toDateString();
    days.push({ name: dayNames[i], date: dateStr, apiDateStr, isToday, fullYear: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return days;
}

const formatTime = (val) => {
  if (!val) return "--:--";
  if (val.includes("T")) {
    try {
      const d = new Date(val);
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } catch {
      return val.slice(11, 16);
    }
  }
  return val.slice(0, 5);
};

const SHIFT_ICONS = ["☀️", "⛅", "🌙", "⏰", "⭐"];
const ICON_COLORS = {
  "☀️": { bg: "bg-gradient-to-br from-amber-400 to-orange-500", fg: "text-white", cardBg: "bg-amber-50/50 border-amber-100" },
  "⛅": { bg: "bg-gradient-to-br from-orange-400 to-amber-500", fg: "text-white", cardBg: "bg-orange-50/50 border-orange-100" },
  "🌙": { bg: "bg-gradient-to-br from-indigo-500 to-purple-600", fg: "text-white", cardBg: "bg-indigo-50/50 border-indigo-100" },
  "⏰": { bg: "bg-gradient-to-br from-slate-600 to-slate-800", fg: "text-white", cardBg: "bg-slate-50 border-slate-200" },
  "⭐": { bg: "bg-gradient-to-br from-amber-500 to-yellow-600", fg: "text-white", cardBg: "bg-yellow-50/50 border-yellow-100" },
};

const DEFAULT_SHIFTS = [
  { id: "morning", name: "Ca Sáng", time: "08:00 - 12:00", icon: "☀️" },
  { id: "afternoon", name: "Ca Chiều", time: "13:00 - 17:00", icon: "⛅" },
  { id: "evening", name: "Ca Tối", time: "18:00 - 22:00", icon: "🌙" },
];

const removeAccents = (str) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};

const getInitials = (name) => {
  if (!name) return "NV";
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/* ─── main component ─── */
export default function EmployerScheduling() {
  const { user } = useAuth();

  // Week & date state
  const [weekDays, setWeekDays] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Data state
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shift slots (stored in localStorage)
  const [shiftSlots, setShiftSlots] = useState(DEFAULT_SHIFTS);

  // Active tab
  const [activeTab, setActiveTab] = useState("internal");

  // Staff assign modal
  const [assignModal, setAssignModal] = useState({ open: false, slotId: null });
  const [searchQuery, setSearchQuery] = useState("");

  // Add/edit shift modal
  const [shiftModal, setShiftModal] = useState({ open: false, editId: null });
  const [shiftForm, setShiftForm] = useState({ name: "", start: "08:00", end: "12:00", icon: "☀️" });
  const [shiftErrors, setShiftErrors] = useState({});

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, slot: null });

  const activeDateStr = weekDays[selectedDayIndex]?.apiDateStr;

  /* ─── init ─── */
  useEffect(() => {
    const days = getCurrentWeekDays();
    setWeekDays(days);
    const todayIdx = days.findIndex((d) => d.isToday);
    setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`proxijob_shift_slots_${user?.id || "default"}`);
      if (stored) setShiftSlots(JSON.parse(stored));
    } catch {}
  }, [user]);

  const saveShiftSlots = (slots) => {
    setShiftSlots(slots);
    try {
      localStorage.setItem(`proxijob_shift_slots_${user?.id || "default"}`, JSON.stringify(slots));
    } catch {}
  };

  /* ─── data loading ─── */
  const loadData = useCallback(async () => {
    if (!user || !activeDateStr) return;
    setLoading(true);
    try {
      const [empData, schedData] = await Promise.all([
        getEmployees(),
        getSchedules(activeDateStr),
      ]);
      const list = empData?.items || (Array.isArray(empData) ? empData : []);
      setEmployees(list);
      setSchedules(Array.isArray(schedData) ? schedData : []);
    } catch (err) {
      console.log("Failed to load scheduling data:", err);
      setEmployees([]);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeDateStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── assign/unassign staff ─── */
  const parseDateTimeToUTC = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    dateObj.setUTCHours(dateObj.getUTCHours() - 7);
    return dateObj.toISOString();
  };

  const handleAssignStaff = async (staffId) => {
    if (!assignModal.slotId || !activeDateStr) return;
    const targetSlot = shiftSlots.find((s) => s.id === assignModal.slotId);
    if (!targetSlot) return;

    const existing = schedules.find((s) => s.note === assignModal.slotId && s.employeeId === staffId);
    if (existing) {
      try {
        await deleteSchedule(existing.id);
        setSchedules((prev) => prev.filter((s) => s.id !== existing.id));
      } catch (err) {
        alert(err.message || "Không thể bỏ gán nhân viên.");
      }
      return;
    }

    let startTime = "08:00";
    let endTime = "12:00";
    try {
      const timeParts = targetSlot.time.split(" - ");
      if (timeParts.length === 2) {
        startTime = timeParts[0];
        endTime = timeParts[1];
      }
    } catch {}

    const startDateTime = parseDateTimeToUTC(activeDateStr, startTime);
    const endDateTime = parseDateTimeToUTC(activeDateStr, endTime);

    try {
      await createSchedule(staffId, {
        date: activeDateStr,
        startTime: startDateTime,
        endTime: endDateTime,
        note: assignModal.slotId,
      });
      await loadData();
    } catch (err) {
      const errMsg = err.message || "";
      if (errMsg.includes("overlapping") || errMsg.includes("work schedule")) {
        alert("⚠️ Nhân viên này đã có lịch làm việc trùng thời gian ở một ca khác trong ngày!");
      } else {
        alert(errMsg || "Lỗi xếp lịch. Không thể phân công ca làm.");
      }
    }
  };

  const handleDeleteScheduleEntry = async (schedId) => {
    if (!window.confirm("Bạn có chắc chắn muốn bỏ gán nhân viên này?")) return;
    try {
      await deleteSchedule(schedId);
      setSchedules((prev) => prev.filter((s) => s.id !== schedId));
    } catch (err) {
      alert(err.message || "Không thể xóa lịch làm việc.");
    }
  };

  const handleUnassignAllInSlot = async () => {
    if (!assignModal.slotId) return;
    const slotSchedules = schedules.filter((s) => s.note === assignModal.slotId && !s.jobShiftId);
    for (const sched of slotSchedules) {
      try {
        await deleteSchedule(sched.id);
      } catch (err) {
        console.log("Failed to unassign:", err);
      }
    }
    setAssignModal({ open: false, slotId: null });
    await loadData();
  };

  /* ─── shift CRUD ─── */
  const openAddShiftModal = () => {
    setShiftForm({ name: "", start: "08:00", end: "12:00", icon: "☀️" });
    setShiftErrors({});
    setShiftModal({ open: true, editId: null });
  };

  const openEditShiftModal = (slot) => {
    let start = "08:00";
    let end = "12:00";
    try {
      const parts = slot.time.split(" - ");
      if (parts.length === 2) { start = parts[0]; end = parts[1]; }
    } catch {}
    setShiftForm({ name: slot.name, start, end, icon: slot.icon || "☀️" });
    setShiftErrors({});
    setShiftModal({ open: true, editId: slot.id });
  };

  const handleShiftFormSubmit = () => {
    const errors = {};
    if (!shiftForm.name.trim()) errors.name = "Vui lòng nhập tên ca làm!";
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(shiftForm.start)) errors.start = "Giờ bắt đầu không đúng!";
    if (!timeRegex.test(shiftForm.end)) errors.end = "Giờ kết thúc không đúng!";
    if (shiftForm.start && shiftForm.end && shiftForm.start >= shiftForm.end) errors.end = "Giờ kết thúc phải sau giờ bắt đầu!";
    if (Object.keys(errors).length > 0) { setShiftErrors(errors); return; }

    if (shiftModal.editId) {
      const updated = shiftSlots.map((s) => s.id === shiftModal.editId ? { ...s, name: shiftForm.name.trim(), time: `${shiftForm.start} - ${shiftForm.end}`, icon: shiftForm.icon } : s);
      saveShiftSlots(updated);
    } else {
      const newSlot = { id: `custom_${Date.now()}`, name: shiftForm.name.trim(), time: `${shiftForm.start} - ${shiftForm.end}`, icon: shiftForm.icon };
      saveShiftSlots([...shiftSlots, newSlot]);
    }
    setShiftModal({ open: false, editId: null });
  };

  const handleConfirmDeleteSlot = () => {
    if (!deleteConfirm.slot) return;
    const updated = shiftSlots.filter((s) => s.id !== deleteConfirm.slot.id);
    saveShiftSlots(updated);
    setDeleteConfirm({ open: false, slot: null });
  };

  /* ─── derived data ─── */
  const internalEmployees = employees.filter((e) => e.employeeType !== "External");
  const filteredStaffForModal = internalEmployees.filter((s) => {
    const n = removeAccents((s.name || s.Name || "").toLowerCase());
    const q = removeAccents(searchQuery.toLowerCase());
    return n.includes(q);
  });
  const externalSchedules = schedules.filter((s) => s.jobShiftId);
  const selectedDay = weekDays[selectedDayIndex];

  const getDaySummaryTitle = () => {
    if (!selectedDay) return "Lịch phân ca";
    const dayName = selectedDay.name === "CN" ? "Chủ Nhật" : `Thứ ${selectedDay.name.slice(1)}`;
    return `Lịch phân ca: ${dayName} (${selectedDay.date}/${selectedDay.fullYear})`;
  };

  const getTimelineLabel = () => {
    if (!selectedDay) return "Tuần này";
    return `Tuần này (Tháng ${selectedDay.month}, ${selectedDay.fullYear})`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6">

      {/* ==================== 1. PREMIUM HEADER BANNER ==================== */}
      <div
        className="dashboard-fade-in dashboard-fade-in-1 relative overflow-hidden rounded-3xl shadow-lg border border-orange-100/80 dots-pattern"
        style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fef3c7 100%)" }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 blur-2xl" style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />

        <div className="relative z-10 p-6 md:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
              <CalendarIcon size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Xếp Lịch Trực (Scheduling)
              </h1>
              <p className="text-slate-600 text-xs font-medium mt-0.5">{getTimelineLabel()}</p>
            </div>
          </div>

          {activeTab === "internal" && (
            <button
              onClick={openAddShiftModal}
              className="btn-premium text-white px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shrink-0 cursor-pointer"
            >
              <Plus size={16} /> Thêm Ca Mới
            </button>
          )}
        </div>
      </div>

      {/* ==================== 2. WEEK TIMELINE SELECTOR ==================== */}
      <div className="dashboard-fade-in dashboard-fade-in-2 bg-white/80 backdrop-blur-sm border border-slate-100 shadow-md rounded-3xl p-5">
        <div className="grid grid-cols-7 gap-2 sm:gap-3 w-full">
          {weekDays.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIndex(idx)}
                className={`relative flex flex-col items-center w-full px-2 py-3 rounded-2xl transition-all duration-300 font-bold text-xs border card-hover-lift ${
                  isSelected
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 border-orange-400"
                    : day.isToday
                      ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                      : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                }`}
              >
                <span className={`text-[10px] uppercase font-extrabold tracking-wider ${isSelected ? "text-white/90" : "text-slate-400"}`}>
                  {day.name}
                </span>
                <span className="text-lg font-black mt-1 tracking-tight">
                  {day.date.split("/")[0]}
                </span>
                {(isSelected || day.isToday) && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isSelected ? "bg-white animate-pulse" : "bg-orange-500"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== 3. DAY TITLE & TAB SWITCHER ==================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">{getDaySummaryTitle()}</h2>
          {selectedDay?.isToday && (
            <span className="badge-pulse px-3 py-1 text-xs font-black text-orange-600 bg-orange-50 border border-orange-200 rounded-full">
              Hôm nay
            </span>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("internal")}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeTab === "internal"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-800"
            }`}
          >
            <Users size={14} /> Nhân Sự Nội Bộ
          </button>
          <button
            onClick={() => setActiveTab("external")}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeTab === "external"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-800"
            }`}
          >
            <Zap size={14} /> Nhân Sự Vãng Lai
          </button>
        </div>
      </div>

      {/* ==================== 4. TAB CONTENT ==================== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-md">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-600 border-t-transparent mb-4" />
          <p className="text-slate-500 text-sm font-semibold">Đang tải lịch trực...</p>
        </div>
      ) : activeTab === "internal" ? (
        /* ===== INTERNAL SHIFTS TAB ===== */
        <div className="dashboard-fade-in dashboard-fade-in-3 flex flex-col gap-4">
          {shiftSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 text-center shadow-md">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <CalendarIcon size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-800 font-bold text-base">Chưa có ca làm nào</p>
              <p className="text-slate-400 text-sm mt-2 max-w-sm">Bấm nút "Thêm Ca Mới" góc trên để bắt đầu lập lịch trực.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {shiftSlots.map((slot) => {
                const slotSchedules = schedules.filter((s) => s.note === slot.id && !s.jobShiftId);
                const isAssigned = slotSchedules.length > 0;
                const colors = ICON_COLORS[slot.icon] || ICON_COLORS["☀️"];

                return (
                  <div
                    key={slot.id}
                    className={`group relative rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between card-hover-lift ${
                      isAssigned
                        ? "bg-white/90 backdrop-blur-sm border-2 border-slate-100 shadow-md hover:border-orange-200"
                        : "bg-slate-50/60 border-2 border-dashed border-slate-200"
                    }`}
                  >
                    <div>
                      {/* Slot Header */}
                      <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl ${colors.bg} flex items-center justify-center text-xl shadow-md ${colors.fg}`}>
                            {slot.icon}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-slate-800">
                              {slot.name}
                            </h4>
                            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                              <Clock size={12} className="text-slate-400" /> {slot.time}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1 items-center opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditShiftModal(slot)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 text-slate-400 transition"
                            title="Sửa ca"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ open: true, slot })}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 transition"
                            title="Xóa ca"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Assigned Staff List */}
                      <div className="space-y-2.5 min-h-[90px]">
                        {slotSchedules.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/40 border border-dashed border-slate-200 text-slate-400 text-xs font-semibold">
                            <span>Chưa phân công nhân sự</span>
                          </div>
                        ) : (
                          slotSchedules.map((sched) => {
                            const emp = employees.find((e) => e.id === sched.employeeId);
                            const empName = emp?.name || emp?.Name || sched.employeeName || "Nhân viên";
                            const empRole = emp?.role || emp?.Role || "Phục vụ";
                            const empSalary = emp?.salaryPerHour || emp?.SalaryPerHour || 0;

                            return (
                              <div
                                key={sched.id}
                                className="flex justify-between items-center bg-slate-50 border border-slate-100 hover:border-orange-200 p-3 rounded-2xl transition"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-black text-xs text-white shadow-sm uppercase shrink-0">
                                    {getInitials(empName)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 text-xs">{empName}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                      {empRole} • {empSalary > 0 ? `${empSalary.toLocaleString()} đ/giờ` : "Lương ca"}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteScheduleEntry(sched.id)}
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                                  title="Bỏ gán"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Action Button: Gán nhân sự */}
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setAssignModal({ open: true, slotId: slot.id });
                      }}
                      className="w-full mt-4 h-11 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      <UserPlus size={14} /> Gán nhân sự
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ===== EXTERNAL SHIFTS TAB ===== */
        <div className="dashboard-fade-in dashboard-fade-in-3 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <h3 className="text-base font-black text-slate-800">Lịch làm việc vãng lai (Sinh viên ca lẻ)</h3>
          </div>

          {externalSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 text-center shadow-md">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <Zap size={32} className="text-amber-500" />
              </div>
              <p className="text-slate-800 font-bold text-base">Chưa có ca vãng lai nào được phân công</p>
              <p className="text-slate-400 text-sm mt-2 max-w-sm">Các ca làm vãng lai từ ứng viên được duyệt sẽ tự động cập nhật tại đây.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {externalSchedules.map((sched) => {
                const emp = employees.find((e) => e.id === sched.employeeId);
                const empName = emp?.name || emp?.Name || sched.employeeName || "Sinh viên";

                return (
                  <div
                    key={sched.id}
                    className="bg-white/80 backdrop-blur-sm border border-slate-100 hover:border-amber-300 p-5 rounded-3xl shadow-md hover:shadow-lg transition-all card-hover-lift flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-md">
                        🎓
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm">{empName}</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                          <Clock size={12} /> {formatTime(sched.startTime)} - {formatTime(sched.endTime)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                      ⚡ Vãng lai
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== 5. MODAL: ASSIGN STAFF ==================== */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
                  <UserPlus size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800">Gán nhân sự vào ca</h3>
                  <p className="text-xs text-slate-400">Chọn nhân viên cố định để phân công</p>
                </div>
              </div>
              <button
                onClick={() => setAssignModal({ open: false, slotId: null })}
                className="text-xs font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
              >
                Đóng
              </button>
            </div>

            {/* Search Input */}
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhân viên theo tên..."
                  className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-400"
                />
              </div>
            </div>

            {/* Staff List */}
            <div className="p-5 max-h-72 overflow-y-auto space-y-2.5">
              {filteredStaffForModal.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-xs font-semibold">
                  Không tìm thấy nhân viên phù hợp.
                </div>
              ) : (
                filteredStaffForModal.map((staff) => {
                  const empName = staff.name || staff.Name || "Nhân viên";
                  const empRole = staff.role || staff.Role || "Phục vụ";
                  const isAssigned = schedules.some((s) => s.note === assignModal.slotId && s.employeeId === staff.id);

                  return (
                    <div
                      key={staff.id}
                      onClick={() => handleAssignStaff(staff.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isAssigned
                          ? "bg-orange-50 border-orange-300 shadow-xs"
                          : "bg-white border-slate-100 hover:border-orange-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-xs text-white uppercase shadow-xs">
                          {getInitials(empName)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{empName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{empRole}</p>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                        isAssigned ? "bg-orange-500 border-orange-500 text-white" : "border-slate-300 text-transparent"
                      }`}>
                        ✓
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button
                onClick={handleUnassignAllInSlot}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Bỏ gán tất cả
              </button>
              <button
                onClick={() => setAssignModal({ open: false, slotId: null })}
                className="btn-premium text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. MODAL: ADD / EDIT SHIFT ==================== */}
      {shiftModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6" style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-black text-base text-slate-800">
                {shiftModal.editId ? "Sửa Ca Làm Việc" : "Tạo Ca Làm Việc Mới"}
              </h3>
              <button
                onClick={() => setShiftModal({ open: false, editId: null })}
                className="text-xs font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Tên ca làm</label>
                <input
                  type="text"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  placeholder="Ví dụ: Ca Sáng, Ca Gấp..."
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400"
                />
                {shiftErrors.name && <p className="text-[10px] text-red-500 font-bold">{shiftErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Giờ vào</label>
                  <input
                    type="text"
                    value={shiftForm.start}
                    onChange={(e) => setShiftForm({ ...shiftForm, start: e.target.value })}
                    placeholder="08:00"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center focus:outline-none focus:border-orange-400"
                  />
                  {shiftErrors.start && <p className="text-[10px] text-red-500 font-bold">{shiftErrors.start}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Giờ ra</label>
                  <input
                    type="text"
                    value={shiftForm.end}
                    onChange={(e) => setShiftForm({ ...shiftForm, end: e.target.value })}
                    placeholder="12:00"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center focus:outline-none focus:border-orange-400"
                  />
                  {shiftErrors.end && <p className="text-[10px] text-red-500 font-bold">{shiftErrors.end}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Biểu tượng ca</label>
                <div className="flex gap-2">
                  {SHIFT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setShiftForm({ ...shiftForm, icon })}
                      className={`w-11 h-11 rounded-2xl text-lg flex items-center justify-center border transition-all ${
                        shiftForm.icon === icon
                          ? "bg-orange-50 border-orange-400 shadow-md scale-110"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleShiftFormSubmit}
                className="w-full h-12 btn-premium text-white rounded-2xl font-extrabold text-xs shadow-lg transition-all mt-2"
              >
                {shiftModal.editId ? "Cập nhật Ca làm việc" : "Tạo Ca làm việc"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 7. MODAL: DELETE SHIFT CONFIRMATION ==================== */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 text-center" style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">Xóa ca làm?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Bạn có chắc chắn muốn xóa ca <strong>"{deleteConfirm.slot?.name}"</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ open: false, slot: null })}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteSlot}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-xs font-bold text-white hover:bg-red-600 transition shadow-md"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
