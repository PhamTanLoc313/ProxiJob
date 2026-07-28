import { useState, useEffect, useRef } from "react";
import {
  Store, MapPin, Compass, Save, RefreshCw, Check, Building, FileText,
  Navigation, Sparkles, ShieldCheck, Info
} from "lucide-react";
import { getBusinessProfileApi, updateBusinessProfileApi } from "../api/businessApi";
import { updateQrLocation } from "../api/management";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../admin/ToastContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function EmployerProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("TP. Hồ Chí Minh");
  const [latitude, setLatitude] = useState(10.857461);
  const [longitude, setLongitude] = useState(106.801522);
  const [description, setDescription] = useState("");

  const mapRef = useRef(null);
  const profileMap = useRef(null);
  const markerRef = useRef(null);

  const fetchProfile = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getBusinessProfileApi();
      setProfile(data);
      if (data) {
        setBusinessName(data.businessName || "");
        setAddress(data.address || "");
        setCity(data.city || "TP. Hồ Chí Minh");
        setDescription(data.description || "");

        if (showLoading) {
          if (data.address) {
            try {
              const queryStr = `${data.address} ${data.city || "TP. Hồ Chí Minh"}`;
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`,
                { headers: { "User-Agent": "ProxiJob-Web" } }
              );
              if (response.ok) {
                const geoData = await response.json();
                if (geoData && geoData.length > 0) {
                  const lat = parseFloat(geoData[0].lat);
                  const lon = parseFloat(geoData[0].lon);
                  setLatitude(lat);
                  setLongitude(lon);
                } else {
                  setLatitude(10.857461);
                  setLongitude(106.801522);
                }
              } else {
                setLatitude(10.857461);
                setLongitude(106.801522);
              }
            } catch (err) {
              console.log("Error geocoding address:", err);
              setLatitude(10.857461);
              setLongitude(106.801522);
            }
          } else {
            setLatitude(10.857461);
            setLongitude(106.801522);
          }
        }
      }
    } catch (err) {
      console.log("Failed to load business profile:", err);
      setProfile(null);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(true);
    return () => {
      if (profileMap.current) {
        profileMap.current.remove();
        profileMap.current = null;
        markerRef.current = null;
      }
    };
  }, [user]);

  // Reverse geocode coordinates to address text
  const reverseGeocodeCoords = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "User-Agent": "ProxiJob-Web" } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          let addr = data.display_name;
          addr = addr.replace(/,\s*(Việt Nam|Vietnam)\s*$/i, "");
          addr = addr.replace(/,\s*\d{5,6}\b/g, "");
          const cityVal = data.address?.city || data.address?.town || data.address?.state || "TP. Hồ Chí Minh";
          const escapedCity = cityVal.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
          addr = addr.replace(new RegExp(`,\\s*${escapedCity}\\s*$`, "i"), "").trim();
          addr = addr.replace(/,\s*,/g, ",").replace(/,\s*$/g, "").trim();
          setAddress(addr);
          setCity(cityVal);
        }
      }
    } catch (err) {
      console.log("Reverse geocode error:", err);
    }
  };

  // Handle Leaflet Map coordinates selection
  useEffect(() => {
    if (loading || !mapRef.current) return;

    if (!profileMap.current) {
      profileMap.current = L.map(mapRef.current, {
        zoomControl: true,
        dragging: true,
        touchZoom: true
      }).setView([latitude, longitude], 16);

      L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: "Google Maps"
      }).addTo(profileMap.current);

      markerRef.current = L.marker([latitude, longitude], {
        draggable: true,
        icon: L.divIcon({
          html: `<div class="relative flex items-center justify-center">
                  <span class="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-red-400 opacity-30"></span>
                  <div style="background: linear-gradient(135deg, #ef4444, #f97316); width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4)">🏪</div>
                 </div>`,
          className: "profile-shop-marker",
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(profileMap.current);

      // Handle marker drag
      markerRef.current.on("dragend", (e) => {
        const position = markerRef.current.getLatLng();
        setLatitude(position.lat);
        setLongitude(position.lng);
        reverseGeocodeCoords(position.lat, position.lng);
      });

      // Handle map click
      profileMap.current.on("click", (e) => {
        const coords = e.latlng;
        markerRef.current.setLatLng(coords);
        setLatitude(coords.lat);
        setLongitude(coords.lng);
        reverseGeocodeCoords(coords.lat, coords.lng);
      });

      setTimeout(() => {
        if (profileMap.current) {
          profileMap.current.invalidateSize();
        }
      }, 250);
    } else {
      profileMap.current.setView([latitude, longitude], 16);
      markerRef.current.setLatLng([latitude, longitude]);
      setTimeout(() => {
        if (profileMap.current) {
          profileMap.current.invalidateSize();
        }
      }, 250);
    }
  }, [loading, latitude, longitude]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        businessName,
        address,
        city,
        latitude: Number(latitude),
        longitude: Number(longitude),
        description
      };

      // 1. Update business profile
      await updateBusinessProfileApi(payload);

      // 2. Sync coordinates to QR Code Geofencing Center
      await updateQrLocation(Number(latitude), Number(longitude));

      if (toast && toast.success) {
        toast.success("Cập nhật thông tin cửa hàng thành công! ✨");
      } else {
        alert("Cập nhật thông tin cửa hàng thành công! ✨");
      }
      fetchProfile(false);
    } catch (err) {
      if (toast && toast.error) {
        toast.error(err.message || "Cập nhật hồ sơ cửa hàng thất bại.");
      } else {
        alert(err.message || "Cập nhật hồ sơ cửa hàng thất bại.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-md max-w-2xl mx-auto mt-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-600 border-t-transparent mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải hồ sơ cửa hàng của bạn...</p>
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
              <Store size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Cấu Hình Cửa Hàng & Vị Trí Định Vị
              </h1>
              <p className="text-slate-600 text-xs font-medium mt-0.5">
                Cập nhật vị trí GPS kinh doanh thực tế và thông tin thương hiệu hiển thị trên ứng dụng.
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchProfile(true)}
            className="bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 hover:text-orange-600 p-3 rounded-2xl border border-orange-200/60 shadow-xs transition-all duration-300 flex items-center gap-2 text-xs font-extrabold shrink-0"
          >
            <RefreshCw size={16} /> Tải Lại
          </button>
        </div>
      </div>

      {/* ==================== 2. MAIN FORM & MAP GRID ==================== */}
      <form onSubmit={handleSubmit} className="dashboard-fade-in dashboard-fade-in-2 grid gap-6 lg:grid-cols-12">

        {/* ===== LEFT: BUSINESS FORM (7 Columns) ===== */}
        <div className="lg:col-span-7 bg-white/80 backdrop-blur-sm border border-slate-100 shadow-lg rounded-3xl p-6 md:p-7 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
              <Store size={18} className="text-orange-500" /> Hồ Sơ Cửa Hàng
            </h2>
            <span className="text-xs font-extrabold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck size={13} /> Đã xác minh
            </span>
          </div>

          {/* Field: Business Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Store size={14} className="text-orange-500" /> Tên thương hiệu kinh doanh
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ví dụ: Phở Hà Nội, Coffee & Tea, Quán Nướng 1988..."
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-400 focus:bg-white transition-all shadow-xs"
            />
          </div>

          {/* Field: Address & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin size={14} className="text-orange-500" /> Địa chỉ đường/khu vực
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, Tên đường, Phường/Xã..."
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-400 focus:bg-white transition-all shadow-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building size={14} className="text-orange-500" /> Thành phố
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-400 focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Field: Latitude & Longitude */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Compass size={14} className="text-orange-500" /> Vĩ độ (Latitude)
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-400 focus:bg-white transition-all shadow-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Navigation size={14} className="text-orange-500" /> Kinh độ (Longitude)
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-400 focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Field: Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText size={14} className="text-orange-500" /> Mô tả ngắn về doanh nghiệp
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu phong cách phục vụ, sản phẩm chủ đạo hoặc lưu ý làm việc đối với sinh viên..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-400 focus:bg-white transition-all shadow-xs"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <p className="text-[11px] text-slate-400 font-medium">Tọa độ sẽ tự động đồng bộ tâm chấm công QR Code.</p>
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-12 btn-premium disabled:from-slate-200 disabled:to-slate-300 text-white rounded-2xl font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save size={16} /> Lưu Cấu Hình
                </>
              )}
            </button>
          </div>
        </div>

        {/* ===== RIGHT: LEAFLET GPS PINNING MAP (5 Columns) ===== */}
        <div className="lg:col-span-5 bg-white/80 backdrop-blur-sm border border-slate-100 shadow-lg rounded-3xl p-6 flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
              <MapPin size={18} className="text-orange-500" /> Ghim Vị Trí Chấm Công
            </h2>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/70 text-slate-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 shadow-xs">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-[11px] font-extrabold text-slate-800">
              📡 Bấm chuột hoặc kéo ghim đỏ 🏪 để tự động lấy địa chỉ & tọa độ Geofence.
            </p>
          </div>

          {/* Leaflet Map Frame */}
          <div ref={mapRef} style={{ height: "360px" }} className="w-full relative rounded-3xl border border-slate-200 overflow-hidden shadow-inner z-0" />

          {/* Coords Cards below map */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">LATITUDE</span>
              <p className="font-black text-slate-800 font-mono text-xs mt-0.5">{Number(latitude).toFixed(6)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">LONGITUDE</span>
              <p className="font-black text-slate-800 font-mono text-xs mt-0.5">{Number(longitude).toFixed(6)}</p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
