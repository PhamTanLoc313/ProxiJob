import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Pencil,
  UserPlus,
  Search,
  X,
  Sun,
  CloudSun,
  Moon,
  Star,
  Timer,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Users,
  Zap
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
  "☀️": { bg: "#FFF9E6", fg: "#F59E0B" },
  "⛅": { bg: "#FFF0EA", fg: "#FF6B00" },
  "🌙": { bg: "#EEF2FF", fg: "#4F46E5" },
  "⏰": { bg: "#F1F5F9", fg: "#64748B" },
  "⭐": { bg: "#FEF3C7", fg: "#D97706" },
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
    // Load custom shift slots from localStorage
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
  const handleAssignStaff = async (staffId) => {
    if (!assignModal.slotId || !activeDateStr) return;
    const targetSlot = shiftSlots.find((s) => s.id === assignModal.slotId);
    if (!targetSlot) return;

    // Check if already assigned
    const existing = schedules.find((s) => s.note === assignModal.slotId && s.employeeId === staffId);
    if (existing) {
      // Unassign (toggle off)
      try {
        await deleteSchedule(existing.id);
        setSchedules((prev) => prev.filter((s) => s.id !== existing.id));
      } catch (err) {
        alert(err.message || "Không thể bỏ gán nhân viên.");
      }
      return;
    }

    // Assign (toggle on)
    let startTime = "08:00:00";
    let endTime = "12:00:00";
    try {
      const timeParts = targetSlot.time.split(" - ");
      if (timeParts.length === 2) {
        startTime = `${timeParts[0]}:00`;
        endTime = `${timeParts[1]}:00`;
      }
    } catch {}

    const startDateTime = `${activeDateStr}T${startTime}`;
    const endDateTime = `${activeDateStr}T${endTime}`;

    try {
      await createSchedule(staffId, {
        date: activeDateStr,
        startTime: startDateTime,
        endTime: endDateTime,
        note: assignModal.slotId,
      });
      await loadData();
    } catch (err) {
      alert(err.message || "Lỗi xếp lịch. Trùng lặp ca làm phát hiện!");
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
    const n = removeAccents((s.name || "").toLowerCase());
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
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-5 min-h-screen">

      {/* ═══ WEEK TIMELINE HEADER ═══ */}
      <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              📋 Xếp Lịch Trực
            </h1>
            <p className="text-slate-400 text-[11px] mt-0.5">{getTimelineLabel()}</p>
          </div>
          {activeTab === "internal" && (
            <button
              onClick={openAddShiftModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg, #FF6B00, #F59E0B)" }}
            >
              <Plus size={14} />
              Thêm Ca Mới
            </button>
          )}
        </div>

        {/* Day selector pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {weekDays.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center min-w-[52px] px-2.5 py-2.5 rounded-2xl transition-all font-bold text-xs border
                  ${isSelected
                    ? "text-white shadow-lg border-orange-400"
                    : day.isToday
                      ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                      : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                  }`}
                style={isSelected ? { background: "linear-gradient(135deg, #FF6B00, #F59E0B)" } : {}}
              >
                <span className="text-[10px] font-semibold opacity-80">{day.name}</span>
                <span className="text-base font-black mt-0.5">{day.date.split("/")[0]}</span>
                {(isSelected || day.isToday) && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? "bg-white" : "bg-orange-400"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ DAY SUMMARY + TAB SELECTOR ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-slate-800">{getDaySummaryTitle()}</h2>
          {selectedDay?.isToday && (
            <span className="px-2 py-0.5 text-[10px] font-bold text-orange-700 bg-orange-100 rounded-full">Hôm nay</span>
          )}
        </div>

        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setActiveTab("internal")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5
              ${activeTab === "internal" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Users size={13} /> Nhân Sự Nội Bộ
          </button>
          <button
            onClick={() => setActiveTab("external")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5
              ${activeTab === "external" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Zap size={13} /> Nhân Sự Vãng Lai
          </button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      {loading ? (
        <div className="text-center p-12 text-slate-400 text-xs font-semibold">
          <div className="animate-spin mx-auto mb-3 w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full" />
          Đang tải lịch trực...
        </div>
      ) : activeTab === "internal" ? (
        /* ═══ INTERNAL TAB ═══ */
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">📋</span>
            <h3 className="text-sm font-black text-slate-700">Lịch trình chi tiết (Nội Bộ)</h3>
          </div>

          {shiftSlots.map((slot) => {
            const slotSchedules = schedules.filter((s) => s.note === slot.id && !s.jobShiftId);
            const isAssigned = slotSchedules.length > 0;
            const colors = ICON_COLORS[slot.icon] || ICON_COLORS["☀️"];

            return (
              <div
                key={slot.id}
                className={`border rounded-2xl p-4 transition-all ${
                  isAssigned ? "bg-white border-slate-150 shadow-sm" : "bg-slate-50/50 border-dashed border-slate-200"
                }`}
              >
                {/* Slot Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: colors.bg }}
                    >
                      {slot.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-800">{slot.name}</h4>
                        <button
                          onClick={() => openEditShiftModal(slot)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={11} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ open: true, slot })}
                          className="w-6 h-6 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition"
                          title="Xóa ca"
                        >
                          <Trash2 size={11} className="text-red-500" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {slot.time}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setAssignModal({ open: true, slotId: slot.id }); setSearchQuery(""); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all"
                    style={{ background: "linear-gradient(135deg, #FF6B00, #F59E0B)", color: "#fff" }}
                  >
                    <UserPlus size={12} /> Thêm nhân sự
                  </button>
                </div>

                {/* Assigned Staff */}
                {isAssigned ? (
                  <div className="flex flex-col gap-2">
                    {slotSchedules.map((schedule) => {
                      const staff = employees.find((e) => e.id === schedule.employeeId);
                      const staffName = staff ? staff.name : `Nhân viên #${schedule.employeeId}`;
                      const role = staff?.role || "Nhân viên";
                      let rate = "28.000 đ/h";
                      if (staff?.salaryPerHour) {
                        rate = `${Number(staff.salaryPerHour).toLocaleString("vi-VN")} đ/h`;
                      }

                      return (
                        <div
                          key={schedule.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-orange-200 transition"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white font-black text-sm shrink-0">
                            {(staffName || "?")[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 truncate">{staffName}</span>
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md"
                                style={{ backgroundColor: "rgba(255,107,0,0.1)", color: "#FF6B00" }}
                              >
                                Nội bộ
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold">Vị trí: {role}</p>
                            <p className="text-[10px] text-orange-600 font-bold">Lương ca: {rate}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteScheduleEntry(schedule.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    onClick={() => { setAssignModal({ open: true, slotId: slot.id }); setSearchQuery(""); }}
                    className="w-full py-5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition-all"
                  >
                    + Gán Nhân Sự Đầu Tiên 👤
                  </button>
                )}
              </div>
            );
          })}

          {shiftSlots.length === 0 && (
            <div className="text-center p-8 text-slate-400 text-xs">Chưa có ca làm nào. Nhấn "Thêm Ca Mới" để bắt đầu.</div>
          )}
        </div>
      ) : (
        /* ═══ EXTERNAL TAB ═══ */
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <h3 className="text-sm font-black text-slate-700">Lịch nhân sự vãng lai</h3>
          </div>

          {externalSchedules.length > 0 ? (
            <div className="flex flex-col gap-3">
              {externalSchedules.map((schedule) => {
                const staff = employees.find((e) => e.id === schedule.employeeId);
                const staffName = staff ? staff.name : "Sinh viên vãng lai";
                const role = staff?.role || "Nhân viên vãng lai";
                let rate = "28.000 đ/h";
                if (schedule.jobShiftSalary) {
                  rate = `${Number(schedule.jobShiftSalary).toLocaleString("vi-VN")} đ/h`;
                } else if (staff?.salaryPerHour) {
                  rate = `${Number(staff.salaryPerHour).toLocaleString("vi-VN")} đ/h`;
                }

                return (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-purple-200 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {(staffName || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{staffName}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md"
                          style={{ backgroundColor: "rgba(91,0,223,0.1)", color: "#5B00DF" }}
                        >
                          Vãng lai
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">Công việc: {role}</p>
                      <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                        <Clock size={10} /> Giờ làm: {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </p>
                      <p className="text-[10px] text-orange-600 font-bold">Lương ca: {rate}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteScheduleEntry(schedule.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-12 border border-slate-100 rounded-2xl bg-slate-50/30">
              <span className="text-3xl block mb-2">✨</span>
              <p className="text-xs font-bold text-slate-500 mb-1">Không có nhân sự vãng lai</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                Lịch làm việc của nhân sự vãng lai được tự động đồng bộ khi bạn phê duyệt đơn ứng tuyển của sinh viên.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ INFO CARD ═══ */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-slate-700 mb-1">💡 Hướng dẫn xếp ca nhanh</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {activeTab === "internal"
            ? "Nhấn nút '+ Thêm nhân sự' hoặc nút gán nhân sự trên bất kỳ ca làm nào để chọn danh sách nhân sự nội bộ và phân công."
            : "Lịch làm việc của sinh viên vãng lai được cố định theo đúng ca đăng ký trong tin tuyển dụng và tự động đồng bộ khi được duyệt."
          }
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODAL: Staff Assign Selector
         ═══════════════════════════════════════════════════ */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">
                Gán nhân sự vào {shiftSlots.find((s) => s.id === assignModal.slotId)?.name || "ca làm"}
              </h3>
              <button
                onClick={() => setAssignModal({ open: false, slotId: null })}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên nhân viên..."
                  className="flex-1 bg-transparent text-xs outline-none text-slate-700 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Staff List */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              {filteredStaffForModal.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">Không tìm thấy nhân viên nội bộ nào.</p>
              ) : (
                filteredStaffForModal.map((staff) => {
                  const isSelected = schedules.some(
                    (s) => s.note === assignModal.slotId && s.employeeId === staff.id
                  );
                  return (
                    <button
                      key={staff.id}
                      onClick={() => handleAssignStaff(staff.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 border transition-all text-left
                        ${isSelected
                          ? "bg-orange-50 border-orange-300 shadow-sm"
                          : "bg-white border-slate-100 hover:border-orange-200 hover:bg-orange-50/30"
                        }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white font-black text-sm shrink-0">
                        {(staff.name || "?")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">{staff.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Vị trí: {staff.role || "Nhân viên"}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition
                          ${isSelected ? "border-orange-500 bg-orange-500" : "border-slate-300"}`}
                      >
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Unassign All Action */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={handleUnassignAllInSlot}
                className="w-full py-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-100 transition flex items-center justify-center gap-1.5"
              >
                <AlertTriangle size={13} /> Bỏ trống ca làm này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL: Add/Edit Shift
         ═══════════════════════════════════════════════════ */}
      {shiftModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-slate-800">
                {shiftModal.editId ? "Chỉnh sửa ca làm" : "Thêm ca làm việc mới"}
              </h3>
              <button
                onClick={() => setShiftModal({ open: false, editId: null })}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Name */}
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Tên ca làm việc</label>
            <input
              type="text"
              placeholder="Ví dụ: Ca Giữa Trưa..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-400 transition mb-1"
              value={shiftForm.name}
              onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
            />
            {shiftErrors.name && <p className="text-[10px] text-red-500 mb-2">{shiftErrors.name}</p>}

            {/* Time inputs */}
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Giờ bắt đầu</label>
                <input
                  type="time"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-400 transition"
                  value={shiftForm.start}
                  onChange={(e) => setShiftForm({ ...shiftForm, start: e.target.value })}
                />
                {shiftErrors.start && <p className="text-[10px] text-red-500 mt-1">{shiftErrors.start}</p>}
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Giờ kết thúc</label>
                <input
                  type="time"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-400 transition"
                  value={shiftForm.end}
                  onChange={(e) => setShiftForm({ ...shiftForm, end: e.target.value })}
                />
                {shiftErrors.end && <p className="text-[10px] text-red-500 mt-1">{shiftErrors.end}</p>}
              </div>
            </div>

            {/* Icon selector */}
            <label className="text-[11px] font-bold text-slate-600 block mt-4 mb-2">Biểu tượng ca làm</label>
            <div className="flex gap-2">
              {SHIFT_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setShiftForm({ ...shiftForm, icon })}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition
                    ${shiftForm.icon === icon ? "border-orange-400 bg-orange-50 shadow-sm" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleShiftFormSubmit}
              className="w-full mt-5 py-3 rounded-xl text-xs font-bold text-white transition hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #FF6B00, #F59E0B)" }}
            >
              {shiftModal.editId ? "Cập nhật Ca Làm" : "Thêm Ca Làm Việc"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL: Delete Shift Confirmation
         ═══════════════════════════════════════════════════ */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-1">Xóa ca làm?</h3>
            <p className="text-[11px] text-slate-500 mb-5">
              Bạn có chắc chắn muốn xóa ca <strong>"{deleteConfirm.slot?.name}"</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ open: false, slot: null })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteSlot}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-xs font-bold text-white hover:bg-red-600 transition"
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
