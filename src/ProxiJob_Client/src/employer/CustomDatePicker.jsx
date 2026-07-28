import { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomDatePicker({ value, onChange, className = "", inputHeightClass = "h-10" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date value (expecting YYYY-MM-DD)
  const today = new Date();
  const initialDate = value ? new Date(value) : null;
  
  const [viewDate, setViewDate] = useState(initialDate || today);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d);
      setViewDate(d);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Helper arrays
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  // Calculate calendar grid days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const daysGrid = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysGrid.push({
      day: prevMonthTotalDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  // Next month leading days (pad to complete the grid rows)
  const remaining = 42 - daysGrid.length;
  for (let i = 1; i <= remaining; i++) {
    daysGrid.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false
    });
  }

  // Handle month changes
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Format date to string: DD/MM/YYYY for UI
  const formatDisplayDate = (d) => {
    if (!d || isNaN(d.getTime())) return "Chọn ngày...";
    const dd = d.getDate().toString().padStart(2, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Convert date object to YYYY-MM-DD for backend
  const formatBackendDate = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const dd = dateObj.getDate().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDayClick = (item) => {
    const targetDate = new Date(item.year, item.month, item.day);
    setSelectedDate(targetDate);
    onChange(formatBackendDate(targetDate));
    setIsOpen(false);
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${inputHeightClass} pl-10 pr-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-400 focus:bg-white rounded-2xl text-xs font-bold text-slate-700 shadow-sm flex items-center justify-between cursor-pointer select-none relative transition-all`}
      >
        <div className="absolute left-3.5 text-slate-400">
          <CalendarIcon size={14} />
        </div>
        <span>{formatDisplayDate(selectedDate)}</span>
      </button>

      {isOpen && (
        <div 
          className="absolute left-0 mt-2 w-[280px] bg-white border border-slate-100 shadow-2xl rounded-3xl p-4 z-50 flex flex-col gap-3" 
          style={{ animation: "fadeInUp 0.15s ease-out" }}
        >
          {/* Header controls */}
          <div className="flex justify-between items-center bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-100 shadow-xs transition-all duration-200"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-black text-slate-800 font-sans tracking-tight">
              {months[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-100 shadow-xs transition-all duration-200"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((w, idx) => (
              <span key={idx} className="text-[10px] font-black text-slate-400 font-sans">
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((item, idx) => {
              const isSelected = selectedDate && 
                selectedDate.getDate() === item.day && 
                selectedDate.getMonth() === item.month && 
                selectedDate.getFullYear() === item.year;

              const isToday = today.getDate() === item.day && 
                today.getMonth() === item.month && 
                today.getFullYear() === item.year;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(item)}
                  className={`aspect-square w-full rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 scale-105"
                      : isToday
                      ? "bg-orange-50 text-orange-600 border border-orange-200"
                      : item.isCurrentMonth
                      ? "text-slate-700 hover:bg-slate-50 hover:text-orange-600"
                      : "text-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Quick links */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 px-1">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                onChange("");
                setIsOpen(false);
              }}
              className="text-[10px] font-extrabold text-slate-400 hover:text-slate-700"
            >
              Xóa ngày
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(today);
                onChange(formatBackendDate(today));
                setIsOpen(false);
              }}
              className="text-[10px] font-extrabold text-orange-600 hover:text-orange-700"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
