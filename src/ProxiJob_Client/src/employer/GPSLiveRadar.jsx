import { useState, useEffect, useRef } from "react";
import {
  MapPin, Compass, RefreshCw, X, ShieldAlert, Sparkles, Check, Info,
  QrCode, Radio, UserCheck, ShieldCheck, AlertTriangle
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../admin/ToastContext";
import { getQrCode, generateQrCode, updateQrRadius, getTimekeepingLogs } from "../api/management";
import { getBusinessProfileApi } from "../api/businessApi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const getInitials = (name) => {
  if (!name) return "NV";
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export default function GPSLiveRadar() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // QR Config
  const [qrCodeData, setQrCodeData] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(100);

  // Timekeeping Logs
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);

  const mapRef = useRef(null);
  const liveMap = useRef(null);
  const markersGroup = useRef(null);

  const fetchLogs = () => {
    setLoadingLogs(true);
    getTimekeepingLogs(selectedDate)
      .then((data) => {
        const raw = Array.isArray(data) ? data : (data?.items || []);
        // Only keep logs that have an actual check-in time or student/employee name
        const validLogs = raw.filter(
          (log) => log && (log.checkInTime || (log.name && log.name !== "Nhân viên") || log.studentName)
        );
        setLogs(validLogs);
        setLoadingLogs(false);
      })
      .catch((err) => {
        console.log("Failed to load timekeeping logs:", err);
        setLogs([]);
        setLoadingLogs(false);
      });
  };

  const loadQr = async () => {
    try {
      const data = await getQrCode();
      if (data) {
        setQrCodeData(data);
        setSelectedRadius(data.allowedRadiusMeters || 100);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const loadProfile = async () => {
    try {
      const p = await getBusinessProfileApi();
      if (p) setProfile(p);
    } catch (err) {
      console.log(err);
      setProfile({ businessName: "Cửa hàng Coffee & Tea", latitude: 10.857461, longitude: 106.801522 });
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadProfile(), loadQr(), fetchLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  // Leaflet Live Map render
  useEffect(() => {
    if (loading || !mapRef.current || !profile) return;

    const centerLat = profile.latitude || 10.857461;
    const centerLng = profile.longitude || 106.801522;

    if (!liveMap.current) {
      liveMap.current = L.map(mapRef.current, {
        zoomControl: true,
        dragging: true,
        touchZoom: true
      }).setView([centerLat, centerLng], 16);

      L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: "Google Maps"
      }).addTo(liveMap.current);

      markersGroup.current = L.layerGroup().addTo(liveMap.current);
    } else {
      liveMap.current.setView([centerLat, centerLng], 16);
    }

    setTimeout(() => {
      if (liveMap.current) {
        liveMap.current.invalidateSize();
      }
    }, 250);

    markersGroup.current.clearLayers();

    // Geofence circle
    const radius = qrCodeData?.allowedRadiusMeters || selectedRadius || 100;
    L.circle([centerLat, centerLng], {
      color: "#f97316",
      fillColor: "#f97316",
      fillOpacity: 0.12,
      weight: 2,
      radius: radius
    }).addTo(markersGroup.current);

    // Location Marker
    L.marker([centerLat, centerLng], {
      icon: L.divIcon({
        html: `<div class="relative flex items-center justify-center">
                <span class="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-orange-400 opacity-30"></span>
                <div style="background: linear-gradient(135deg, #ea580c, #f59e0b); width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4)">🏪</div>
               </div>`,
        className: "live-shop-marker",
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      })
    })
      .addTo(markersGroup.current)
      .bindPopup(`<b>${profile.businessName || "Cửa hàng"}</b><br>Tâm tọa độ chấm công`);

    // Staff check-in pins
    logs.forEach((log) => {
      if (log.latitude && log.longitude) {
        const isSuspicious = log.gpsStatus === "Suspicious";
        L.marker([log.latitude, log.longitude], {
          icon: L.divIcon({
            html: `<div style="background: ${isSuspicious ? '#EF4444' : '#10B981'}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; items-center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.25)">
                    ${isSuspicious ? '⚠️' : '👤'}
                   </div>`,
            className: "live-staff-marker",
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          })
        })
          .addTo(markersGroup.current)
          .bindPopup(`
            <div class="p-1 font-sans text-xs">
              <p class="font-bold text-sm text-slate-800">${log.name}</p>
              <p class="text-slate-500 font-semibold">${log.role}</p>
              <p class="text-slate-500 mt-1">Đã vào: <b>${log.checkInTime}</b></p>
              <p class="text-slate-500">Khoảng cách: <b>${log.distance || 0}m</b></p>
              <p class="font-bold mt-1" style="color: ${isSuspicious ? '#EF4444' : '#10B981'}">
                Trạng thái: ${isSuspicious ? '⚠️ Ngoại vi (Đáng ngờ)' : '✅ Hợp lệ'}
              </p>
            </div>
          `);
      }
    });

  }, [loading, profile, logs, qrCodeData, selectedRadius]);

  const handleGenerateNewQr = async () => {
    setGeneratingQr(true);
    try {
      const data = await generateQrCode();
      setQrCodeData(data);
      toast.success("Đã tái tạo mã QR điểm danh động thành công! ✨");
    } catch (err) {
      toast.error("Không thể tái tạo mã QR: " + err.message);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleUpdateRadius = async (radius) => {
    try {
      await updateQrRadius(radius);
      setSelectedRadius(radius);
      loadQr();
      toast.success(`Đã cập nhật bán kính Geofence chấm công: ${radius}m`);
    } catch (err) {
      toast.error("Cập nhật bán kính thất bại: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-md max-w-2xl mx-auto mt-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-600 border-t-transparent mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải bản đồ giám sát GPS Live...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6">

      {/* ==================== 1. PREMIUM HEADER BANNER ==================== */}
      <div
        className="dashboard-fade-in dashboard-fade-in-1 relative overflow-hidden rounded-3xl shadow-lg border border-orange-100/80 dots-pattern"
        style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fef3c7 100%)" }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 blur-2xl" style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />

        <div className="relative z-10 p-6 md:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
              <MapPin size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Bản đồ Giám sát GPS Live & QR Code
              </h1>
              <p className="text-slate-600 text-xs font-medium mt-0.5">
                Giám sát vị trí nhân viên chấm công thời gian thực trong Geofence {selectedRadius}m.
              </p>
            </div>
          </div>

          <button
            onClick={loadAll}
            className="bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 hover:text-orange-600 p-3 rounded-2xl border border-orange-200/60 shadow-xs transition-all duration-300 flex items-center gap-2 text-xs font-extrabold shrink-0"
          >
            <RefreshCw size={16} /> Refresh Dữ Liệu
          </button>
        </div>
      </div>

      {/* ==================== 2. MAIN CONTENT GRID ==================== */}
      <div className="dashboard-fade-in dashboard-fade-in-2 grid gap-6 lg:grid-cols-12">

        {/* ===== LEFT: MAP & LOGS (8 Columns) ===== */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Live Radar Map Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-100 shadow-lg rounded-3xl overflow-hidden flex flex-col z-0 card-hover-lift">
            <div className="p-4 md:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-black text-xs uppercase tracking-wider text-slate-800">
                  📡 Live GPS Radar Geofence ({selectedRadius}m)
                </span>
              </div>
              <span className="text-[10px] bg-white text-orange-600 border border-orange-200 px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-xs">
                Thời gian thực
              </span>
            </div>

            {/* Map Canvas */}
            <div ref={mapRef} style={{ height: "420px" }} className="w-full relative z-0" />
          </div>

          {/* Timekeeping Logs Table */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-100 shadow-lg rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <UserCheck size={18} className="text-orange-500" />
                  Nhật ký chấm công hôm nay
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{logs.length} lượt check-in</p>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-xs">
                  <ShieldCheck size={28} className="text-orange-500" />
                </div>
                <p className="font-extrabold text-sm text-slate-700">Hôm nay chưa có lượt chấm công nào</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Các lượt sinh viên quét mã QR điểm danh sẽ tự động xuất hiện tại đây theo thời gian thực.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-3 px-2">Nhân viên</th>
                      <th className="py-3 px-2">Vai trò</th>
                      <th className="py-3 px-2">Vào ca</th>
                      <th className="py-3 px-2">Ra ca</th>
                      <th className="py-3 px-2">Khoảng cách</th>
                      <th className="py-3 px-2 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const isSuspicious = log.gpsStatus === "Suspicious";
                      const empName = log.name || "Nhân viên";
                      return (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-2 font-black text-slate-800 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center font-bold text-[10px] text-white shadow-xs">
                              {getInitials(empName)}
                            </div>
                            {empName}
                          </td>
                          <td className="py-3.5 px-2 text-slate-500 font-semibold">{log.role || "Phục vụ"}</td>
                          <td className="py-3.5 px-2 text-slate-800 font-bold">{log.checkInTime}</td>
                          <td className="py-3.5 px-2 text-slate-800 font-bold">{log.checkOutTime || "—"}</td>
                          <td className="py-3.5 px-2 font-extrabold" style={{ color: isSuspicious ? '#EF4444' : '#10B981' }}>
                            {log.distance || 0}m
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <span className={`text-[10px] uppercase font-extrabold px-3 py-1 rounded-full border ${
                              isSuspicious
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {isSuspicious ? "⚠️ Đáng ngờ" : "✅ Hợp lệ"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT: QR CONFIG & GEOFENCE RADIUS (4 Columns) ===== */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start">

          {/* QR Code Setup Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-100 shadow-lg rounded-3xl p-6 flex flex-col gap-5 items-center">
            <div className="border-b border-slate-100 pb-3 w-full">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mã điểm danh</span>
              <h3 className="font-black text-slate-800 text-base mt-0.5 flex items-center gap-2">
                <QrCode size={18} className="text-orange-500" />
                Thiết lập Mã QR Điểm Danh
              </h3>
            </div>

            {qrCodeData ? (
              <div className="bg-slate-50/80 p-5 border border-slate-200 rounded-3xl flex flex-col items-center shadow-inner w-full">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData.qrToken)}`}
                  alt="Shop CheckIn QR"
                  className="w-48 h-48 rounded-2xl shadow-md border-4 border-white"
                />
                <p className="text-xs text-slate-400 font-mono font-bold uppercase mt-3 line-clamp-1 max-w-[220px] text-center bg-white px-3 py-1 rounded-xl border border-slate-200">
                  Token: {qrCodeData.qrToken}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border p-8 rounded-3xl text-center text-xs text-slate-400 w-full">
                Chưa khởi tạo cấu hình QR. Bấm nút phía dưới để tạo mã.
              </div>
            )}

            <button
              type="button"
              disabled={generatingQr}
              onClick={handleGenerateNewQr}
              className="w-full h-12 btn-premium text-white rounded-2xl font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              {generatingQr ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>♻️ Tái tạo mã QR Chấm Công</>
              )}
            </button>
          </div>

          {/* Geofence Radius Slider Controls */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-100 shadow-lg rounded-3xl p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cấu hình vùng vị trí</span>
              <h3 className="font-black text-slate-800 text-base mt-0.5 flex items-center gap-2">
                <Compass size={18} className="text-orange-500" /> Bán kính Geofence
              </h3>
            </div>

            {/* Radius Selector Pills */}
            <div className="flex gap-2">
              {[50, 100, 200].map((radius) => {
                const active = selectedRadius === radius;
                return (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => handleUpdateRadius(radius)}
                    className={`flex-1 py-3 rounded-2xl font-extrabold text-xs transition-all duration-300 ${
                      active
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 scale-105"
                        : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {radius}m
                    {radius === 100 && <span className="block text-[8px] opacity-90 font-medium">Khuyên dùng</span>}
                  </button>
                );
              })}
            </div>

            <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4 text-xs text-orange-900 leading-relaxed flex gap-2 font-medium">
              <Info size={16} className="shrink-0 text-orange-600 mt-0.5" />
              <p>Mặc định <strong>100m</strong> được khuyến nghị. Bán kính nhỏ hơn (50m) yêu cầu toạ độ thiết bị của sinh viên phải cực kỳ chuẩn xác.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
