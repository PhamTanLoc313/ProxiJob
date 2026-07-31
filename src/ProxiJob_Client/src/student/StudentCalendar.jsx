import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, DollarSign, MapPin, AlertCircle, RefreshCw, XCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { getMyApplications, cancelApplicationApi, getPublishedJobs } from "../api/jobs";
import { getStudentPayrolls, getMySchedules } from "../api/management";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../admin/ToastContext";

const getWeekDaysForDate = (referenceDate) => {
  const today = new Date();
  const currentDay = referenceDate.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + distanceToMonday);

  const days = [];
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const apiDateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    const isToday = d.toDateString() === today.toDateString();

    days.push({
      name: dayNames[i],
      date: dateStr,
      apiDateStr: apiDateStr,
      isToday: isToday,
      fullYear: d.getFullYear(),
      month: d.getMonth() + 1,
      dayOfMonth: d.getDate()
    });
  }
  return days;
};

const isSameDate = (shiftDateInput, apiDateStr) => {
  if (!shiftDateInput || !apiDateStr) return false;
  try {
    const shiftDate = new Date(shiftDateInput);
    const [year, month, day] = apiDateStr.split('-').map(Number);
    return shiftDate.getFullYear() === year &&
      (shiftDate.getMonth() + 1) === month &&
      shiftDate.getDate() === day;
  } catch (e) {
    return false;
  }
};

export default function StudentCalendar({ onSelectJob, onNavigateToCheckIn }) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [weekDays, setWeekDays] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("upcoming"); // upcoming | completed
  const [referenceDate, setReferenceDate] = useState(new Date());

  // 1. Fetch applications AND employer-assigned schedules (matching Mobile app!)
  const { data: applications = [], isLoading: loading } = useQuery({
    queryKey: ["myApplications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const today = new Date();
      const fromDateObj = new Date(today);
      fromDateObj.setDate(today.getDate() - 30);
      const toDateObj = new Date(today);
      toDateObj.setDate(today.getDate() + 90);

      const formatDateStr = (d) => {
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      };

      const fromDate = formatDateStr(fromDateObj);
      const toDate = formatDateStr(toDateObj);

      const [appsRes, jobsRes, schedsRes] = await Promise.all([
        getMyApplications(user.id).catch(() => []),
        getPublishedJobs(null, 1, 200).catch(() => []),
        getMySchedules(fromDate, toDate).catch(() => [])
      ]);

      const rawApps = Array.isArray(appsRes)
        ? appsRes
        : (appsRes && Array.isArray(appsRes.items))
        ? appsRes.items
        : (appsRes && appsRes.data && Array.isArray(appsRes.data.items))
        ? appsRes.data.items
        : (appsRes && appsRes.data && Array.isArray(appsRes.data))
        ? appsRes.data
        : [];

      const jobsList = Array.isArray(jobsRes)
        ? jobsRes
        : (jobsRes && Array.isArray(jobsRes.items))
        ? jobsRes.items
        : (jobsRes && jobsRes.data && Array.isArray(jobsRes.data.items))
        ? jobsRes.data.items
        : [];

      const schedsList = Array.isArray(schedsRes)
        ? schedsRes
        : (schedsRes && Array.isArray(schedsRes.data))
        ? schedsRes.data
        : (schedsRes && Array.isArray(schedsRes.items))
        ? schedsRes.items
        : [];

      const firstJobId = jobsList[0] ? jobsList[0].id : 1;

      const appShifts = rawApps.map(app => {
        const matchingJob = jobsList.find(j => 
          Array.isArray(j.shifts) && j.shifts.some(s => s.id === app.shiftId)
        ) || jobsList.find(j => j.id === app.jobId || j.title === app.jobTitle);

        const startTime = app.startTime || app.StartTime || app.shiftStartTime || app.shiftDate;
        const endTime = app.endTime || app.EndTime || app.shiftEndTime || startTime;

        let status = (app.status || app.Status || "applied").toLowerCase();
        if (status === "approved") status = "approved";

        return {
          ...app,
          jobId: matchingJob ? matchingJob.id : firstJobId,
          shiftDate: startTime,
          shiftStartTime: startTime ? (typeof startTime === 'string' && startTime.includes('T') ? startTime.slice(11, 16) : startTime) : "08:00",
          shiftEndTime: endTime ? (typeof endTime === 'string' && endTime.includes('T') ? endTime.slice(11, 16) : endTime) : "12:00",
          jobTitle: app.jobTitle || (matchingJob ? matchingJob.title : "Ca làm việc"),
          companyName: app.companyName || app.company || (matchingJob ? matchingJob.categoryName : "Cửa hàng"),
          shiftSalary: app.shiftSalary || app.Salary || (matchingJob ? matchingJob.salary : 25000),
          status
        };
      });

      // Map manual/custom schedules assigned by employer
      const schedShifts = schedsList.map(sched => {
        const sId = sched.id !== undefined ? sched.id : sched.Id;
        const sJobShiftId = sched.jobShiftId !== undefined ? sched.jobShiftId : sched.JobShiftId;
        const sStartTime = sched.startTime !== undefined ? sched.startTime : sched.StartTime;
        const sEndTime = sched.endTime !== undefined ? sched.endTime : sched.EndTime;
        const sNote = sched.note !== undefined ? sched.note : sched.Note;
        const sSalary = sched.jobShiftSalary !== undefined ? sched.jobShiftSalary : (sched.JobShiftSalary || 28000);
        const sBusinessId = sched.businessId !== undefined ? sched.businessId : sched.BusinessId;
        const sActualCheckIn = sched.actualCheckInTime || sched.ActualCheckInTime;
        const sActualCheckOut = sched.actualCheckOutTime || sched.ActualCheckOutTime;

        let slotName = "Ca làm việc";
        if (sNote === "morning") slotName = "Ca Sáng";
        else if (sNote === "afternoon") slotName = "Ca Chiều";
        else if (sNote === "evening") slotName = "Ca Tối";
        else if (sNote && sNote.startsWith("custom_")) slotName = "Ca Tự Chọn";
        else if (sNote) slotName = sNote;

        const matchingJob = jobsList.find(j => Number(j.businessId) === Number(sBusinessId));
        const title = matchingJob ? matchingJob.title : `Lịch phân công: ${slotName}`;
        const companyName = matchingJob ? (matchingJob.categoryName || matchingJob.title || "Cửa hàng") : "Cửa hàng đối tác";

        let status = "approved";
        if (sActualCheckOut) status = "completed";
        else if (sActualCheckIn) status = "checkin_active";

        const startHourStr = sStartTime && typeof sStartTime === 'string' && sStartTime.includes('T')
          ? new Date(sStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : "08:00";
        const endHourStr = sEndTime && typeof sEndTime === 'string' && sEndTime.includes('T')
          ? new Date(sEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : "12:00";

        return {
          id: `sched_${sId}`,
          scheduleId: sId,
          jobShiftId: sJobShiftId,
          jobId: matchingJob ? matchingJob.id : firstJobId,
          shiftId: sJobShiftId || sId,
          jobTitle: title,
          companyName,
          shiftDate: sStartTime,
          shiftStartTime: startHourStr,
          shiftEndTime: endHourStr,
          shiftSalary: sSalary,
          status,
          isSchedule: true
        };
      });

      const combined = [...appShifts];
      schedShifts.forEach(sched => {
        const existingIdx = combined.findIndex(a => a.shiftId && Number(a.shiftId) === Number(sched.jobShiftId));
        if (existingIdx >= 0) {
          combined[existingIdx] = {
            ...combined[existingIdx],
            shiftDate: sched.shiftDate,
            shiftStartTime: sched.shiftStartTime,
            shiftEndTime: sched.shiftEndTime,
            status: sched.status
          };
        } else {
          combined.push(sched);
        }
      });

      return combined;
    }
  });

  // 2. Fetch payrolls via TanStack useQuery
  const { data: payrolls = [] } = useQuery({
    queryKey: ["studentPayrolls", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const payrollsRes = await getStudentPayrolls().catch(() => []);
      return Array.isArray(payrollsRes)
        ? payrollsRes
        : (payrollsRes && Array.isArray(payrollsRes.data))
        ? payrollsRes.data
        : [];
    }
  });

  useEffect(() => {
    const days = getWeekDaysForDate(referenceDate);
    setWeekDays(days);
    const todayIdx = days.findIndex(d => d.isToday);
    setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0);
  }, [referenceDate]);

  const handlePrevWeek = () => {
    const prev = new Date(referenceDate);
    prev.setDate(prev.getDate() - 7);
    setReferenceDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + 7);
    setReferenceDate(next);
  };

  const handleGoToToday = () => {
    setReferenceDate(new Date());
  };

  const handleCancelClick = (app) => {
    setSelectedApp(app);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmittingCancel(true);
    try {
      await cancelApplicationApi(selectedApp.id, selectedApp.businessId || 1, cancelReason || "Em bận lịch đột xuất.");
      setCancelModalOpen(false);
      setSelectedApp(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["myApplications", user?.id] });
      toast.success("Hủy lịch làm việc thành công! ✨");
    } catch (err) {
      toast.error(err.message || "Không thể hủy lịch làm việc. Vui lòng liên hệ chủ quán.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "approved":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">Đã duyệt</span>;
      case "pending":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Chờ duyệt</span>;
      case "completed":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">Hoàn thành</span>;
      case "cancelled":
      case "canceled":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-200">Đã hủy</span>;
      case "rejected":
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-200">Từ chối</span>;
      default:
        return <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  const selectedDay = weekDays[selectedDayIndex];

  // Filter application items
  const filteredApps = (applications || []).filter((app) => {
    if (!selectedDay) return false;
    const matchDate = isSameDate(app.shiftDate, selectedDay.apiDateStr);
    if (!matchDate) return false;

    const status = (app.status || "").toLowerCase();
    if (activeTab === "upcoming") {
      return status === "approved" || status === "pending" || status === "applied" || status === "checkin_active";
    } else {
      return status === "completed" || status === "rejected" || status === "cancelled" || status === "canceled";
    }
  });

  const getMonthLabel = () => {
    if (!selectedDay) return "";
    return `Tháng ${selectedDay.month}, ${selectedDay.fullYear}`;
  };

  const hasAppOnDay = (apiDateStr) => {
    return (applications || []).some(app => isSameDate(app.shiftDate, apiDateStr));
  };

  // Helper to calculate shift hours
  const getShiftHours = (app) => {
    if (!app.shiftStartTime || !app.shiftEndTime) return 4;
    try {
      const parseTime = (timeStr, baseDateInput) => {
        const baseDate = new Date(baseDateInput || new Date());
        const [hours, minutes] = timeStr.split(':').map(Number);
        const d = new Date(baseDate);
        d.setHours(hours, minutes, 0, 0);
        return d;
      };
      const start = parseTime(app.shiftStartTime, app.shiftDate);
      const end = parseTime(app.shiftEndTime, app.shiftDate);
      const diffMs = end - start;
      const diffHrs = diffMs / (1000 * 60 * 60);
      return diffHrs > 0 ? diffHrs : 4;
    } catch (e) {
      return 4;
    }
  };

  // Monthly Earnings calculation (same as mobile)
  const currentMonth = selectedDay ? selectedDay.month : (new Date().getMonth() + 1);
  const currentYear = selectedDay ? selectedDay.fullYear : new Date().getFullYear();

  const completedPayrollEarnings = (payrolls || [])
    .filter(p => p.status === 'Paid' || p.Status === 'Paid' || p.status === 2 || p.Status === 2)
    .reduce((sum, p) => sum + (p.finalAmount || p.FinalAmount || 0), 0);

  const completedShiftsValue = (applications || [])
    .filter(app => {
      if ((app.status || "").toLowerCase() !== "completed") return false;
      const d = new Date(app.shiftDate);
      return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, app) => sum + Math.round((app.shiftSalary || 0) * getShiftHours(app)), 0);

  const upcomingShiftsValue = (applications || [])
    .filter(app => {
      const status = (app.status || "").toLowerCase();
      if (status !== "approved") return false;
      const d = new Date(app.shiftDate);
      return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, app) => sum + Math.round((app.shiftSalary || 0) * getShiftHours(app)), 0);

  const totalValue = completedShiftsValue + upcomingShiftsValue;
  const completedEarnings = completedPayrollEarnings;
  const projectedEarnings = Math.max(0, totalValue - completedEarnings);
  const totalEarnings = completedEarnings + projectedEarnings;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto min-h-screen">
      {/* 1. Header Row */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Glow circles decoration */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 bg-orange-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-14 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="text-[10px] uppercase font-extrabold tracking-widest bg-orange-500/20 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full backdrop-blur-xs">
            📅 Roster Calendar
          </span>
          <h1 className="text-3xl font-black text-white mt-3.5 tracking-tight">Lịch Roster & Nhật Ký Ca Làm</h1>
          <p className="text-slate-350 text-xs mt-1 max-w-xl">
            Theo dõi lịch làm việc đã duyệt, quản lý ca làm của bạn và cập nhật chi tiết lịch hoạt động hàng ngày.
          </p>
        </div>
        
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["myApplications", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["studentPayrolls", user?.id] });
          }}
          className="relative z-10 p-3.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 text-white rounded-2xl shadow-md backdrop-blur-xs transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <RefreshCw size={18} className="animate-spin-slow text-amber-200" />
        </button>
      </div>

      {/* Main Grid: Left for Roster & Right for Earnings */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left column: Calendar & List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Week Calendar Navigation Bar */}
          <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-800 text-sm tracking-tight uppercase flex items-center gap-1.5">
                <span>🗓️</span> {getMonthLabel()}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevWeek}
                  className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleGoToToday}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Hôm nay
                </button>
                <button
                  onClick={handleNextWeek}
                  className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, idx) => {
                const isSelected = idx === selectedDayIndex;
                const hasShift = hasAppOnDay(day.apiDateStr);
                return (
                  <button
                    key={day.apiDateStr}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex flex-col items-center justify-center py-3 rounded-2xl transition cursor-pointer border relative ${
                      isSelected
                        ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/15"
                        : day.isToday
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">
                      {day.name}
                    </span>
                    <span className="text-sm font-black mt-1">
                      {day.dayOfMonth}
                    </span>
                    {/* Shift indicator dot */}
                    {hasShift && (
                      <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-orange-600 animate-pulse"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Bar selector */}
          <div className="flex border border-slate-100 bg-white p-1.5 rounded-2xl shadow-xs max-w-sm">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                activeTab === "upcoming"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sắp tới
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                activeTab === "completed"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Lịch sử ca làm
            </button>
          </div>

          {/* Main list layout */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-md">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-4" />
              <p className="text-slate-500 text-sm font-semibold">Đang tải lịch trình ca làm của bạn...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 shadow-md text-center">
              <Calendar className="text-slate-300 mb-4" size={48} />
              <p className="text-slate-800 font-bold">Lịch trình hôm nay trống</p>
              <p className="text-slate-400 text-xs mt-1">
                {activeTab === "upcoming"
                  ? "Bạn không có ca làm nào sắp diễn ra vào ngày này."
                  : "Bạn không có lịch sử ca làm nào được ghi nhận vào ngày này."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              {filteredApps.map((app) => {
                const dateObj = app.shiftDate ? new Date(app.shiftDate) : new Date();
                const weekday = dateObj.toLocaleDateString("vi-VN", { weekday: 'long' });
                const dayStr = dateObj.toLocaleDateString("vi-VN", { day: 'numeric', month: 'numeric' });
                
                const isApproved = (app.status || "").toLowerCase() === "approved" || (app.status || "").toLowerCase() === "checkin_active";
                const isCompleted = (app.status || "").toLowerCase() === "completed";
                const companyName = app.companyName || app.company || "Cửa hàng";
                const hrs = getShiftHours(app);
                const estimatedSalary = Math.round((app.shiftSalary || 25000) * hrs);

                return (
                  <article
                    key={app.id}
                    className="bg-white border border-slate-100 shadow-md rounded-3xl p-5 hover:border-orange-200 hover:shadow-lg transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 duration-200"
                  >
                    {/* Left Side: Date Calendar Sheet & Details */}
                    <div 
                      onClick={() => onSelectJob && onSelectJob(app.jobId || 1, app.shiftId || 1)}
                      className="flex items-center gap-4 w-full md:w-auto cursor-pointer group flex-1"
                    >
                      {/* Calendar Sheet Visual */}
                      <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                        <span className="text-[10px] font-black uppercase text-orange-650">{weekday.split(' ')[1] || weekday}</span>
                        <span className="text-lg font-black text-slate-800 -mt-0.5">{dayStr}</span>
                      </div>

                      {/* Core details */}
                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-extrabold text-slate-800 text-base group-hover:text-orange-600 transition-colors">
                          {app.jobTitle || "Ca làm việc"}
                          {(app.isUrgent || app.isEmergency) && (
                            <span className="text-orange-600 font-extrabold text-xs ml-1.5">(KHẨN CẤP)</span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold">{companyName}</p>
                        {app.address && (
                          <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mt-0.5 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span>{app.address}</span>
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" />
                            <span>{app.shiftStartTime?.slice(0, 5)} - {app.shiftEndTime?.slice(0, 5)}</span>
                          </span>
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            <DollarSign size={13} className="text-emerald-500" />
                            <span>{app.shiftSalary?.toLocaleString()} đ/giờ ({estimatedSalary.toLocaleString("vi-VN")}đ)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Badges & Action Buttons */}
                    <div className="flex flex-row md:flex-col items-end gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-3 md:pt-0">
                      <div className="flex flex-col items-end gap-1.5 justify-center">
                        {getStatusBadge(app.status)}
                      </div>

                      {isApproved && !isCompleted && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToCheckIn && onNavigateToCheckIn(app);
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-xs shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <MapPin size={14} className="fill-white/20" />
                            <span>Điểm Danh</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelClick(app);
                            }}
                            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 font-bold text-xs rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            title="Xin nghỉ ca"
                          >
                            <XCircle size={14} />
                            <span>Xin Nghỉ Ca</span>
                          </button>
                        </div>
                      )}

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 size={13} /> Đã điểm danh
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Sticky Monthly Earnings */}
        <div className="lg:col-span-4 sticky top-6">
          <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6 flex flex-col gap-6 transition hover:shadow-2xl duration-300">
            {/* Widget Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Ví thu nhập tháng</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Tháng này ({getMonthLabel()})</p>
              </div>
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl shadow-xs">
                <DollarSign size={20} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Total Earnings amount */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tổng thu nhập dự tính</span>
              <span className="text-3xl font-black text-slate-800 mt-1">
                {totalEarnings.toLocaleString("vi-VN")} <span className="text-lg font-bold text-orange-600">đ</span>
              </span>
            </div>

            {/* Breakdown progress bar illustration */}
            <div className="flex flex-col gap-4">
              {/* Paid progress */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Đã nhận (Thực nhận)</span>
                  <span className="text-emerald-600">{completedEarnings.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalEarnings > 0 ? (completedEarnings / totalEarnings) * 100 : 0}%` }}
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Waiting progress */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Chờ nhận (Dự kiến)</span>
                  <span className="text-orange-600">{projectedEarnings.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalEarnings > 0 ? (projectedEarnings / totalEarnings) * 100 : 0}%` }}
                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Note info banner */}
            <div className="text-[11px] leading-relaxed text-slate-400 bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl">
              💡 **Gợi ý:** Tổng thu nhập tính bằng tổng mức lương các ca đã đi làm hoàn thành và các ca làm sắp làm đã được chủ quán duyệt.
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal popup */}
      {cancelModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleCancelSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="font-black text-lg text-slate-800 text-red-600 flex items-center gap-2">
                  <AlertCircle size={20} /> Xác nhận xin nghỉ ca
                </h3>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Đóng
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1">
                <p className="text-slate-400 font-semibold">CA LÀM XIN NGHỈ:</p>
                <p className="font-bold text-slate-800 text-sm">{selectedApp.jobTitle}</p>
                <p className="text-slate-600 font-semibold">{selectedApp.companyName || selectedApp.company}</p>
                <p className="text-red-500 font-bold">
                  Ngày trực: {new Date(selectedApp.shiftDate).toLocaleDateString()} ({selectedApp.shiftStartTime?.slice(0, 5)} - {selectedApp.shiftEndTime?.slice(0, 5)})
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Lý do xin nghỉ ca (Gửi chủ quán duyệt)</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng cung cấp lý do chi tiết..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-amber-400 focus:bg-white transition"
                />
              </div>

              <p className="text-[10px] text-amber-600 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">
                ⚠️ **Chú ý:** Việc tự ý hủy ca làm việc đã duyệt mà không có lý do chính đáng có thể làm giảm điểm uy tín E-Portfolio của bạn.
              </p>

              <button
                type="submit"
                disabled={submittingCancel}
                className="w-full h-11 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 text-white rounded-2xl font-bold shadow-lg shadow-red-600/10 transition flex items-center justify-center gap-2 text-sm"
              >
                {submittingCancel ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>Xác nhận hủy ca làm</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
