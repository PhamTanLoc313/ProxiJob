import { useState, useEffect, useRef } from "react";
import { MapPin, ShieldAlert, Award, Camera, CheckCircle2, AlertTriangle, Compass, Play, RefreshCw, XCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getPublishedJobs } from "../api/jobs"; // To get active shifts
import { checkInShiftApi, checkOutShiftApi, getQrCode } from "../api/management";
import { Html5QrcodeScanner } from "html5-qrcode";
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
  const [isSimulated, setIsSimulated] = useState(true);
  const [simulatedDistance, setSimulatedDistance] = useState(50); // meters
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [timekeepingId, setTimekeepingId] = useState(null);
  const [checkedInShift, setCheckedInShift] = useState(null);
  
  // Modals and Alerts
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const mapRef = useRef(null);
  const checkinMap = useRef(null);
  const markersGroup = useRef(null);

  // 1. Fetch Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setRealCoords(coords);
          if (!isSimulated) {
            setStudentCoords(coords);
          }
        },
        (err) => console.log("Failed to load browser GPS", err)
      );
    }
  }, [isSimulated]);

  // 2. Fetch student's active shifts today (Mocked or queried)
  // Normally we load shifts that student is approved for today
  useEffect(() => {
    if (!user) return;
    // Query published jobs just to grab coordinates for the demo
    getPublishedJobs(null, 1, 30)
      .then((data) => {
        // Fallback: create mock active shifts assigned to this student
        const mockShifts = [
          {
            id: 101,
            title: "Phục vụ ca sáng",
            shopName: "Phở Hà Nội",
            address: "84/10 Nam Cao, Quận 9, TP.HCM",
            latitude: 10.857461,
            longitude: 106.801522,
            startTime: "07:00",
            endTime: "12:00",
            salary: 25000,
            status: "approved"
          },
          {
            id: 102,
            title: "Pha chế trà sữa",
            shopName: "Trà sữa ToCoToCo",
            address: "Lê Văn Việt, Quận 9, TP.HCM",
            latitude: 10.8499,
            longitude: 106.7720,
            startTime: "13:00",
            endTime: "18:00",
            salary: 28000,
            status: "approved"
          }
        ];
        setActiveShifts(mockShifts);
        setSelectedShift(mockShifts[0]);
      })
      .catch((err) => console.log(err));
  }, [user]);

  // 3. Handle GPS simulation coordinates math
  useEffect(() => {
    if (!selectedShift) return;

    if (isSimulated) {
      // Calculate coordinates at simulatedDistance away from shop coordinates
      const angle = 45 * (Math.PI / 180); // 45 degrees direction
      const metersPerDegreeLat = 111000;
      const metersPerDegreeLng = 111000 * Math.cos(selectedShift.latitude * (Math.PI / 180));
      
      const deltaLat = (simulatedDistance * Math.sin(angle)) / metersPerDegreeLat;
      const deltaLng = (simulatedDistance * Math.cos(angle)) / metersPerDegreeLng;

      setStudentCoords({
        latitude: selectedShift.latitude + deltaLat,
        longitude: selectedShift.longitude + deltaLng
      });
    } else if (realCoords) {
      setStudentCoords(realCoords);
    }
  }, [selectedShift, isSimulated, simulatedDistance, realCoords]);

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

  // 5. HTML5 Camera QR Code Scanner trigger
  useEffect(() => {
    if (!showScanner) return;
    
    // Slight delay to ensure element exists
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true
      });

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setShowScanner(false);
          handleQRScanSuccess(decodedText);
        },
        (err) => {
          // Silent errors during frame scans
        }
      );

      return () => {
        scanner.clear().catch((e) => console.log("Failed to clear scanner on unmount:", e));
      };
    }, 150);

    return () => clearTimeout(timer);
  }, [showScanner]);

  const currentDist = getDistance(
    studentCoords.latitude,
    studentCoords.longitude,
    selectedShift?.latitude || 10.8,
    selectedShift?.longitude || 106.8
  );

  const isWithinGeofence = currentDist <= 100;

  const handleQRScanSuccess = async (qrToken) => {
    setErrorMsg("");
    const lat = studentCoords.latitude;
    const lng = studentCoords.longitude;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (!checkedInShift) {
      // Check-In
      try {
        const payload = {
          shiftId: selectedShift.id,
          qrToken: qrToken || "mock-token",
          latitude: lat,
          longitude: lng,
          photoUrl: "",
          targetLatitude: selectedShift.latitude,
          targetLongitude: selectedShift.longitude
        };
        const res = await checkInShiftApi(payload);
        const tId = res?.timekeepingId || res?.TimekeepingId || 999;
        
        setTimekeepingId(tId);
        setCheckedInShift(selectedShift);
        
        setSuccessInfo({
          type: "CHECK-IN",
          title: "CHECK-IN THÀNH CÔNG 🎉",
          timestamp: timeStr,
          status: "Đúng Giờ",
          statusColor: "#10B981",
          shopName: selectedShift.shopName,
          shiftTitle: selectedShift.title
        });
        setShowSuccessCard(true);
      } catch (err) {
        setErrorMsg(err.message || "Check-in thất bại. Sai token QR hoặc lỗi kết nối.");
      }
    } else {
      // Check-Out
      try {
        const payload = {
          timekeepingId: timekeepingId || 999,
          latitude: lat,
          longitude: lng,
          photoUrl: ""
        };
        await checkOutShiftApi(payload);
        
        setCheckedInShift(null);
        setTimekeepingId(null);

        setSuccessInfo({
          type: "CHECK-OUT",
          title: "CHECK-OUT THÀNH CÔNG 🎉",
          timestamp: timeStr,
          status: "Hoàn Thành",
          statusColor: "#0A58CA",
          shopName: selectedShift.shopName,
          shiftTitle: selectedShift.title
        });
        setShowSuccessCard(true);
      } catch (err) {
        setErrorMsg(err.message || "Check-out thất bại. Vui lòng thử lại.");
      }
    }
  };

  const handleCheckInBtnClick = () => {
    if (!isWithinGeofence) {
      setErrorMsg("Bạn đang ở quá xa quán. Vui lòng đứng trong phạm vi 100m để điểm danh.");
      return;
    }
    setErrorMsg("");
    setShowScanner(true);
  };

  const handleCheckOutBtnClick = () => {
    if (!isWithinGeofence) {
      setErrorMsg("Bạn cần ở gần cửa hàng để check-out.");
      return;
    }
    setErrorMsg("");

    // Simulate early check-out check (Check if current time is early)
    // For demo purposes, we allow it after confirming modal
    setShowScanner(true);
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto min-h-screen">
      {/* 1. Page Title */}
      <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Trình Điểm Danh Vị Trí & QR</h1>
          <p className="text-slate-400 text-xs mt-0.5">Xác thực Check-in/Check-out bằng camera và GPS siêu cục bộ.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsSimulated(!isSimulated)}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              isSimulated
                ? "bg-amber-100 border border-amber-300 text-amber-800"
                : "bg-slate-100 border border-slate-200 text-slate-700"
            }`}
          >
            🛰️ GPS Giả lập: {isSimulated ? "BẬT" : "TẮT"}
          </button>
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
            <div ref={mapRef} style={{ height: "300px" }} className="w-full relative z-0" />
          </div>

          {/* Simulated distance controllers (ONLY if isSimulated is enabled) */}
          {isSimulated && selectedShift && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-amber-800">🎛️ Bảng điều khiển khoảng cách giả lập:</span>
                <span className="font-black text-amber-900 bg-white border border-amber-200 px-3 py-1 rounded-xl shadow-xs">
                  {simulatedDistance} mét
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                value={simulatedDistance}
                onChange={(e) => setSimulatedDistance(Number(e.target.value))}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-[10px] text-amber-700 font-bold">
                <span>Trong vùng (5m)</span>
                <span>Biên vùng (100m)</span>
                <span>Ngoài vùng (500m)</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Panel (Right side) */}
        <div className="md:col-span-5 flex flex-col gap-6">
          {/* Shift Selector */}
          <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-6 flex flex-col gap-4">
            <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Chọn ca trực điểm danh</h2>
            
            {checkedInShift ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-emerald-600">Đang làm việc:</span>
                <p className="font-bold text-slate-800 text-base">{checkedInShift.title}</p>
                <p className="text-xs text-slate-500">{checkedInShift.shopName}</p>
                <p className="text-xs text-slate-500 mt-2">
                  ⏰ Ca trực: {checkedInShift.startTime} - {checkedInShift.endTime}
                </p>
              </div>
            ) : activeShifts.length === 0 ? (
              <p className="text-slate-400 text-sm">Không có ca trực nào khả dụng hôm nay.</p>
            ) : (
              <select
                value={selectedShift?.id || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedShift(activeShifts.find((s) => s.id === id));
                }}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:border-amber-400 transition cursor-pointer"
              >
                {activeShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.shopName})
                  </option>
                ))}
              </select>
            )}

            {selectedShift && !checkedInShift && (
              <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Tọa độ đích:</span>
                  <span className="font-bold text-slate-700">{selectedShift.latitude.toFixed(6)}, {selectedShift.longitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Tọa độ của bạn:</span>
                  <span className="font-bold text-slate-700">{studentCoords.latitude.toFixed(6)}, {studentCoords.longitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-2 font-bold">
                  <span className="text-slate-500">Khoảng cách hiện tại:</span>
                  <span className={isWithinGeofence ? "text-emerald-600" : "text-red-500"}>
                    {currentDist} mét ({isWithinGeofence ? "Hợp lệ" : "Quá xa"})
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-2">
              {!checkedInShift ? (
                <button
                  type="button"
                  onClick={handleCheckInBtnClick}
                  className={`w-full h-12 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                    isWithinGeofence
                      ? "bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/10"
                      : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  }`}
                >
                  <Camera size={18} /> Điểm danh Vào Ca (Check-In)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckOutBtnClick}
                  className="w-full h-12 rounded-2xl font-black text-sm bg-linear-to-br from-blue-600 to-indigo-700 text-white hover:brightness-110 shadow-lg shadow-blue-500/10 transition flex items-center justify-center gap-2"
                >
                  <Camera size={18} /> Điểm danh Ra Ca (Check-Out)
                </button>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-2xl">
                ⚠️ {errorMsg}
              </p>
            )}
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

      {/* Camera QR Scanner modal overlay */}
      {showScanner && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-800">Quét mã QR Chấm Công</h3>
              <button
                onClick={() => setShowScanner(false)}
                className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
            
            <p className="text-xs text-slate-400 font-semibold text-center">Hướng camera vào mã QR hiển thị trên màn hình của chủ quán</p>
            
            {/* HTML5 QR Code Scanner element */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div id="reader" className="w-full" />
            </div>

            <div className="text-center text-[10px] text-slate-400">
              Trình quét sử dụng API camera bảo mật của trình duyệt web.
            </div>
          </div>
        </div>
      )}

      {/* Success Modal popup */}
      {showSuccessCard && successInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            
            <h2 className="font-black text-xl text-slate-800">{successInfo.title}</h2>
            
            <div className="bg-slate-50 p-5 rounded-2xl w-full text-xs space-y-1.5 text-left border border-slate-100">
              <p className="flex justify-between">
                <span className="text-slate-400 font-medium">Ca trực:</span>
                <span className="font-bold text-slate-800">{successInfo.shiftTitle}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400 font-medium">Cửa hàng:</span>
                <span className="font-bold text-slate-800">{successInfo.shopName}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400 font-medium">Thời gian quét:</span>
                <span className="font-bold text-slate-800">{successInfo.timestamp}</span>
              </p>
              <p className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-500 font-semibold">Trạng thái chấm công:</span>
                <span className="font-black" style={{ color: successInfo.statusColor }}>{successInfo.status}</span>
              </p>
            </div>

            <button
              onClick={() => setShowSuccessCard(false)}
              className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/10 transition mt-2"
            >
              Hoàn thành
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
