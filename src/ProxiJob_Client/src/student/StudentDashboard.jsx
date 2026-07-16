import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, MapPin, Briefcase, DollarSign, Calendar, Star, Compass } from "lucide-react";
import { getPublishedJobs, getCategoriesApi } from "../api/jobs";
import { useAuth } from "../auth/AuthContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

  // 3. Fetch jobs based on coordinates
  useEffect(() => {
    setLoading(true);
    getPublishedJobs(selectedCategory || null, 1, 30, coords.latitude, coords.longitude)
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Failed to fetch jobs:", err);
        setLoading(false);
      });
  }, [selectedCategory, coords]);

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
              <p class="text-amber-600 font-semibold mt-1">${job.salary?.toLocaleString()}đ/giờ</p>
              <button onclick="window.dispatchEvent(new CustomEvent('select-job', {detail: ${job.id}}))" 
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
        onSelectJob(e.detail);
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
    const salaryVal = job.salary || 0;
    const matchSalary = salaryVal >= minSalary;

    return matchSearch && matchSalary;
  });

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto min-h-screen">
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

      {/* 2. Interactive Map Component */}
      <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-900/5 overflow-hidden flex flex-col">
        <div className="p-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Radar việc làm GPS (Leaflet Map)</h2>
          </div>
          <button
            onClick={() => setMapExpanded(!mapExpanded)}
            className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition"
          >
            {mapExpanded ? "Thu Nhỏ Bản Đồ ↩️" : "Mở Rộng Bản Đồ 🔍"}
          </button>
        </div>
        <div 
          ref={mapRef} 
          className="transition-all duration-300 relative z-0" 
          style={{ height: mapExpanded ? "450px" : "220px" }}
        />
      </div>

      {/* 3. Search and Filter Bar */}
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
      </div>

      {/* 4. Jobs Grid List */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-lg">Việc làm phù hợp ({filteredJobs.length})</h3>
          <span className="text-xs text-slate-400 font-semibold">Tự động sắp xếp theo vị trí gần bạn nhất</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-md">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-4" />
            <p className="text-slate-500 text-sm font-semibold">Đang quét ca trực xung quanh bạn...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 shadow-md text-center">
            <span className="text-4xl mb-4">🔍</span>
            <p className="text-slate-800 font-bold">Không tìm thấy ca trực nào phù hợp</p>
            <p className="text-slate-400 text-xs mt-1">Hãy thay đổi bộ lọc hoặc vị trí của bạn để quét rộng hơn nhé.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => {
              const isUrgent = job.isUrgent || job.urgent;
              const companyName = job.companyName || job.company || "Cửa hàng tuyển dụng";
              return (
                <article
                  key={job.id}
                  onClick={() => onSelectJob && onSelectJob(job.id)}
                  className="group relative bg-white border border-slate-100 hover:border-orange-200 rounded-3xl p-6 shadow-md hover:shadow-xl transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Urgency Badge */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        {job.categoryName || "Part-time"}
                      </span>
                      {isUrgent && (
                        <span className="text-xs font-extrabold tracking-wide uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md animate-pulse">
                          ⚡ Gấp
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-slate-800 text-base group-hover:text-orange-600 transition line-clamp-1">
                      {job.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{companyName}</p>

                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="line-clamp-1">{job.address || "Quanh vị trí của bạn"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <DollarSign size={14} className="text-emerald-500" />
                        <span className="font-bold text-emerald-600">{job.salary?.toLocaleString()} đ / giờ</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
                    {job.distance !== undefined ? (
                      <span className="text-slate-400 font-semibold">📍 Cách bạn: <strong className="text-slate-600">{~~job.distance}m</strong></span>
                    ) : (
                      <span className="text-slate-400 font-semibold">📍 Quét định vị</span>
                    )}
                    <span className="font-bold text-orange-600 group-hover:translate-x-1 transition duration-200">
                      Xem ca trực →
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
