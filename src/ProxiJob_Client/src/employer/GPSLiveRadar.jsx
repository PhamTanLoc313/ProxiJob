import { useState, useEffect, useRef } from "react";
import { MapPin, Compass, Play, RefreshCw, X, ShieldAlert, Sparkles, Check, Info } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getQrCode, generateQrCode, updateQrRadius, getTimekeepingLogs } from "../api/management";
import { getBusinessProfileApi } from "../api/businessApi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function GPSLiveRadar() {
  const { user } = useAuth();
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
        setLogs(Array.isArray(data) ? data : []);
        setLoadingLogs(false);
      })
      .catch((err) => {
        console.log("Failed to load timekeeping logs:", err);
        // Fallback mock logs
        setLogs([
          { id: 1, name: "Nguyễn Văn A", role: "Pha chế", checkInTime: "08:02", checkOutTime: null, latitude: 10.857490, longitude: 106.801550, gpsStatus: "Ok", distance: 10 },
          { id: 2, name: "Trần Thị B", phone: "090", role: "Phục vụ", checkInTime: "08:15", checkOutTime: "12:05", latitude: 10.857461, longitude: 106.801522, gpsStatus: "Ok", distance: 0 },
          { id: 3, name: "Lê Văn C", role: "Phục vụ ca tối", checkInTime: "13:05", checkOutTime: null, latitude: 10.859000, longitude: 106.805000, gpsStatus: "Suspicious", distance: 350 }
        ]);
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

      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 19
      }).addTo(liveMap.current);

      markersGroup.current = L.layerGroup().addTo(liveMap.current);
    } else {
      liveMap.current.setView([centerLat, centerLng], 16);
    }

    markersGroup.current.clearLayers();

    // Store Geofence bounds
    const radius = qrCodeData?.allowedRadiusMeters || selectedRadius || 100;
    L.circle([centerLat, centerLng], {
      color: "#00D1FF",
      fillColor: "#00D1FF",
      fillOpacity: 0.1,
      radius: radius
    }).addTo(markersGroup.current);

    // Store Location Marker
    L.marker([centerLat, centerLng], {
      icon: L.divIcon({
        html: `<div class="relative flex items-center justify-center">
                <span class="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-red-400 opacity-20"></span>
                <div style="background: #EF4444; width: 42px; height: 42px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 20px; shadow: 0 4px 8px rgba(0,0,0,0.3)">🏪</div>
               </div>`,
        className: "live-shop-marker",
        iconSize: [42, 42],
        iconAnchor: [21, 21]
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
            html: `<div style="background: ${isSuspicious ? '#EF4444' : '#10B981'}; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; shadow: 0 2px 5px rgba(0,0,0,0.3)">
                    ${isSuspicious ? '⚠️' : '👤'}
                   </div>`,
            className: "live-staff-marker",
            iconSize: [34, 34],
            iconAnchor: [17, 17]
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

  }, [loading, profile, logs, qrCodeData]);

  const handleGenerateNewQr = async () => {
    setGeneratingQr(true);
    try {
      const data = await generateQrCode();
      setQrCodeData(data);
      alert("Đã tái tạo mã QR điểm danh động thành công!");
    } catch (err) {
      alert("Không thể tái tạo mã QR: " + err.message);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleUpdateRadius = async (radius) => {
    try {
      await updateQrRadius(radius);
      setSelectedRadius(radius);
      loadQr();
      alert(`Đã cập nhật bán kính Geofence chấm công: ${radius}m`);
    } catch (err) {
      alert("Cập nhật bán kính thất bại: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-md max-w-2xl mx-auto mt-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải bản đồ giám sát GPS Live...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6 min-h-screen">
      {/* 1. Header Area */}
      <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bản đồ Giám sát GPS Live & QR Code</h1>
          <p className="text-slate-400 text-xs mt-0.5">Giám sát vị trí nhân viên chấm công thời gian thực trong Geofence 100m.</p>
        </div>
        <button
          onClick={loadAll}
          className="p-3 bg-slate-50 border hover:bg-slate-100 rounded-2xl transition"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* 2. Main content grids */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Leaflet map display (Left side) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-slate-100 shadow-lg rounded-3xl overflow-hidden flex flex-col z-0">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                🗺️ Bản đồ Live Radar GPS (Tile Google Maps miễn phí)
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Thời gian thực</span>
            </div>
            <div ref={mapRef} style={{ height: "400px" }} className="w-full relative z-0" />
          </div>

          {/* Table list of logs */}
          <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-6">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-4">Nhật ký chấm công hôm nay</h3>
            {logs.length === 0 ? (
              <p className="text-slate-400 text-xs">Hôm nay chưa có lượt chấm công nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-bold">
                      <th className="py-3 px-1">Nhân viên</th>
                      <th className="py-3 px-1">Vai trò</th>
                      <th className="py-3 px-1">Vào ca</th>
                      <th className="py-3 px-1">Ra ca</th>
                      <th className="py-3 px-1">Khoảng cách</th>
                      <th className="py-3 px-1 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const isSuspicious = log.gpsStatus === "Suspicious";
                      return (
                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-1 font-bold text-slate-800">{log.name}</td>
                          <td className="py-3.5 px-1 text-slate-500 font-semibold">{log.role}</td>
                          <td className="py-3.5 px-1 text-slate-800 font-semibold">{log.checkInTime}</td>
                          <td className="py-3.5 px-1 text-slate-800 font-semibold">{log.checkOutTime || "—"}</td>
                          <td className="py-3.5 px-1 font-bold" style={{ color: isSuspicious ? '#EF4444' : '#10B981' }}>
                            {log.distance || 0}m
                          </td>
                          <td className="py-3.5 px-1 text-right">
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                              isSuspicious ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"
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

        {/* QR Code configuration controls (Right side) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* QR Code management card */}
          <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-6 flex flex-col gap-5 items-center">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider w-full border-b border-slate-50 pb-3">
              ⚙️ Thiết lập Mã QR Điểm Danh
            </h3>

            {qrCodeData ? (
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex flex-col items-center shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData.qrToken)}`}
                  alt="Shop CheckIn QR"
                  className="w-48 h-48 rounded-xl shadow-xs"
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 line-clamp-1 max-w-[180px]">
                  Token: {qrCodeData.qrToken}
                </p>
              </div>
            ) : (
              <div className="bg-slate-100 border p-8 rounded-2xl text-center text-xs text-slate-400">
                Chưa khởi tạo cấu hình QR. Vui lòng bấm nút phía dưới để sinh mã.
              </div>
            )}

            <button
              type="button"
              disabled={generatingQr}
              onClick={handleGenerateNewQr}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-600/10 transition flex items-center justify-center gap-1.5"
            >
              {generatingQr ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>♻️ Tái tạo mã QR Chấm Công</>
              )}
            </button>
          </div>

          {/* Geofence radius slider controls */}
          <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Compass size={14} className="text-blue-500" /> Cấu hình bán kính Geofence
            </h3>
            
            <div className="flex gap-2">
              {[50, 100, 200].map((radius) => {
                const active = selectedRadius === radius;
                return (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => handleUpdateRadius(radius)}
                    className={`flex-1 h-9 rounded-xl font-bold text-xs transition ${
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {radius}m
                  </button>
                );
              })}
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-[10px] text-blue-800 leading-relaxed flex gap-1.5">
              <Info size={14} className="shrink-0 text-blue-600 mt-0.5" />
              <p>Mặc định 100m được khuyến nghị. Bán kính nhỏ hơn (50m) yêu cầu toạ độ thiết bị của sinh viên phải cực kỳ chuẩn xác.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
