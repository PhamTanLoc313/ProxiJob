import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

export default function CustomTimePicker({ value, onChange, className = "", inputHeightClass = "h-12" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, minute] = (value || "08:00").split(":");
  
  const hourContainerRef = useRef(null);
  const minuteContainerRef = useRef(null);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  useEffect(() => {
    if (isOpen) {
      // Scroll active elements locally into view on open
      const timer = setTimeout(() => {
        const activeHour = hourContainerRef.current?.querySelector('[data-active="true"]');
        if (activeHour && hourContainerRef.current) {
          const container = hourContainerRef.current;
          container.scrollTop = activeHour.offsetTop - (container.clientHeight / 2) + (activeHour.clientHeight / 2);
        }
        const activeMinute = minuteContainerRef.current?.querySelector('[data-active="true"]');
        if (activeMinute && minuteContainerRef.current) {
          const container = minuteContainerRef.current;
          container.scrollTop = activeMinute.offsetTop - (container.clientHeight / 2) + (activeMinute.clientHeight / 2);
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleHourSelect = (h) => {
    onChange(`${h}:${minute}`);
  };

  const handleMinuteSelect = (m) => {
    onChange(`${hour}:${m}`);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${inputHeightClass} px-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus-within:border-orange-400 focus-within:bg-white rounded-2xl text-sm transition-all font-bold text-slate-700 shadow-sm flex items-center justify-center cursor-pointer select-none relative`}
      >
        <div className="absolute left-4 text-slate-400">
          <Clock size={16} />
        </div>
        <span className="text-slate-800">{value}</span>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-2 w-56 bg-white border border-slate-100 shadow-2xl rounded-3xl p-4 z-40 grid grid-cols-2 gap-3" style={{ animation: "fadeInUp 0.15s ease-out" }}>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 text-center mb-2">Giờ</span>
              <div 
                ref={hourContainerRef}
                className="h-40 overflow-y-auto space-y-1 pr-1 scrollbar-none select-none scroll-smooth relative py-1"
              >
                {hours.map((h) => {
                  const active = h === hour;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-active={active}
                      onClick={() => handleHourSelect(h)}
                      className={`w-full py-1.5 rounded-xl text-xs font-black transition-all ${
                        active
                          ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-105"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 text-center mb-2">Phút</span>
              <div
                ref={minuteContainerRef}
                className="h-40 overflow-y-auto space-y-1 pr-1 scrollbar-none select-none scroll-smooth relative py-1"
              >
                {minutes.map((m) => {
                  const active = m === minute;
                  return (
                    <button
                      key={m}
                      type="button"
                      data-active={active}
                      onClick={() => handleMinuteSelect(m)}
                      className={`w-full py-1.5 rounded-xl text-xs font-black transition-all ${
                        active
                          ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-105"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
