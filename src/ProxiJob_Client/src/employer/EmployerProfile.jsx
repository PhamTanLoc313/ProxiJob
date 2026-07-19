import { useState, useEffect, useRef } from "react";
import { Store, MapPin, Compass, Save, RefreshCw, Check } from "lucide-react";
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

  // Reverse geocode coordinates to address text (matches mobile logic)
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
          // Clean: remove country and postal code
          addr = addr.replace(/,\s*(Việt Nam|Vietnam)\s*$/i, "");
          addr = addr.replace(/,\s*\d{5,6}\b/g, "");
          const cityVal = data.address?.city || data.address?.town || data.address?.state || "TP. Hồ Chí Minh";
          // Remove trailing city name from address to avoid duplication
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

      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 19
      }).addTo(profileMap.current);

      markerRef.current = L.marker([latitude, longitude], {
        draggable: true,
        icon: L.divIcon({
          html: `<div style="background: #EF4444; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 18px; shadow: 0 4px 8px rgba(0,0,0,0.3)">🏪</div>`,
          className: "profile-shop-marker",
          iconSize: [36, 36],
          iconAnchor: [18, 18]
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
    } else {
      profileMap.current.setView([latitude, longitude], 16);
      markerRef.current.setLatLng([latitude, longitude]);
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

      toast.success("Cập nhật thông tin cửa hàng thành công! ✨");
      fetchProfile(false);
    } catch (err) {
      toast.error(err.message || "Cập nhật hồ sơ cửa hàng thất bại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-md max-w-2xl mx-auto mt-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-600 border-t-transparent mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải hồ sơ cửa hàng của bạn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 flex flex-col gap-6 min-h-screen">
      {/* Title */}
      <div className="bg-white border border-slate-100 shadow-md rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cấu Hình Cửa Hàng</h1>
          <p className="text-slate-400 text-xs mt-0.5">Cập nhật vị trí GPS kinh doanh và thông tin hiển thị trên radar.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-12">
        {/* Profile general form (Left side) */}
        <div className="md:col-span-7 bg-white border border-slate-100 shadow-md rounded-3xl p-6 space-y-5">
          <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
            <Store size={16} className="text-orange-600" /> Hồ sơ cửa hàng
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Tên thương hiệu kinh doanh</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ví dụ: Phở Hà Nội, Trà sữa ToCoToCo..."
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-700">Địa chỉ</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, Tên đường..."
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Thành phố</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Vĩ độ (Latitude)</label>
              <input
                type="number"
                step="0.000001"
                required
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Kinh độ (Longitude)</label>
              <input
                type="number"
                step="0.000001"
                required
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Mô tả doanh nghiệp</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu nhanh về quán..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-400 focus:bg-white transition"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-50 flex items-center justify-end gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-11 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 disabled:bg-slate-200 text-white rounded-2xl font-black text-xs shadow-lg shadow-orange-600/10 transition flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save size={14} /> Lưu Cấu Hình
                </>
              )}
            </button>
          </div>
        </div>

        {/* Leaflet GPS map selector (Right side) */}
        <div className="md:col-span-5 bg-white border border-slate-100 shadow-md rounded-3xl p-6 flex flex-col gap-4">
          <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
            <MapPin size={16} className="text-orange-600" /> Ghim vị trí định vị chấm công
          </h2>
          
          <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
            Bấm chuột trực tiếp vào bản đồ hoặc kéo ghim đỏ đến vị trí chính xác của quán để cập nhật tọa độ Geofence.
          </p>

          <div ref={mapRef} style={{ height: "300px" }} className="w-full relative rounded-2xl border border-slate-200 overflow-hidden z-0" />
        </div>
      </form>
    </div>
  );
}
