import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, MapPin, Briefcase, DollarSign, Calendar, Clock, Star, Compass, ChevronLeft, ChevronRight } from "lucide-react";
import { getPublishedJobs, getCategoriesApi, getJobPostShifts } from "../api/jobs";
import { useAuth } from "../auth/AuthContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Haversine formula for distance calculation
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Category theme colors helper
const getCategoryTheme = (categoryName) => {
  const name = (categoryName || "").toLowerCase();

  if (name.includes("giao hàng") || name.includes("delivery") || name.includes("shipper")) {
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
      accent: "#EF4444",
      accentBg: "#FFE4E6",
      borderLight: "#F87171"
    };
  }
  if (name.includes("gia sư") || name.includes("tutor") || name.includes("dạy") || name.includes("học")) {
    return {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-300",
      accent: "#2563EB",
      accentBg: "#DBEAFE",
      borderLight: "#60A5FA"
    };
  }
  if (name.includes("sửa chữa") || name.includes("repair") || name.includes("bảo trì") || name.includes("kỹ thuật")) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-300",
      accent: "#F59E0B",
      accentBg: "#FEF3C7",
      borderLight: "#FBBF24"
    };
  }
  if (name.includes("phục vụ") || name.includes("waiter") || name.includes("chạy bàn") || name.includes("phụ vụ") || name.includes("cafe") || name.includes("cà phê")) {
    return {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-300",
      accent: "#8B5CF6",
      accentBg: "#F3E8FF",
      borderLight: "#C084FC"
    };
  }
  if (name.includes("thú cưng") || name.includes("pet")) {
    return {
      bg: "bg-pink-100",
      text: "text-pink-700",
      border: "border-pink-300",
      accent: "#EC4899",
      accentBg: "#FCE7F3",
      borderLight: "#F472B6"
    };
  }
  return {
    bg: "bg-teal-100",
    text: "text-teal-700",
    border: "border-teal-300",
    accent: "#0D9488",
    accentBg: "#CCFBF1",
    borderLight: "#2DD4BF"
  };
};

const checkIsEmergency = (title, description) => {
  const t = (title || "").toLowerCase();
  const d = (description || "").toLowerCase();
  return (
    t.includes("khẩn cấp") ||
    t.includes("khấn cấp") ||
    t.includes("khần cấp") ||
    t.includes("tuyển gấp") ||
    t.includes("gấp") ||
    d.includes("khẩn cấp") ||
    d.includes("khấn cấp") ||
    d.includes("khần cấp") ||
    d.includes("tuyển gấp") ||
    d.includes("gấp")
  );
};

const getShopBgColor = (shopName) => {
  if (!shopName || shopName.includes("Cửa hàng tuyển dụng")) return '#EFF6FF';
  const charCode = shopName.charCodeAt(0) || 0;
  const colors = ['#FFE4E6', '#FEF3C7', '#ECFDF5', '#EFF6FF', '#F5F3FF', '#FFF7ED'];
  return colors[charCode % colors.length];
};

const getShopTextColor = (shopName) => {
  if (!shopName || shopName.includes("Cửa hàng tuyển dụng")) return '#2563EB';
  const charCode = shopName.charCodeAt(0) || 0;
  const colors = ['#E11D48', '#D97706', '#059669', '#2563EB', '#7C3AED', '#EA580C'];
  return colors[charCode % colors.length];
};

const getCategoryInitials = (categoryName) => {
  if (!categoryName) return 'PJ';
  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };
  const clean = removeAccents(categoryName).trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return 'PJ';
};

const getShopInitials = (shopName) => {
  if (!shopName || shopName.includes("Cửa hàng tuyển dụng")) return 'PJ';
  const cleanName = shopName.replace(/(Coffee|Tea|Restaurant|Store|Shop|Quán|Café|Cửa hàng|Doanh nghiệp)/gi, '').trim();
  if (!cleanName) return 'PJ';
  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).substring(0, 2).toUpperCase();
  }
  return cleanName.substring(0, 2).toUpperCase();
};

const getSalary = (job) => {
  if (!job) return 0;
  return job.shiftSalary !== undefined ? job.shiftSalary : 0;
};

const formatTimeVN = (dateInput) => {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

const formatDateVN = (dateInput) => {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return '';
  }
};

export default function StudentDashboard({ onSelectJob }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minSalary, setMinSalary] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState({ latitude: 10.857461, longitude: 106.801522 }); // Default: FPT University HCMC
  const [mapExpanded, setMapExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersLayer = useRef(null);

  // 1. Get browser geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log("[GPS] Failed to retrieve geolocation, using default campus coordinates.", error);
        }
      );
    }
  }, []);

  // 2. Fetch categories
  useEffect(() => {
    getCategoriesApi()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.log("Failed to load categories:", err));
  }, []);

  // 3. Fetch jobs and their shifts, and calculate distances on frontend
  useEffect(() => {
    setLoading(true);
    getPublishedJobs(selectedCategory || null, 1, 100)
      .then(async (data) => {
        const rawJobs = Array.isArray(data)
          ? data
          : (data && Array.isArray(data.items))
            ? data.items
            : (data && data.data && Array.isArray(data.data.items))
              ? data.data.items
              : (data && data.data && Array.isArray(data.data))
                ? data.data
                : [];

        // Fetch shifts for all job posts in parallel
        const shiftResults = await Promise.all(
          rawJobs.map(async (job) => {
            try {
              const jobShiftsRes = await getJobPostShifts(job.id);
              const jobShifts = Array.isArray(jobShiftsRes)
                ? jobShiftsRes
                : (jobShiftsRes && Array.isArray(jobShiftsRes.data))
                  ? jobShiftsRes.data
                  : (jobShiftsRes?.items || jobShiftsRes?.Items || []);

              return jobShifts.map((s) => {
                const shiftSalary = s.salary !== undefined ? s.salary : (s.Salary !== undefined ? s.Salary : 0);
                const shiftSlots = s.slots !== undefined ? s.slots : (s.Slots !== undefined ? s.Slots : 0);
                const shiftRemainingSlots = s.remainingSlots !== undefined ? s.remainingSlots : (s.RemainingSlots !== undefined ? s.RemainingSlots : 0);

                return {
                  ...job,
                  shiftId: s.id, // Target shift ID
                  startTime: s.startTime || s.StartTime,
                  endTime: s.endTime || s.EndTime,
                  shiftSalary,
                  slots: shiftSlots,
                  remainingSlots: shiftRemainingSlots,
                };
              });
            } catch (err) {
              console.log(`Failed to fetch shifts for job ${job.id}:`, err);
              return [];
            }
          })
        );

        const allShifts = shiftResults.flat();

        // Process distance for each shift
        const processedShifts = allShifts.map((shift) => {
          if (shift.latitude && shift.longitude) {
            const dist = getDistance(coords.latitude, coords.longitude, shift.latitude, shift.longitude);
            return { ...shift, distance: dist };
          }
          return { ...shift, distance: 999999 };
        });

        // Sort closest first
        processedShifts.sort((a, b) => a.distance - b.distance);
        setJobs(processedShifts);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Failed to fetch jobs and shifts:", err);
        setLoading(false);
      });
  }, [selectedCategory, coords]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, minSalary]);

  // 4. Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: true,
        dragging: true,
        touchZoom: true
      }).setView([coords.latitude, coords.longitude], 15);

      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 19
      }).addTo(leafletMap.current);

      markersLayer.current = L.layerGroup().addTo(leafletMap.current);
    } else {
      leafletMap.current.setView([coords.latitude, coords.longitude], 15);
    }

    // Clear old markers
    markersLayer.current.clearLayers();

    // Add Student location marker
    L.marker([coords.latitude, coords.longitude], {
      icon: L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white text-lg shadow-lg font-bold">📍</div>
          </div>
        `,
        className: "custom-user-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    })
      .addTo(markersLayer.current)
      .bindPopup("<b>Vị trí của bạn</b>");

    // Add Job markers
    jobs.forEach((job) => {
      if (job.latitude && job.longitude) {
        const isUrgent = job.isUrgent || job.urgent;
        L.marker([job.latitude, job.longitude], {
          icon: L.divIcon({
            html: `
              <div class="flex items-center justify-center rounded-full border-2 border-white text-white font-bold text-md shadow-md" 
                   style="background: ${isUrgent ? '#EF4444' : '#FF6B00'}; width: 34px; height: 34px; line-height: 30px; text-align: center;">
                💼
              </div>
            `,
            className: "custom-job-marker",
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          })
        })
          .addTo(markersLayer.current)
          .bindPopup(`
            <div class="p-1 font-sans text-xs">
              <p class="font-bold text-sm text-slate-800">${job.title}</p>
              <p class="text-slate-600">${job.companyName || job.company || "Cửa hàng"}</p>
              <p class="text-amber-600 font-semibold mt-1">${(getSalary(job) || 0).toLocaleString()}đ/giờ</p>
              <button onclick="window.dispatchEvent(new CustomEvent('select-job', {detail: {jobId: ${job.id}, shiftId: ${job.shiftId}}}))" 
                      style="margin-top: 6px; width: 100%; border: none; background: #FF6B00; color: white; padding: 4px 8px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                Xem Chi Tiết
              </button>
            </div>
          `);
      }
    });

    // Handle popup events
    const handleSelectJobEvent = (e) => {
      if (onSelectJob) {
        onSelectJob(e.detail.jobId, e.detail.shiftId);
      }
    };
    window.addEventListener("select-job", handleSelectJobEvent);

    return () => {
      window.removeEventListener("select-job", handleSelectJobEvent);
    };
  }, [coords, jobs]);

  // Filter jobs based on search term & salary
  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.companyName || job.company)?.toLowerCase().includes(searchTerm.toLowerCase());

    // Salary check
    const salaryVal = getSalary(job);
    const matchSalary = salaryVal >= minSalary;

    return matchSearch && matchSalary;
  });

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto min-h-screen">
      <style>{`
        @keyframes urgentPulse {
          0%, 100% {
            background-color: #ffffff;
            border-color: #f1f5f9;
          }
          50% {
            background-color: var(--urgent-bg);
            border-color: var(--urgent-border);
            box-shadow: 0 0 12px var(--urgent-glow);
          }
        }
        .urgent-flashing-card {
          animation: urgentPulse 1.8s infinite ease-in-out;
        }
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .urgent-badge-pulse {
          animation: badgePulse 1.2s infinite ease-in-out;
        }
      `}</style>

      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500 to-orange-600 p-6 text-white shadow-xl shadow-orange-500/10">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur">
              👋 Chào mừng, {user?.name || "Sinh viên"}
            </span>
            <h1 className="text-3xl font-black mt-2 tracking-tight">Tìm ca trực quanh bạn ngay lập tức!</h1>
            <p className="mt-1 text-white/80 text-sm max-w-xl">
              Ghép ca làm việc trong bán kính 100m. Nhận lương quyết toán nhanh chóng, an toàn.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur">
            <Compass className="animate-spin text-amber-200" size={24} />
            <div className="text-xs">
              <p className="font-bold text-amber-100">Bán kính quét</p>
              <p className="text-white">Dưới 10km quanh vị trí hiện tại</p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* 2. Search and Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/4 p-5 flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-12">
          {/* Search box */}
          <div className="relative md:col-span-6">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề công việc hoặc tên quán..."
              className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition"
            />
          </div>

          {/* Category drop down */}
          <div className="relative md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition appearance-none cursor-pointer"
            >
              <option value="">Tất cả ngành nghề</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Salary filter */}
          <div className="relative md:col-span-3">
            <select
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition appearance-none cursor-pointer"
            >
              <option value="0">Tất cả mức lương</option>
              <option value="20000">Từ 20.000đ/h</option>
              <option value="25000">Từ 25.000đ/h</option>
              <option value="30000">Từ 30.000đ/h</option>
              <option value="35000">Từ 35.000đ/h</option>
            </select>
          </div>
        </div>

        {/* Horizontal scrollable category Quick Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${selectedCategory === ""
                ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/15"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
          >
            💼 Tất cả
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id.toString() || selectedCategory === cat.id;
            let icon = "🏷️";
            const name = cat.name.toLowerCase();
            if (name.includes("phục vụ") || name.includes("nhà hàng") || name.includes("ăn uống")) icon = "🍽️";
            else if (name.includes("gia sư") || name.includes("dạy") || name.includes("học")) icon = "📚";
            else if (name.includes("giao hàng") || name.includes("shipper")) icon = "🛵";
            else if (name.includes("sửa chữa") || name.includes("kỹ thuật") || name.includes("bảo trì")) icon = "🔧";
            else if (name.includes("thú cưng") || name.includes("pet")) icon = "🐾";
            else if (name.includes("cafe") || name.includes("cà phê")) icon = "☕";

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id.toString())}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${isSelected
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/15"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {icon} {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Grid layout: List + Map */}
      <div className="grid gap-6 lg:grid-cols-12 mt-2">
        {/* Left side: Job list */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-lg">Việc làm phù hợp ({filteredJobs.length})</h3>
            <span className="text-xs text-slate-400 font-semibold">Tự động sắp xếp theo vị trí gần bạn nhất</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-md">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-4" />
              <p className="text-slate-500 text-sm font-semibold">Đang quét ca trực xung quanh bạn...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-md text-center">
              <span className="text-4xl mb-4">🔍</span>
              <p className="text-slate-800 font-bold">Không tìm thấy ca trực nào phù hợp</p>
              <p className="text-slate-400 text-xs mt-1">Hãy thay đổi bộ lọc hoặc vị trí của bạn để quét rộng hơn nhé.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredJobs.slice((currentPage - 1) * 10, currentPage * 10).map((job) => {
                const isUrgent = checkIsEmergency(job.title, job.description);
                const companyName = job.companyName || job.company || "Cửa hàng tuyển dụng";
                const theme = getCategoryTheme(job.categoryName);
                
                const initials = getCategoryInitials(job.categoryName);
                const avatarBg = getShopBgColor(companyName);
                const avatarText = getShopTextColor(companyName);
                const salaryVal = getSalary(job);

                return (
                  <article
                    key={`${job.id}_${job.shiftId}`}
                    onClick={() => onSelectJob && onSelectJob(job.id, job.shiftId)}
                    style={{
                      borderLeft: `6px solid ${theme.accent}`,
                      "--urgent-bg": theme.accentBg,
                      "--urgent-border": theme.borderLight,
                      "--urgent-glow": `${theme.accent}26`
                    }}
                    className={`group relative bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition duration-200 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isUrgent ? 'urgent-flashing-card' : ''}`}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Company Avatar */}
                      <div 
                        style={{ backgroundColor: avatarBg, color: avatarText }}
                        className="font-extrabold flex items-center justify-center rounded-xl w-12 h-12 shrink-0 border border-slate-200/50"
                      >
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Tags and Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${theme.bg} ${theme.text} border ${theme.border}`}>
                            {job.categoryName || "Part-time"}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                            Part-time
                          </span>
                          {job.remainingSlots !== undefined && (
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              job.remainingSlots <= 0 
                                ? "bg-red-50 text-red-700 border-red-200" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {job.remainingSlots <= 0 ? "Hết Slot" : `Còn ${job.remainingSlots}/${job.slots} Slot`}
                            </span>
                          )}
                          {isUrgent && (
                            <span className="text-[10px] font-black tracking-wide uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full urgent-badge-pulse flex items-center gap-0.5">
                              🔥 TUYỂN GẤP
                            </span>
                          )}
                          <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500 ml-auto sm:ml-0">
                            <Star size={12} fill="currentColor" /> 5.0
                          </div>
                        </div>

                        <h4 className="font-extrabold text-slate-800 text-base group-hover:text-orange-600 transition truncate">
                          {job.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">{companyName}</p>

                        {/* Shift Date and Time details */}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400 shrink-0" />
                            <span>{formatDateVN(job.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-400 shrink-0" />
                            <span>{formatTimeVN(job.startTime)} - {formatTimeVN(job.endTime)}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">{job.address || "Quanh vị trí của bạn"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <DollarSign size={14} className="text-emerald-500 shrink-0" />
                            <span className="font-bold text-emerald-600">
                              {salaryVal && salaryVal > 0 
                                ? `${salaryVal.toLocaleString('vi-VN')} đ/giờ` 
                                : "Lương thỏa thuận"
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 text-[11px] min-w-[120px]">
                      {job.distance !== undefined && job.distance < 999999 ? (
                        <span className="text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                          📍 Cách bạn: <strong className="text-slate-700">{(job.distance / 1000).toFixed(1)} km</strong>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                          📍 Quét định vị
                        </span>
                      )}
                      <button
                        type="button"
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl shadow-md shadow-orange-600/10 hover:shadow-orange-600/20 transition-all text-xs text-center cursor-pointer whitespace-nowrap mt-2"
                      >
                        Xem ca làm
                      </button>
                    </div>
                  </article>
                );
              })}

              {/* Pagination controls */}
              {Math.ceil(filteredJobs.length / 10) > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.ceil(filteredJobs.length / 10) }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-9 w-9 text-xs font-bold rounded-xl border transition-all cursor-pointer ${isCurrent
                            ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/15"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={currentPage === Math.ceil(filteredJobs.length / 10)}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredJobs.length / 10)))}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Map */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden flex flex-col">
            <div className="p-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Radar việc làm GPS</h2>
              </div>
            </div>
            <div
              ref={mapRef}
              className="relative z-0"
              style={{ height: "300px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
