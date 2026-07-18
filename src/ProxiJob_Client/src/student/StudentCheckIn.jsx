import { useState, useEffect, useRef } from "react";
import { MapPin, ShieldAlert, Award, Camera, CheckCircle2, AlertTriangle, Compass, Play, RefreshCw, XCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getPublishedJobs, getMyApplications } from "../api/jobs"; // To get active shifts
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Haversine formula
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

export default function StudentCheckIn() {
  const { user } = useAuth();
  const [activeShifts, setActiveShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [realCoords, setRealCoords] = useState(null);
  const [studentCoords, setStudentCoords] = useState({ latitude: 10.857461, longitude: 106.801522 });
  const [checkedInShift, setCheckedInShift] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const mapRef = useRef(null);
  const checkinMap = useRef(null);
  const markersGroup = useRef(null);

  // 1. Fetch Location using laptop's browser GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setRealCoords(coords);
          setStudentCoords(coords);
        },
        (err) => console.log("Failed to load browser GPS", err)
      );
    }
  }, []);

  // 2. Fetch student's real approved shifts
  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMyApplications(user.id).catch(() => []),
      getPublishedJobs(null, 1, 100).catch(() => [])
    ])
      .then(([appsRes, jobsRes]) => {
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
          : (jobsRes && jobsRes.data && Array.isArray(jobsRes.data))
          ? jobsRes.data
          : [];

        // Filter approved applications
        const approvedApps = rawApps.filter((app) => (app.status || "").toLowerCase() === "approved");

        // Format dates into simple hours/minutes
        const formatTime = (dateTimeInput) => {
          if (!dateTimeInput) return "00:00";
          try {
            const d = new Date(dateTimeInput);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          } catch (e) {
            return "00:00";
          }
        };

        const mappedShifts = approvedApps.map((app) => {
          const matchingJob = jobsList.find((job) => {
            return Array.isArray(job.shifts) && job.shifts.some((s) => s.id === app.shiftId);
          });

          const realLat = matchingJob ? (matchingJob.latitude || (matchingJob.location && matchingJob.location.latitude)) : null;
          const realLng = matchingJob ? (matchingJob.longitude || (matchingJob.location && matchingJob.location.longitude)) : null;
          const realAddress = matchingJob ? (matchingJob.address || (matchingJob.location && matchingJob.location.address)) : null;
          const realShopName = matchingJob ? (matchingJob.companyName || matchingJob.company) : null;

          return {
            id: app.shiftId,
            applicationId: app.id,
            title: app.jobTitle || (matchingJob && matchingJob.title) || "Ca làm việc",
            shopName: realShopName || app.companyName || app.company || "Cửa hàng tuyển dụng",
            address: realAddress || app.address || "Quanh vị trí của bạn",
            latitude: realLat || 10.857461,
            longitude: realLng || 106.801522,
            startTime: formatTime(app.shiftStartTime),
            endTime: formatTime(app.shiftEndTime),
            salary: app.salary || 0,
            status: "approved"
          };
        });

        setActiveShifts(mappedShifts);
        if (mappedShifts.length > 0) {
          setSelectedShift(mappedShifts[0]);
        } else {
          setSelectedShift(null);
        }
      })
      .catch((err) => console.log("Failed to fetch active shifts:", err));
  }, [user]);

  // Update studentCoords whenever realCoords change
  useEffect(() => {
    if (realCoords) {
      setStudentCoords(realCoords);
    }
  }, [realCoords]);

  // 4. Load Leaflet CheckIn Map
  useEffect(() => {
    if (!mapRef.current || !selectedShift) return;

    if (!checkinMap.current) {
      checkinMap.current = L.map(mapRef.current, {
        zoomControl: true,
        dragging: true,
        touchZoom: true
      }).setView([selectedShift.latitude, selectedShift.longitude], 16);

      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 19
      }).addTo(checkinMap.current);

      markersGroup.current = L.layerGroup().addTo(checkinMap.current);
    } else {
      checkinMap.current.setView([selectedShift.latitude, selectedShift.longitude], 16);
    }

    markersGroup.current.clearLayers();

    // 1. Store boundary (100m geofence circle)
    L.circle([selectedShift.latitude, selectedShift.longitude], {
      color: "#00D1FF",
      fillColor: "#00D1FF",
      fillOpacity: 0.15,
      radius: 100
    }).addTo(markersGroup.current);

    // 2. Shop Marker
    L.marker([selectedShift.latitude, selectedShift.longitude], {
      icon: L.divIcon({
        html: `<div style="background: #EF4444; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 18px; shadow: 0 2px 5px rgba(0,0,0,0.3)">🏪</div>`,
        className: "shop-checkin-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })
    })
      .addTo(markersGroup.current)
      .bindPopup(`<b>${selectedShift.shopName}</b><br>${selectedShift.address}`);

    // 3. Student Marker
    L.marker([studentCoords.latitude, studentCoords.longitude], {
      icon: L.divIcon({
        html: `<div style="background: #10B981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; shadow: 0 2px 5px rgba(0,0,0,0.3)">👤</div>`,
        className: "student-checkin-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    })
      .addTo(markersGroup.current)
      .bindPopup("Vị trí của bạn");

  }, [selectedShift, studentCoords]);

  const currentDist = getDistance(
    studentCoords.latitude,
    studentCoords.longitude,
    selectedShift?.latitude || 10.8,
    selectedShift?.longitude || 106.8
  );

  const isWithinGeofence = currentDist <= 100;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto min-h-screen">
      {/* 1. Page Title */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Glow circles decoration */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 bg-orange-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-14 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="text-[10px] uppercase font-extrabold tracking-widest bg-orange-500/20 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full backdrop-blur-xs">
            📍 GEOFENCE CHECK-IN
          </span>
          <h1 className="text-3xl font-black text-white mt-3.5 tracking-tight">Trình Điểm Danh Vị Trí & QR</h1>
          <p className="text-slate-350 text-xs mt-1 max-w-xl">
            Xác thực điểm danh vào ca làm (Check-in/Check-out) an toàn bằng Camera quét QR Code và hệ thống xác thực GPS bán kính an toàn.
          </p>
        </div>
      </div>

      {/* 2. Grid content */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Map & Geofence (Left side) */}
        <div className="md:col-span-7 flex flex-col gap-6">
          {/* Map box */}
          <div className="bg-white border border-slate-100 shadow-lg rounded-3xl overflow-hidden flex flex-col z-0">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-700 tracking-wider uppercase flex items-center gap-2">
                🗺️ Geofence bán kính an toàn (100m)
              </span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${isWithinGeofence ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {isWithinGeofence ? "Đang trong vùng" : "Ngoài vùng"}
              </span>
            </div>
            <div ref={mapRef} style={{ height: "360px" }} className="w-full relative z-0" />
          </div>
        </div>

        {/* Action Panel (Right side) */}
        <div className="md:col-span-5 flex flex-col gap-6">
          {/* Shift Selector */}
          <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-6 flex flex-col gap-4">
            <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Ca làm điểm danh</h2>
            
            {checkedInShift ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-emerald-600">Đang làm việc:</span>
                <p className="font-bold text-slate-800 text-base">{checkedInShift.title}</p>
                <p className="text-xs text-slate-500">{checkedInShift.shopName}</p>
                <p className="text-xs text-slate-500 mt-2">
                  ⏰ Ca làm: {checkedInShift.startTime} - {checkedInShift.endTime}
                </p>
              </div>
            ) : activeShifts.length === 0 ? (
              <p className="text-slate-400 text-sm">Không có ca làm nào khả dụng hôm nay.</p>
            ) : (
              <div className="relative w-full">
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-12 px-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-slate-800 font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">
                    {selectedShift ? `${selectedShift.title} (${selectedShift.shopName})` : "Chọn ca làm"}
                  </span>
                  <span className="text-slate-400 transition-transform duration-200 text-[10px]" style={{ transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ▼
                  </span>
                </button>

                {/* Dropdown Options List */}
                {isDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                      {activeShifts.map((s) => {
                        const isSelected = selectedShift?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedShift(s);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-orange-50 text-orange-600 font-black"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate">{s.title} ({s.shopName})</span>
                            {isSelected && <span className="text-orange-600 font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {selectedShift && !checkedInShift && (
              <div className="flex flex-col gap-4">
                {/* Premium Shift Details Card */}
                <div className="bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200/60 rounded-3xl p-5 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>
                  
                  {/* Job/Shift Title */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      💼
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{selectedShift.title}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{selectedShift.shopName}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-200/50 my-3.5"></div>
                  
                  {/* Time & Salary details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white rounded-2xl p-3 border border-slate-200/30 flex flex-col gap-0.5 shadow-2xs">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">⏱️ Thời gian ca</span>
                      <span className="font-extrabold text-slate-800">{selectedShift.startTime} - {selectedShift.endTime}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-slate-200/30 flex flex-col gap-0.5 shadow-2xs">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">💰 Mức lương</span>
                      <span className="font-extrabold text-emerald-600">{selectedShift.salary.toLocaleString()}đ/giờ</span>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="mt-3.5 flex items-start gap-2 text-xs text-slate-500 bg-white/50 p-3 rounded-2xl border border-slate-200/20 shadow-2xs">
                    <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{selectedShift.address}</span>
                  </div>
                </div>

                {/* GPS and Geofence distance status */}
                <div className="bg-slate-50/80 border border-slate-200/50 p-4 rounded-3xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-semibold">Tọa độ quán:</span>
                    <span className="font-bold text-slate-700 bg-white px-2 py-0.5 border border-slate-200/30 rounded-lg">
                      {selectedShift.latitude.toFixed(6)}, {selectedShift.longitude.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-semibold">Tọa độ định vị (Browser):</span>
                    <span className="font-bold text-slate-700 bg-white px-2 py-0.5 border border-slate-200/30 rounded-lg">
                      {studentCoords.latitude.toFixed(6)}, {studentCoords.longitude.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2 font-bold items-center mt-1">
                    <span className="text-slate-500">Khoảng cách hiện tại:</span>
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] uppercase font-black tracking-wider ${
                      isWithinGeofence 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                      {currentDist} mét ({isWithinGeofence ? "Hợp lệ" : "Quá xa"})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons (Disabled on Web) */}
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                type="button"
                disabled
                className="w-full h-12 rounded-2xl font-black text-sm bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none flex items-center justify-center gap-2"
              >
                <Camera size={18} /> Điểm danh Vào Ca (Chỉ dùng trên Mobile)
              </button>
              <p className="text-[11px] text-center text-amber-700 font-bold bg-amber-50 border border-amber-200 p-3 rounded-2xl leading-relaxed">
                ⚠️ Tính năng quét mã QR & xác thực GPS bảo mật chỉ được hỗ trợ duy nhất trên ứng dụng **ProxiJob Mobile** để tránh giả lập vị trí.
              </p>
            </div>
          </div>

          {/* Geofence guidelines */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-xs text-slate-500 space-y-2">
            <p className="font-bold text-slate-700 flex items-center gap-1.5"><ShieldAlert size={14} className="text-orange-500" /> Quy định điểm danh của hệ thống</p>
            <p>1. Bán kính Geofence tối đa là 100m tính từ tâm toạ độ cửa hàng được chủ quán thiết lập.</p>
            <p>2. Phải quét đúng mã QR chấm công đang hiển thị trên màn hình quản lý của chủ quán.</p>
            <p>3. Dữ liệu GPS & thời gian check-in/out được ghi nhận trực tiếp vào Block bảng lương đối soát tự động.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
