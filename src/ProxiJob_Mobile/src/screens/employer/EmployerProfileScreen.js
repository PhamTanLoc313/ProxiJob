import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  Image
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../db/dbConfig';
import { AppContext } from '../../context/AppContext';
import { theme } from '../../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getBusinessProfileApi,
  registerBusinessProfileApi,
  updateBusinessProfileApi,
  activateBusinessProfileApi
} from '../../api/businessApi';

const GOOGLE_MAPS_API_KEY = 'CvNapWs3C3Vt7ZTRZf0uZliN9v3q8TBJKxd2CEcW';

const cleanAddress = (rawAddress) => {
  if (!rawAddress) return '';
  let cleaned = rawAddress.replace(/,\s*(Việt Nam|Vietnam)\s*$/i, '');
  cleaned = cleaned.replace(/,\s*\d{5,6}\b/g, '');
  return cleaned.trim();
};

const reverseGeocode = async (lat, lng) => {
  let addressVal = '';
  let cityVal = 'Thành phố Hồ Chí Minh';
  let success = false;

  const hasRoadOrNumber = (addr) => {
    if (!addr) return false;
    const lower = addr.toLowerCase();
    return lower.includes('đường') || lower.includes('số') || lower.includes('hẻm') || lower.includes('ngõ') || lower.includes('kiệt') || lower.includes('phố') || /^\d+/.test(addr);
  };

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${GOOGLE_MAPS_API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          // Find the most detailed result containing a road or house number
          let chosenResult = data.results[0];
          for (let i = 0; i < data.results.length; i++) {
            const resItem = data.results[i];
            if (hasRoadOrNumber(resItem.formatted_address)) {
              chosenResult = resItem;
              break;
            }
          }

          addressVal = cleanAddress(chosenResult.formatted_address);

          if (chosenResult.address_components) {
            const cityComponent = chosenResult.address_components.find(comp =>
              comp.types && (comp.types.includes('administrative_area_level_1') || comp.types.includes('city'))
            );
            if (cityComponent) {
              cityVal = cityComponent.long_name;
            }
          }
          success = true;
        }
      }
    } catch (e) {
      console.log('Goong reverse geocoding error:', e);
    }
  }

  // Fallback to OSM Nominatim
  if (!success || !hasRoadOrNumber(addressVal)) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'ProxiJobApp/1.0' } }
      );
      if (response.ok) {
        const data = await response.json();
        let osmAddr = '';
        if (data.display_name) {
          osmAddr = cleanAddress(data.display_name);
        } else {
          const road = data.address?.road || '';
          const suburb = data.address?.suburb || data.address?.quarter || '';
          const city = data.address?.city || data.address?.town || data.address?.state || '';
          osmAddr = [road, suburb, city].filter(Boolean).join(', ');
        }

        // If OSM is indeed more detailed (or if we didn't succeed with Goong at all), use it
        if (!success || hasRoadOrNumber(osmAddr)) {
          addressVal = osmAddr;
          cityVal = data.address?.city || data.address?.town || data.address?.state || 'TP. Hồ Chí Minh';
          success = true;
        }
      }
    } catch (e) {
      console.log('OSM reverse geocoding error:', e);
    }
  }

  if (success) {
    if (addressVal && cityVal) {
      const escapedCity = cityVal.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regexCity = new RegExp(`,\\s*(${escapedCity}|Ho Chi Minh|Hồ Chí Minh|HCM|Hanoi|Hà Nội|Da Nang|Đà Nẵng)\\s*$`, 'i');
      addressVal = addressVal.replace(regexCity, '').trim();
      addressVal = addressVal.replace(/,\s*,/g, ',').replace(/,\s*$/g, '').trim();
    }
    return { address: addressVal, city: cityVal };
  }

  return {
    address: `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    city: 'TP. Hồ Chí Minh'
  };
};

const geocodeAddress = async (addressText, cityText) => {
  const query = `${addressText}${cityText ? ', ' + cityText : ''}`;

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://rsapi.goong.io/Geocode?address=${encodeURIComponent(query)}&api_key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const loc = data.results[0].geometry.location;
          return {
            latitude: loc.lat,
            longitude: loc.lng
          };
        }
      }
    } catch (e) {
      console.log('Goong geocoding API error:', e);
    }
  }

  try {
    let cleaned = addressText.trim();
    cleaned = cleaned.replace(/^\d+([/.-]\d+)*[a-zA-Z]?\s+/, '');
    cleaned = cleaned.replace(/^(hẻm|ngõ|kiệt)\s+\d+([/.-]\d+)*[a-zA-Z]?\s+/, '');

    const fallbackQuery = `${cleaned}${cityText ? ', ' + cityText : ''}, Viet Nam`;
    let response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallbackQuery)}&format=json&limit=1`, {
      headers: {
        'User-Agent': 'ProxiJobApp/1.0'
      }
    });
    let data = await response.json().catch(() => []);
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }

    const lower = addressText.toLowerCase();
    let fallbackQuery2 = '';
    if (lower.includes('trường thọ')) {
      fallbackQuery2 = 'Trường Thọ, Thủ Đức, Viet Nam';
    } else if (lower.includes('thủ đức')) {
      fallbackQuery2 = 'Thủ Đức, Viet Nam';
    } else {
      const parts = addressText.split(/[,.-]/);
      if (parts.length > 1) {
        fallbackQuery2 = `${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}, Viet Nam`;
      }
    }

    if (fallbackQuery2) {
      response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallbackQuery2)}&format=json&limit=1`, {
        headers: {
          'User-Agent': 'ProxiJobApp/1.0'
        }
      });
      data = await response.json().catch(() => []);
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
    }
  } catch (err) {
    console.log('OSM geocoding error:', err);
  }
  return null;
};

const BUSINESS_TYPES = [
  { label: 'Cà phê (Cafe)', value: 'Cafe', icon: 'cafe-outline' },
  { label: 'Nhà hàng (Restaurant)', value: 'NhaHang', icon: 'restaurant-outline' },
  { label: 'Quán Bar (Bar)', value: 'Bar', icon: 'wine-outline' },
  { label: 'Đồ ăn nhanh (FastFood)', value: 'FastFood', icon: 'pizza-outline' },
  { label: 'Tiệm bánh (Bakery)', value: 'Bakery', icon: 'leaf-outline' },
  { label: 'Khác', value: 'Khac', icon: 'ellipsis-horizontal-outline' }
];

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

const decodeBase64ToArrayBuffer = (base64String) => {
  const cleaned = base64String.replace(/[^A-Za-z0-9+/=]/g, "");
  let bufferLength = cleaned.length * 0.75;
  let len = cleaned.length;
  let i;
  let p = 0;
  let encoded1, encoded2, encoded3, encoded4;

  if (cleaned[cleaned.length - 1] === '=') {
    bufferLength--;
    if (cleaned[cleaned.length - 2] === '=') {
      bufferLength--;
    }
  }

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[cleaned.charCodeAt(i)];
    encoded2 = lookup[cleaned.charCodeAt(i + 1)];
    encoded3 = lookup[cleaned.charCodeAt(i + 2)];
    encoded4 = lookup[cleaned.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arrayBuffer;
};

const LeafletMap = React.memo(({ mapHtml, handleMapMessage, isGeocoding, showMap, webviewRef }) => {
  if (!showMap) return null;
  return (
    <View style={[styles.mapContainerOuter, { marginBottom: 16 }]}>
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            style={styles.webMap}
            title="Google Maps Location Picker"
          />
        ) : (
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.mobileMap}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={handleMapMessage}
          />
        )}

        {isGeocoding && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.mapLoadingText}>Đang xử lý vị trí...</Text>
          </View>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.mapHtml === nextProps.mapHtml &&
    prevProps.isGeocoding === nextProps.isGeocoding &&
    prevProps.showMap === nextProps.showMap
  );
});

export default function EmployerProfileScreen() {
  const { goBack, showToast, user, setUser } = useContext(AppContext);
  const insets = useSafeAreaInsets();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessType, setBusinessType] = useState('Cafe');
  const [customBusinessType, setCustomBusinessType] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Dropdown state
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Avatar upload menu state
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const webviewRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [errors, setErrors] = useState({});

  // Map states: mapInitCoords controls the initial coordinate center of WebView map HTML.
  // We only update this state on mount or when clicking "Get current location" to prevent map reload/flicker.
  const [mapInitCoords, setMapInitCoords] = useState({
    latitude: 10.7769, // Default District 1, HCM
    longitude: 106.7009
  });

  // Track the actual selected coordinates in background
  const [selectedCoords, setSelectedCoords] = useState({
    latitude: 10.7769,
    longitude: 106.7009
  });

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      let coordsLoaded = false;
      try {
        const profile = await getBusinessProfileApi();
        if (profile) {
          setBusinessName(profile.businessName || '');
          setPhoneNumber(profile.phoneNumber || '');
          
          const isPredefined = BUSINESS_TYPES.some(t => t.value === profile.businessType && t.value !== 'Khac');
          if (profile.businessType) {
            if (isPredefined) {
              setBusinessType(profile.businessType);
              setCustomBusinessType('');
            } else {
              setBusinessType('Khac');
              setCustomBusinessType(profile.businessType);
            }
          } else {
            setBusinessType('Cafe');
            setCustomBusinessType('');
          }

          setCity(profile.city || '');
          setAddress(profile.address || '');
          setTaxCode(profile.taxCode || '');
          setAvatarUrl(profile.avatarUrl || '');
          setDescription(profile.description || '');
          setIsRegistered(true);
          setIsActive(profile.isActive || false);

          if (profile.address) {
            // Geocode address to update map center
            try {
              const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(profile.address + ' ' + (profile.city || ''))}&limit=1`,
                { headers: { 'User-Agent': 'ProxiJob-App' } }
              );
              if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                if (geoData && geoData.length > 0) {
                  const lat = parseFloat(geoData[0].lat);
                  const lon = parseFloat(geoData[0].lon);
                  setMapInitCoords({ latitude: lat, longitude: lon });
                  setSelectedCoords({ latitude: lat, longitude: lon });
                  coordsLoaded = true;
                }
              }
            } catch (err) {
              console.log('Error geocoding existing address:', err);
            }
          }
        }
      } catch (error) {
        console.log('Profile loading failed (possibly not registered):', error.message);
        setIsRegistered(false);
      } finally {
        // If we didn't load any coordinates from the profile address, request current GPS location
        if (!coordsLoaded) {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
              setMapInitCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
              setSelectedCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            }
          } catch (e) {
            console.log('Error requesting initial location:', e);
          }
        }
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Helper function to geocode coordinates to readable address text
  const geocodeLatLng = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const { address: addressVal, city: cityVal } = await reverseGeocode(lat, lng);
      setAddress(addressVal);
      setCity(cityVal);
      setErrors(prev => ({ ...prev, address: null, city: null }));
    } catch (e) {
      console.log('Error reverse geocoding:', e);
    } finally {
      setIsGeocoding(false);
    }
  };

  // GPS Trigger to center on device's current location
  const handleGetCurrentLocation = async () => {
    try {
      setIsGeocoding(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Quyền truy cập vị trí bị từ chối!', 'warning');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setMapInitCoords({ latitude, longitude });
      setSelectedCoords({ latitude, longitude });

      // Move marker and map center in WebView immediately without reload
      const jsCode = `
        if (typeof map !== 'undefined' && typeof marker !== 'undefined') {
          map.setView([${latitude}, ${longitude}], 15);
          marker.setLatLng([${latitude}, ${longitude}]);
        }
        true;
      `;
      if (webviewRef.current) {
        webviewRef.current.injectJavaScript(jsCode);
      }

      // Also support iframe postMessage for web compatibility
      if (Platform.OS === 'web') {
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({
            type: 'update_center',
            latitude,
            longitude
          }), '*');
        }
      }

      await geocodeLatLng(latitude, longitude);
      showToast('Đã định vị thành công vị trí hiện tại!', 'success');
    } catch (err) {
      console.log('Error getting location:', err);
      showToast('Không thể lấy vị trí hiện tại!', 'error');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddressChange = (text) => {
    setAddress(text);
    if (errors.address) setErrors(prev => ({ ...prev, address: null }));

    if (text.length < 4) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        if (GOOGLE_MAPS_API_KEY) {
          const response = await fetch(
            `https://rsapi.goong.io/Place/AutoComplete?input=${encodeURIComponent(text)}&api_key=${GOOGLE_MAPS_API_KEY}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'OK' && data.predictions) {
              const formatted = data.predictions.map(item => ({
                display_name: item.description,
                place_id: item.place_id,
                isGoogle: true
              }));
              setAddressSuggestions(formatted);
              setShowSuggestions(formatted.length > 0);
            }
          }
        } else {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5`,
            { headers: { 'User-Agent': 'ProxiJobApp/1.0' } }
          );
          if (response.ok) {
            const data = await response.json();
            const formatted = data.map(item => ({
              display_name: cleanAddress(item.display_name),
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              isGoogle: false
            }));
            setAddressSuggestions(formatted);
            setShowSuggestions(formatted.length > 0);
          }
        }
      } catch (e) {
        console.log('Suggestions fetch error:', e);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 500);
  };

  const handleSelectSuggestion = async (suggestion) => {
    setAddress(suggestion.display_name);
    setShowSuggestions(false);
    setErrors(prev => ({ ...prev, address: null, city: null }));

    try {
      setIsGeocoding(true);
      let lat = 0;
      let lon = 0;
      if (suggestion.isGoogle) {
        const response = await fetch(
          `https://rsapi.goong.io/Place/Detail?place_id=${suggestion.place_id}&api_key=${GOOGLE_MAPS_API_KEY}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.result?.geometry?.location) {
            lat = data.result.geometry.location.lat;
            lon = data.result.geometry.location.lng;
          }
        }
      } else {
        lat = suggestion.lat;
        lon = suggestion.lon;
      }

      if (lat && lon) {
        setMapInitCoords({ latitude: lat, longitude: lon });
        setSelectedCoords({ latitude: lat, longitude: lon });

        // Update city dynamically if matched
        const lowerAddr = suggestion.display_name.toLowerCase();
        if (lowerAddr.includes('hồ chí minh') || lowerAddr.includes('hcm')) {
          setCity('Thành phố Hồ Chí Minh');
        } else if (lowerAddr.includes('hà nội')) {
          setCity('Thành phố Hà Nội');
        } else if (lowerAddr.includes('đà nẵng')) {
          setCity('Thành phố Đà Nẵng');
        } else if (lowerAddr.includes('thủ đức')) {
          setCity('Thành phố Thủ Đức');
        }

        // Move marker and map center in WebView immediately
        const jsCode = `
          if (typeof map !== 'undefined' && typeof marker !== 'undefined') {
            map.setView([${lat}, ${lon}], 15);
            marker.setLatLng([${lat}, ${lon}]);
          }
          true;
        `;
        if (webviewRef.current) {
          webviewRef.current.injectJavaScript(jsCode);
        }

        if (Platform.OS === 'web') {
          const iframe = document.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({
              type: 'update_center',
              latitude: lat,
              longitude: lon
            }), '*');
          }
        }

        showToast('Đã chọn địa chỉ & định vị tọa độ thành công!', 'success');
      } else {
        showToast('Không lấy được tọa độ cho vị trí này.', 'warning');
      }
    } catch (err) {
      console.log('Select suggestion error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!address) {
      showToast('Vui lòng nhập địa chỉ trước!', 'warning');
      return;
    }

    try {
      setIsGeocoding(true);
      showToast('Đang tìm tọa độ cho địa chỉ này...', 'info');
      
      const queryStr = `${address} ${city}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`,
        { headers: { 'User-Agent': 'ProxiJobApp/1.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          
          setMapInitCoords({ latitude: lat, longitude: lon });
          setSelectedCoords({ latitude: lat, longitude: lon });

          const jsCode = `
            if (typeof map !== 'undefined' && typeof marker !== 'undefined') {
              map.setView([${lat}, ${lon}], 15);
              marker.setLatLng([${lat}, ${lon}]);
            }
            true;
          `;
          if (webviewRef.current) {
            webviewRef.current.injectJavaScript(jsCode);
          }

          if (Platform.OS === 'web') {
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage(JSON.stringify({
                type: 'update_center',
                latitude: lat,
                longitude: lon
              }), '*');
            }
          }

          showToast('Định vị địa chỉ thành công!', 'success');
        } else {
          showToast('Không tìm thấy tọa độ cho địa chỉ này. Hãy thử nhập chi tiết hơn.', 'error');
        }
      }
    } catch (err) {
      console.log('Error geocoding typed address:', err);
      showToast('Lỗi khi định vị địa chỉ!', 'error');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Pick Image from Media Library
  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setAvatarMenuVisible(false);
          showToast('Bạn cần cấp quyền thư viện để đổi ảnh đại diện!', 'warning');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      setAvatarMenuVisible(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const base64Data = result.assets[0].base64;
        await handleUploadAvatar(localUri, base64Data);
      }
    } catch (error) {
      setAvatarMenuVisible(false);
      console.log('[EmployerProfileScreen] handlePickImage error:', error);
      showToast('Không thể chọn hình ảnh!', 'error');
    }
  };

  // Take photo from camera
  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setAvatarMenuVisible(false);
          showToast('Bạn cần cấp quyền camera để chụp ảnh đại diện!', 'warning');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      setAvatarMenuVisible(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const base64Data = result.assets[0].base64;
        await handleUploadAvatar(localUri, base64Data);
      }
    } catch (error) {
      setAvatarMenuVisible(false);
      console.log('[EmployerProfileScreen] handleTakePhoto error:', error);
      showToast('Không thể chụp ảnh!', 'error');
    }
  };

  // Upload avatar to Supabase and get Public URL
  const handleUploadAvatar = async (localUri, base64Data) => {
    try {
      setUploadingAvatar(true);
      if (!base64Data) {
        throw new Error("Không thể lấy dữ liệu ảnh.");
      }

      const arrayBuffer = decodeBase64ToArrayBuffer(base64Data);
      const fileExt = localUri.split('.').pop() || 'jpg';
      const fileName = `business_avatar_${user?.id || 'guest'}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          upsert: true,
          contentType: `image/${fileExt}`
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      showToast('Đã tải ảnh đại diện lên!', 'success');
    } catch (error) {
      console.log('[EmployerProfileScreen] Upload error:', error);
      showToast('Tải ảnh đại diện thất bại!', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});

    let localErrors = {};
    if (!businessName.trim()) {
      localErrors.businessName = 'Tên quán không được để trống!';
    }
    if (businessType === 'Khac' && !customBusinessType.trim()) {
      localErrors.customBusinessType = 'Vui lòng nhập loại hình kinh doanh khác!';
    }
    if (!phoneNumber.trim()) {
      localErrors.phoneNumber = 'Số điện thoại không được để trống!';
    } else if (!/^0\d{9}$/.test(phoneNumber.trim())) {
      localErrors.phoneNumber = 'Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số!';
    }
    if (!address.trim()) {
      localErrors.address = 'Địa chỉ không được để trống!';
    }
    if (!city.trim()) {
      localErrors.city = 'Thành phố không được để trống!';
    }
    if (!description.trim()) {
      localErrors.description = 'Giới thiệu về quán không được để trống!';
    } else if (description.trim().length < 20) {
      localErrors.description = 'Giới thiệu về quán phải có tối thiểu 20 ký tự!';
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      showToast('Vui lòng kiểm tra lại thông tin bị lỗi!', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        phoneNumber: phoneNumber.trim(),
        avatarUrl: avatarUrl.trim() || null,
        businessName: businessName.trim(),
        businessType: businessType === 'Khac' ? customBusinessType.trim() : businessType,
        address: address.trim(),
        city: city.trim(),
        taxCode: taxCode.trim() || null,
        description: description.trim()
      };

      if (isRegistered) {
        await updateBusinessProfileApi(payload);
        showToast('Cập nhật hồ sơ thành công!', 'success');
      } else {
        await registerBusinessProfileApi(payload);
        showToast('Đăng ký hồ sơ thành công!', 'success');
        setIsRegistered(true);
      }

      if (avatarUrl && setUser) {
        setUser(prev => prev ? ({ ...prev, avatarUrl: avatarUrl.trim() }) : prev);
      }

      // Automatically activate profile if not active
      if (!isActive) {
        try {
          await activateBusinessProfileApi();
          setIsActive(true);
        } catch (actErr) {
          console.log('Activation error:', actErr.message);
        }
      }

      setTimeout(() => {
        goBack();
      }, 1000);

    } catch (error) {
      showToast(error.message || 'Lưu thông tin thất bại!', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Map Message Handler (Native WebView)
  const handleMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location_selected') {
        const { latitude, longitude } = data;
        setSelectedCoords({ latitude, longitude });
        geocodeLatLng(latitude, longitude);
      }
    } catch (e) {
      console.log('Error handling map message:', e);
    }
  };

  // Google Maps Leaflet template
  const mapHtml = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { 
            zoomControl: true,
            dragging: true,
            touchZoom: true,
            scrollWheelZoom: true
          }).setView([${mapInitCoords.latitude}, ${mapInitCoords.longitude}], 15);
          
          L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20
          }).addTo(map);

          var marker = L.marker([${mapInitCoords.latitude}, ${mapInitCoords.longitude}], {
            draggable: true
          }).addTo(map);

          function sendLocation(lat, lng) {
            var payload = JSON.stringify({
              type: 'location_selected',
              latitude: lat,
              longitude: lng
            });
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(payload);
            } else {
              window.parent.postMessage(payload, '*');
            }
          }

          map.on('click', function(e) {
            var coords = e.latlng;
            marker.setLatLng(coords);
            sendLocation(coords.lat, coords.lng);
          });

          marker.on('dragend', function(e) {
            var coords = marker.getLatLng();
            sendLocation(coords.lat, coords.lng);
          });
        </script>
      </body>
      </html>
    `;
  }, [mapInitCoords.latitude, mapInitCoords.longitude]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A58CA" />
        <Text style={styles.loadingText}>Đang tải thông tin hồ sơ của quán...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Section 1: Store Bento Card - Header Profile Info & Avatar Picker */}
          <View style={styles.bentoHeaderCard}>
            <View style={styles.avatarPickerSection}>
              {/* Circular Avatar Picker Component */}
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => setAvatarMenuVisible(true)}
                activeOpacity={0.85}
              >
                {uploadingAvatar ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator size="small" color="#0A58CA" />
                  </View>
                ) : avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="storefront" size={32} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <View style={styles.bentoHeaderInfo}>
                <Text style={styles.bentoStoreName} numberOfLines={1}>
                  {businessName || 'Tên Quán Chưa Thiết Lập'}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E6F4EA' : '#FFF4E5' }]}>
                    <View style={[styles.statusBadgeDot, { backgroundColor: isActive ? '#137333' : '#B06000' }]} />
                    <Text style={[styles.statusBadgeText, { color: isActive ? '#137333' : '#B06000' }]}>
                      {isActive ? 'Đã hoạt động' : 'Chờ kích hoạt'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Bento Card: Identity Form Fields */}
          <View style={styles.bentoFormCard}>
            <View style={styles.bentoSectionTitleRow}>
              <View style={[styles.bentoIndicator, { backgroundColor: '#0A58CA' }]} />
              <Text style={styles.bentoSectionTitle}>Thông tin thương hiệu</Text>
            </View>

            {/* Input: Business Name */}
            <View style={styles.bentoInputGroup}>
              <Text style={styles.bentoLabel}>Tên Quán / Doanh Nghiệp <Text style={styles.required}>*</Text></Text>
              <View style={[styles.bentoInputWrapper, errors.businessName && { borderColor: '#EF4444' }]}>
                <Ionicons name="storefront-outline" size={18} color={errors.businessName ? '#EF4444' : '#94A3B8'} style={styles.inputIcon} />
                <TextInput
                  style={styles.bentoInput}
                  value={businessName}
                  onChangeText={(val) => {
                    setBusinessName(val);
                    if (errors.businessName) setErrors(prev => ({ ...prev, businessName: null }));
                  }}
                  placeholder="Highlands Coffee Nam Cao"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
            </View>

            {/* Selector: Business Type */}
            <View style={styles.bentoInputGroup}>
              <Text style={styles.bentoLabel}>Loại Hình Kinh Doanh <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.bentoDropdownBtn, errors.customBusinessType && { borderColor: '#EF4444' }]}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={BUSINESS_TYPES.find(t => t.value === businessType)?.icon || 'grid-outline'}
                    size={18}
                    color="#0A58CA"
                    style={styles.inputIcon}
                  />
                  <Text style={styles.bentoDropdownText}>
                    {businessType === 'Khac' && customBusinessType ? customBusinessType : (BUSINESS_TYPES.find(t => t.value === businessType)?.label || 'Chọn loại hình')}
                  </Text>
                </View>
                <Ionicons name={showTypeDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
              </TouchableOpacity>

              {showTypeDropdown && (
                <View style={styles.bentoDropdownList}>
                  {BUSINESS_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.bentoDropdownItem, businessType === type.value && styles.bentoDropdownItemActive]}
                      onPress={() => {
                        setBusinessType(type.value);
                        setShowTypeDropdown(false);
                        if (type.value !== 'Khac') {
                          setCustomBusinessType('');
                        }
                        setErrors(prev => ({ ...prev, customBusinessType: null }));
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name={type.icon} size={16} color={businessType === type.value ? '#0A58CA' : '#64748B'} style={{ marginRight: 8 }} />
                        <Text style={[styles.bentoDropdownItemText, businessType === type.value && styles.bentoDropdownItemTextActive]}>
                          {type.label}
                        </Text>
                      </View>
                      {businessType === type.value && (
                        <Ionicons name="checkmark" size={16} color="#0A58CA" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {businessType === 'Khac' && (
                <View style={[styles.bentoInputWrapper, { marginTop: 10 }, errors.customBusinessType && { borderColor: '#EF4444' }]}>
                  <Ionicons name="create-outline" size={18} color={errors.customBusinessType ? '#EF4444' : '#94A3B8'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.bentoInput}
                    value={customBusinessType}
                    onChangeText={(val) => {
                      setCustomBusinessType(val);
                      if (errors.customBusinessType) setErrors(prev => ({ ...prev, customBusinessType: null }));
                    }}
                    placeholder="Nhập loại hình khác (Ví dụ: Tiệm quần áo)..."
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}
              {errors.customBusinessType && <Text style={styles.errorText}>{errors.customBusinessType}</Text>}
            </View>

            {/* Input: Phone & Tax Code */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.bentoInputGroup, { flex: 1.2, marginRight: 10 }]}>
                <Text style={styles.bentoLabel}>Số Điện Thoại <Text style={styles.required}>*</Text></Text>
                <View style={[styles.bentoInputWrapper, errors.phoneNumber && { borderColor: '#EF4444' }]}>
                  <Ionicons name="call-outline" size={18} color={errors.phoneNumber ? '#EF4444' : '#94A3B8'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.bentoInput}
                    value={phoneNumber}
                    onChangeText={(val) => {
                      setPhoneNumber(val);
                      if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: null }));
                    }}
                    keyboardType="phone-pad"
                    placeholder="0912345678"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
              </View>

              <View style={[styles.bentoInputGroup, { flex: 1 }]}>
                <Text style={styles.bentoLabel}>Mã Số Thuế <Text style={styles.optional}>(Tùy chọn)</Text></Text>
                <View style={styles.bentoInputWrapper}>
                  <Ionicons name="receipt-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.bentoInput}
                    value={taxCode}
                    onChangeText={setTaxCode}
                    placeholder="Mã số thuế"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Bento Card: Description */}
          <View style={styles.bentoFormCard}>
            <View style={styles.bentoSectionTitleRow}>
              <View style={[styles.bentoIndicator, { backgroundColor: '#FF6B00' }]} />
              <Text style={styles.bentoSectionTitle}>Mô tả chi tiết</Text>
            </View>

            <View style={styles.bentoInputGroup}>
              <Text style={styles.bentoLabel}>Giới thiệu về quán <Text style={styles.required}>* (Tối thiểu 20 ký tự)</Text></Text>
              <TextInput
                style={[styles.bentoTextArea, errors.description && { borderColor: '#EF4444' }]}
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                }}
                placeholder="Môi trường làm việc năng động, sạch sẽ. Thân thiện với sinh viên..."
                placeholderTextColor="#94A3B8"
                multiline={true}
                numberOfLines={4}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
              <Text style={styles.charCount}>
                Đã nhập: {description.trim().length} ký tự
              </Text>
            </View>
          </View>

          {/* Bento Card: Google Maps & Address Picker */}
          <View style={styles.bentoFormCard}>
            <View style={styles.bentoSectionTitleRow}>
              <View style={[styles.bentoIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.bentoSectionTitle}>Định vị địa chỉ (Google Maps)</Text>
            </View>

            {/* 1. Input: Address */}
            <View style={styles.bentoInputGroup}>
              <Text style={styles.bentoLabel}>ĐỊA CHỈ <Text style={styles.required}>*</Text></Text>
              <View style={[styles.bentoInputWrapper, { position: 'relative', zIndex: 9999 }, errors.address && { borderColor: '#EF4444' }]}>
                <Ionicons name="location-outline" size={18} color={errors.address ? '#EF4444' : '#94A3B8'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.bentoInput, { paddingRight: 100 }]}
                  value={address}
                  onChangeText={(val) => {
                    handleAddressChange(val);
                    if (errors.address) setErrors(prev => ({ ...prev, address: null }));
                  }}
                  placeholder="Nhập địa chỉ của quán..."
                  placeholderTextColor="#94A3B8"
                />

                {suggestionsLoading ? (
                  <ActivityIndicator size="small" color="#0A58CA" style={{ position: 'absolute', right: 90, top: 15 }} />
                ) : null}

                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    backgroundColor: '#64748B',
                    borderRadius: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    height: 34,
                    justifyContent: 'center',
                  }}
                  disabled={isGeocoding}
                  onPress={handleSearchAddress}
                >
                  {isGeocoding ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>Tìm Tọa Độ</Text>
                  )}
                </TouchableOpacity>

                {showSuggestions && addressSuggestions.length > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: 52,
                    left: 0,
                    right: 0,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                    maxHeight: 200,
                    zIndex: 99999,
                  }}>
                    <ScrollView keyboardShouldPersistTaps="always">
                      {addressSuggestions.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomWidth: index === addressSuggestions.length - 1 ? 0 : 1,
                            borderBottomColor: '#F1F5F9',
                          }}
                          onPress={() => handleSelectSuggestion(item)}
                        >
                          <Text style={{ fontSize: 13, color: '#334155', fontWeight: '500' }}>{item.display_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* 2. GPS & Map Buttons Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#10B981',
                  paddingVertical: 12,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 2,
                }}
                onPress={handleGetCurrentLocation}
                disabled={isGeocoding}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>📍 GPS Hiện Tại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#FF6B00',
                  paddingVertical: 12,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FF6B00',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 2,
                }}
                onPress={() => setShowMap(!showMap)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>🗺️ Bản Đồ</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Coordinates Badges Row */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              <View style={{
                backgroundColor: '#F1F5F9',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 99,
                marginRight: 8,
                marginBottom: 8,
              }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B' }}>
                  Lat: {selectedCoords.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={{
                backgroundColor: '#F1F5F9',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 99,
                marginRight: 8,
                marginBottom: 8,
              }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B' }}>
                  Long: {selectedCoords.longitude.toFixed(6)}
                </Text>
              </View>
              <View style={{
                backgroundColor: '#E6F4EA',
                borderColor: '#137333',
                borderWidth: 1,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 99,
                marginRight: 8,
                marginBottom: 8,
              }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#137333' }}>
                  ✓ GPS Đã kết nối
                </Text>
              </View>
            </View>

            {/* 4. Map Container (Conditional) - Isolated with React.memo */}
            <LeafletMap
              mapHtml={mapHtml}
              handleMapMessage={handleMapMessage}
              isGeocoding={isGeocoding}
              showMap={showMap}
              webviewRef={webviewRef}
            />

            {/* 5. Input: City */}
            <View style={styles.bentoInputGroup}>
              <Text style={styles.bentoLabel}>THÀNH PHỐ <Text style={styles.required}>*</Text></Text>
              <View style={[styles.bentoInputWrapper, errors.city && { borderColor: '#EF4444' }]}>
                <Ionicons name="map-outline" size={18} color={errors.city ? '#EF4444' : '#94A3B8'} style={styles.inputIcon} />
                <TextInput
                  style={styles.bentoInput}
                  value={city}
                  onChangeText={(val) => {
                    setCity(val);
                    if (errors.city) setErrors(prev => ({ ...prev, city: null }));
                  }}
                  placeholder="TP. Hồ Chí Minh"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>
          </View>
 
          {/* Submit Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Lưu Thay Đổi Hồ Sơ</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Avatar Picker Dialog Modal (Action Sheet style) */}
      <Modal
        visible={avatarMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAvatarMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAvatarMenuVisible(false)}
        >
          <View style={styles.actionSheetContent}>
            <Text style={styles.actionSheetTitle}>Chọn ảnh đại diện của quán</Text>

            <TouchableOpacity style={styles.actionSheetOption} onPress={handlePickImage}>
              <Ionicons name="images-outline" size={20} color="#0A58CA" style={{ marginRight: 12 }} />
              <Text style={styles.actionSheetOptionText}>Chọn từ thư viện ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionSheetOption} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={20} color="#0A58CA" style={{ marginRight: 12 }} />
              <Text style={styles.actionSheetOptionText}>Chụp ảnh mới bằng Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionSheetOption, styles.cancelOption]}
              onPress={() => setAvatarMenuVisible(false)}
            >
              <Text style={styles.cancelOptionText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Bento structure slate background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Sora' : 'sans-serif',
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 140,
  },
  // Section 1: Header Profile Card & Avatar Picker Section
  bentoHeaderCard: {
    backgroundColor: '#0A58CA', // Royal blue theme
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0A58CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarPickerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0A58CA',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  bentoHeaderInfo: {
    flex: 1,
    marginLeft: 14,
  },
  bentoStoreName: {
    fontFamily: Platform.OS === 'ios' ? 'Sora' : 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bentoStoreType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
    marginLeft: 8,
  },
  // Bento Content Cards
  bentoFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  bentoSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bentoIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  bentoSectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Sora' : 'sans-serif',
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bentoInputGroup: {
    marginBottom: 16,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  bentoInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  bentoInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  twoColumnRow: {
    flexDirection: 'row',
  },
  bentoTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    height: 110,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  // Dropdown list styles
  bentoDropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  bentoDropdownText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  bentoDropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginTop: 6,
    overflow: 'hidden',
  },
  bentoDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bentoDropdownItemActive: {
    backgroundColor: '#0A58CA08',
  },
  bentoDropdownItemText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  bentoDropdownItemTextActive: {
    color: '#0A58CA',
    fontWeight: '700',
  },
  // Map styles
  mapContainerOuter: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  mapWrapper: {
    height: 220,
    width: '100%',
  },
  webMap: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  mobileMap: {
    flex: 1,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapLoadingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  gpsFloatingBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gpsFloatingBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A58CA',
    marginLeft: 6,
  },
  // Action sheet modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  actionSheetTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Sora' : 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionSheetOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  cancelOption: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
    marginTop: 6,
    justifyContent: 'center',
  },
  cancelOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  // Save button
  saveBtn: {
    backgroundColor: '#0A58CA',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#0A58CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  required: {
    color: '#EF4444',
  },
  optional: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '400',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  }
});
