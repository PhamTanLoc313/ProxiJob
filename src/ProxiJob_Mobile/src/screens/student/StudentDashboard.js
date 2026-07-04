import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';
import { AppContext } from '../../context/AppContext';
import { useShiftsQuery } from '../../hooks/queries';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { getStudentProfileApi, activateStudentProfileApi, deactivateStudentProfileApi } from '../../api/studentApi';
import { getCategoriesApi } from '../../api/jobs';

const getLeftBorderColorByCategory = (categoryName, shopName) => {
  const target = (categoryName || shopName || '').trim().toLowerCase();

  if (target.includes('giao hàng') || target.includes('delivery') || target.includes('shipper')) {
    return '#EF4444'; // Red
  }
  if (target.includes('gia sư') || target.includes('tutor') || target.includes('dạy') || target.includes('học')) {
    return '#2563EB'; // Blue
  }
  if (target.includes('sửa chữa') || target.includes('repair') || target.includes('bảo trì') || target.includes('kỹ thuật')) {
    return '#F59E0B'; // Yellow/Amber
  }
  if (target.includes('phục vụ') || target.includes('waiter') || target.includes('chạy bàn') || target.includes('phụ vụ')) {
    return '#8B5CF6'; // Purple
  }
  if (target.includes('thú cưng') || target.includes('pet')) {
    return '#EC4899'; // Pink
  }
  return '#0D9488'; // Teal default
};

const getCategoryColors = (categoryName, shopName) => {
  const target = (categoryName || shopName || '').trim().toLowerCase();

  if (target.includes('giao hàng') || target.includes('delivery') || target.includes('shipper')) {
    return {
      primary: '#EF4444', // Red
      bgLight: '#FEF2F2',
      borderLight: '#FCA5A5',
      borderUrgent: '#FCA5A5',
    };
  }
  if (target.includes('gia sư') || target.includes('tutor') || target.includes('dạy') || target.includes('học')) {
    return {
      primary: '#2563EB', // Blue
      bgLight: '#EFF6FF',
      borderLight: '#BFDBFE',
      borderUrgent: '#93C5FD',
    };
  }
  if (target.includes('sửa chữa') || target.includes('repair') || target.includes('bảo trì') || target.includes('kỹ thuật')) {
    return {
      primary: '#F59E0B', // Amber
      bgLight: '#FFFBEB',
      borderLight: '#FDE68A',
      borderUrgent: '#FCD34D',
    };
  }
  if (target.includes('phục vụ') || target.includes('waiter') || target.includes('chạy bàn') || target.includes('phụ vụ')) {
    return {
      primary: '#8B5CF6', // Purple
      bgLight: '#F5F3FF',
      borderLight: '#DDD6FE',
      borderUrgent: '#C084FC',
    };
  }
  if (target.includes('thú cưng') || target.includes('pet')) {
    return {
      primary: '#EC4899', // Pink
      bgLight: '#FDF2F8',
      borderLight: '#FBCFE8',
      borderUrgent: '#F472B6',
    };
  }
  return {
    primary: '#0D9488', // Teal
    bgLight: '#F0FDFA',
    borderLight: '#CCFBF1',
    borderUrgent: '#5EEAD4',
  };
};

const getShopBgColor = (shopName) => {
  if (!shopName) return '#EFF6FF';
  const charCode = shopName.charCodeAt(0) || 0;
  const colors = ['#FFE4E6', '#FEF3C7', '#ECFDF5', '#EFF6FF', '#F5F3FF', '#FFF7ED'];
  return colors[charCode % colors.length];
};

const getShopTextColor = (shopName) => {
  if (!shopName) return '#475569';
  const charCode = shopName.charCodeAt(0) || 0;
  const colors = ['#E11D48', '#D97706', '#059669', '#2563EB', '#7C3AED', '#EA580C'];
  return colors[charCode % colors.length];
};

const getShopInitials = (shopName) => {
  if (!shopName) return 'PJ';
  const cleanName = shopName.replace(/(Coffee|Tea|Restaurant|Store|Shop|Quán|Café)/gi, '').trim();
  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.substring(0, 2).toUpperCase();
};

const GOOGLE_MAPS_API_KEY = 'CvNapWs3C3Vt7ZTRZf0uZliN9v3q8TBJKxd2CEcW';

const cleanAddress = (rawAddress) => {
  if (!rawAddress) return '';
  let cleaned = rawAddress.replace(/,\s*(Việt Nam|Vietnam)\s*$/i, '');
  cleaned = cleaned.replace(/,\s*\d{5,6}\b/g, '');
  return cleaned.trim();
};

const getDistrict = (address) => {
  if (!address) return '';
  const match = address.match(/(Quận \d+|Q\.\s*\d+|Quận [a-zA-ZÀ-ỹ\s]+|Bình Thạnh|Gò Vấp|Thủ Đức|Phú Nhuận|Tân Bình|Tân Phú|Bình Tân)/i);
  return match ? match[0] : address;
};

// Module-level state to persist view mode (list/map) across unmounts
let globalViewMode = 'list';

const ShiftCard = React.memo(({ shift, navigateTo }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    let anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: false,
        })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  const isApplied = shift.status === 'applied';
  const isApproved = shift.status === 'approved' || shift.status === 'checkin_active' || shift.status === 'completed';
  const isEmergency = shift.isEmergency;
  const leftBorderColor = getLeftBorderColorByCategory(shift.categoryName, shift.shopName);
  const catColors = getCategoryColors(shift.categoryName, shift.shopName);

  return (
    <TouchableOpacity
      style={styles.cardShadowContainer}
      activeOpacity={0.95}
      onPress={() => navigateTo('job_detail', { shiftId: shift.id })}
    >
      <Animated.View style={[
        styles.cardContent,
        { borderLeftColor: leftBorderColor, borderLeftWidth: 6 },
        isEmergency && {
          borderLeftWidth: 8,
          backgroundColor: pulseAnim.interpolate({
            inputRange: [0.3, 1],
            outputRange: ['#FFFFFF', catColors.bgLight]
          }),
          borderColor: pulseAnim.interpolate({
            inputRange: [0.3, 1],
            outputRange: ['#F1F5F9', catColors.borderLight]
          }),
          borderWidth: 1.5,
          shadowColor: catColors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: pulseAnim.interpolate({
            inputRange: [0.3, 1],
            outputRange: [0.05, 0.35]
          }),
          shadowRadius: 12,
          elevation: 4
        }
      ]}>
        <View style={styles.cardTopRow}>
          <View style={styles.logoAndName}>
            <View style={[styles.shopLogoCircle, { backgroundColor: getShopBgColor(shift.shopName) }]}>
              <Text style={[styles.shopLogoText, { color: getShopTextColor(shift.shopName) }]}>
                {getShopInitials(shift.shopName)}
              </Text>
            </View>
            <View style={styles.shopRatingRow}>
              <Ionicons name="star" size={12} color="#FFB000" style={{ marginRight: 2 }} />
              <Text style={styles.shopRatingText}>{shift.rating || '5.0'}</Text>
            </View>
          </View>

          <View style={styles.tagRow}>
            {isEmergency && (
              <Animated.View style={[
                styles.emergencyTag,
                {
                  backgroundColor: catColors.primary,
                  borderColor: catColors.borderUrgent,
                  opacity: pulseAnim,
                  transform: [{
                    scale: pulseAnim.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.96, 1.04]
                    })
                  }]
                }
              ]}>
                <Text style={styles.emergencyTagText}>🔥 TUYỂN GẤP</Text>
              </Animated.View>
            )}
            <View style={styles.jobTypeTag}>
              <Text style={styles.jobTypeTagText}>Part-time</Text>
            </View>
            {isApplied && (
              <View style={styles.appliedStatusTag}>
                <Text style={styles.appliedStatusTagText}>Đang chờ duyệt</Text>
              </View>
            )}
            {isApproved && (
              <View style={styles.approvedStatusTag}>
                <Text style={styles.approvedStatusTagText}>Đã duyệt</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.jobTitleText} numberOfLines={2}>{shift.title}</Text>

        <Text style={styles.shopSubtitleText} numberOfLines={1}>
          {shift.shopName} • {getDistrict(shift.address) || 'TP.HCM'}
        </Text>

        <View style={styles.timeInfoRow}>
          <Ionicons name="time-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
          <Text style={styles.timeInfoText}>{shift.date} • {shift.time}</Text>
        </View>

        {shift.address ? (
          <View style={styles.addressInfoRow}>
            <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.addressInfoText} numberOfLines={1} ellipsizeMode="tail">
              {shift.address}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooterRow}>
          <Text style={styles.salaryText}>
            {(shift.hourlyRate).toLocaleString('vi-VN')} đ/h
            <Text style={styles.distanceText}>
              {shift.noGps ? '' : ` • ${shift.distanceKm} km`}
            </Text>
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// Module-level state to persist current page across unmounts
let globalCurrentPage = 1;

export default function StudentDashboard() {
  const {
    studentCoords,
    getDistanceInMeters,
    navigateTo,
    user,
    setUser,
    setStudentCoords,
    showToast
  } = useContext(AppContext);

  const { data: shifts = [], refetch: loadShifts } = useShiftsQuery(user, studentCoords);

  const [viewMode, setViewModeState] = useState('list');

  const setViewMode = async (mode) => {
    try {
      await AsyncStorage.setItem('@student_view_mode', mode);
    } catch (e) {
      console.log('Error saving view mode:', e);
    }
    setViewModeState(mode);
  };

  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('@student_view_mode');
        if (savedMode) {
          setViewModeState(savedMode);
        }
      } catch (e) {
        console.log('Error loading view mode:', e);
      }
    };
    loadViewMode();
  }, []);

  const [pulseAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: false,
        })
      ])
    ).start();
  }, [pulseAnim]);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [categories, setCategories] = useState([
    { id: 1, name: 'Giao hàng' },
    { id: 2, name: 'Dịch vụ thú cưng' },
    { id: 3, name: 'Gia sư' },
    { id: 4, name: 'Sửa chữa' },
    { id: 5, name: 'Phục vụ' },
    { id: 6, name: 'Khác' }
  ]);

  useEffect(() => {
    getCategoriesApi().then(res => {
      if (res && res.length > 0) setCategories(res);
    }).catch(e => console.log('Error loading categories in StudentDashboard:', e));
  }, []);

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    lat: studentCoords?.latitude || 10.7769,
    lng: studentCoords?.longitude || 106.7009
  });
  const [tempCoords, setTempCoords] = useState({
    lat: studentCoords?.latitude || 10.7769,
    lng: studentCoords?.longitude || 106.7009
  });
  const [searchText, setSearchText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    if (locationModalVisible && studentCoords) {
      setMapCenter({
        lat: studentCoords.latitude,
        lng: studentCoords.longitude
      });
      setTempCoords({
        lat: studentCoords.latitude,
        lng: studentCoords.longitude
      });
    }
  }, [locationModalVisible, studentCoords]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [radius, setRadius] = useState(999.0); // Default to 'Tất cả' (All)
  const [profileAddress, setProfileAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPageState] = useState(globalCurrentPage);
  const setCurrentPage = (page) => {
    globalCurrentPage = typeof page === 'function' ? page(globalCurrentPage) : page;
    setCurrentPageState(page);
  };
  const isInitialMount = useRef(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const ITEMS_PER_PAGE = 7;

  const isProfileAddressSetRef = useRef(false);

  // Fetch initial availability status from profile
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const profile = await getStudentProfileApi();
        const isReady = profile?.readinessStatus === 'ReadyForWork';
        setIsAvailable(isReady);
        Animated.timing(toggleAnim, {
          toValue: isReady ? 1 : 0,
          duration: 0,
          useNativeDriver: false,
        }).start();
      } catch (err) {
        console.log('[StudentDashboard] Error fetching availability:', err);
      }
    };
    if (user && user.role === 'student') fetchAvailability();
  }, [user]);

  const handleToggleAvailability = async () => {
    if (availabilityLoading) return;
    setAvailabilityLoading(true);
    const newState = !isAvailable;
    try {
      if (newState) {
        await activateStudentProfileApi();
      } else {
        await deactivateStudentProfileApi();
      }
      setIsAvailable(newState);
      Animated.spring(toggleAnim, {
        toValue: newState ? 1 : 0,
        friction: 5,
        tension: 40,
        useNativeDriver: false,
      }).start();
      if (showToast) {
        showToast(
          newState ? 'Đã bật sẵn sàng nhận việc! 🟢' : 'Đã tạm ngưng nhận việc 🔴',
          newState ? 'success' : 'info'
        );
      }
    } catch (err) {
      console.log('[StudentDashboard] Toggle availability error:', err);
      if (showToast) {
        showToast(err.message || 'Không thể thay đổi trạng thái', 'error');
      }
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleSelectLocation = async (lat, lng, addressName) => {
    const coords = { latitude: lat, longitude: lng };

    if (setStudentCoords) {
      setStudentCoords(coords);
    }
    setProfileAddress(addressName);
    isProfileAddressSetRef.current = true;

    try {
      await AsyncStorage.setItem('@student_custom_gps', JSON.stringify(coords));
      await AsyncStorage.setItem('@student_profile_address', addressName);
    } catch (err) {
      console.log('[StudentDashboard] Error saving location selection:', err);
    }

    setLocationModalVisible(false);
    await loadShifts(true);

    if (showToast) {
      showToast(`Đã cập nhật vị trí tìm việc: ${addressName}`, 'success');
    }
  };

  const handleMapSelectLocation = async (lat, lng) => {
    let addressName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    let success = false;

    if (GOOGLE_MAPS_API_KEY) {
      try {
        const response = await fetch(
          `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${GOOGLE_MAPS_API_KEY}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            addressName = cleanAddress(data.results[0].formatted_address);
            success = true;
          }
        }
      } catch (e) {
        console.log('[StudentDashboard] Goong reverse geocode error, falling back to OSM:', e);
      }
    }

    if (!success) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: {
            'User-Agent': 'ProxiJobApp/1.0'
          }
        });
        if (response.ok) {
          const data = await response.json();
          const displayName = data.display_name || '';
          const addressVal = data.address?.road || data.address?.suburb || data.address?.quarter || data.address?.city_district || displayName.split(',')[0] || 'Vị trí bản đồ';
          const cityVal = data.address?.city || data.address?.town || data.address?.state || '';
          addressName = cityVal ? `${addressVal}, ${cityVal}` : addressVal;
        }
      } catch (err) {
        console.log('[StudentDashboard] reverse geocode error:', err);
      }
    }

    const coords = { latitude: lat, longitude: lng };
    if (setStudentCoords) {
      setStudentCoords(coords);
    }
    setProfileAddress(addressName);
    isProfileAddressSetRef.current = true;

    try {
      await AsyncStorage.setItem('@student_custom_gps', JSON.stringify(coords));
      await AsyncStorage.setItem('@student_profile_address', addressName);
    } catch (err) {
      console.log('[StudentDashboard] Error saving map click selection:', err);
    }

    setLocationModalVisible(false);
    await loadShifts(true);
    if (showToast) {
      showToast(`Đã cập nhật vị trí tìm việc: ${addressName}`, 'success');
    }
  };

  const handleMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.lat && data.lng) {
        setTempCoords({ lat: data.lat, lng: data.lng });
      }
    } catch (e) {
      console.log('[LocationModal Map Message Error]:', e);
    }
  };

  const handleConfirmLocation = async () => {
    await handleMapSelectLocation(tempCoords.lat, tempCoords.lng);
  };

  const handleSearchAddress = async () => {
    if (!searchText.trim()) return;
    try {
      setSearchLoading(true);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=1`, {
        headers: {
          'User-Agent': 'ProxiJobApp/1.0'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setMapCenter({ lat, lng });
          setTempCoords({ lat, lng });
        } else {
          if (showToast) {
            showToast('Không tìm thấy địa điểm này!', 'warning');
          }
        }
      }
    } catch (err) {
      console.log('[Search Address Error]:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchTextChange = async (text) => {
    setSearchText(text);
    if (text.length < 4) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

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
            lon: parseFloat(item.lon)
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
  };

  const handleSelectSuggestion = async (suggestion) => {
    setSearchText(suggestion.display_name);
    setAddressSuggestions([]);
    setShowSuggestions(false);

    try {
      if (suggestion.isGoogle && GOOGLE_MAPS_API_KEY) {
        setSearchLoading(true);
        const response = await fetch(
          `https://rsapi.goong.io/Place/Detail?place_id=${suggestion.place_id}&api_key=${GOOGLE_MAPS_API_KEY}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.result && data.result.geometry) {
            const lat = data.result.geometry.location.lat;
            const lng = data.result.geometry.location.lng;
            setMapCenter({ lat, lng });
            setTempCoords({ lat, lng });
          }
        }
      } else if (suggestion.lat && suggestion.lon) {
        setMapCenter({ lat: suggestion.lat, lng: suggestion.lon });
        setTempCoords({ lat: suggestion.lat, lng: suggestion.lon });
      }
    } catch (err) {
      console.log('Error fetching suggestion details:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setGpsLoading(true);
      if (showToast) {
        showToast('Đang quét GPS độ chính xác cao...', 'info');
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (showToast) {
          showToast('Không có quyền truy cập GPS. Vui lòng cho phép định vị.', 'warning');
        }
        setGpsLoading(false);
        return;
      }

      const geoPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (geoPosition && geoPosition.coords) {
        const { latitude, longitude } = geoPosition.coords;
        await handleMapSelectLocation(latitude, longitude);
      }
    } catch (error) {
      console.log('Error getting current location:', error);
      if (showToast) {
        showToast('Lỗi khi lấy vị trí GPS từ thiết bị.', 'error');
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShifts(true);
    setRefreshing(false);
  }, [loadShifts]);


  useEffect(() => {
    const loadAddressAndProfile = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem('@student_profile_address');
        if (savedAddress) {
          setProfileAddress(savedAddress);
          isProfileAddressSetRef.current = true;
        }

        if (user && user.role === 'student') {
          const { getStudentProfileApi } = require('../../api/studentApi');
          const profileData = await getStudentProfileApi();
          if (profileData) {
            if (profileData.address) {
              setProfileAddress(profileData.address);
              isProfileAddressSetRef.current = true;
              await AsyncStorage.setItem('@student_profile_address', profileData.address);
            }
            if (profileData.latitude && profileData.longitude) {
              const coords = { latitude: profileData.latitude, longitude: profileData.longitude };
              await AsyncStorage.setItem('@student_custom_gps', JSON.stringify(coords));
              if (setStudentCoords) {
                setStudentCoords(coords);
              }
            }

            // Sync user state in context
            const cleanAvatar = profileData.avatarUrl && profileData.avatarUrl !== 'string' && profileData.avatarUrl !== 'null' ? profileData.avatarUrl : '';
            if (user && setUser && (user.avatarUrl !== cleanAvatar || user.gender !== profileData.gender)) {
              const updatedUser = { ...user, avatarUrl: cleanAvatar, gender: profileData.gender };
              setUser(updatedUser);
              try {
                const { saveAuthSession, getStoredToken, getStoredRefreshToken } = require('../../api/auth');
                const token = await getStoredToken();
                const refreshToken = await getStoredRefreshToken();
                await saveAuthSession(token, refreshToken, updatedUser);
              } catch (err) {
                console.log('[StudentDashboard] Error saving session during background profile sync:', err);
              }
            }
          }
        }
      } catch (e) {
        console.log('[StudentDashboard] Error loading profile address:', e);
      }
    };
    loadAddressAndProfile();
  }, [user]);

  // Geocode coords back into a text label for initial load/Guest
  useEffect(() => {
    const reverseGeocodeCoords = async () => {
      if (!studentCoords || !studentCoords.latitude || !studentCoords.longitude) return;
      if (isProfileAddressSetRef.current) return;

      if (studentCoords.latitude === 10.7769 && studentCoords.longitude === 106.7009) {
        setProfileAddress("Q. 1, TP.HCM (mặc định)");
        return;
      }

      let addressName = `${studentCoords.latitude.toFixed(4)}, ${studentCoords.longitude.toFixed(4)}`;
      let success = false;

      if (GOOGLE_MAPS_API_KEY) {
        try {
          const response = await fetch(
            `https://rsapi.goong.io/Geocode?latlng=${studentCoords.latitude},${studentCoords.longitude}&api_key=${GOOGLE_MAPS_API_KEY}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'OK' && data.results && data.results.length > 0) {
              addressName = cleanAddress(data.results[0].formatted_address);
              success = true;
            }
          }
        } catch (e) {
          console.log('[StudentDashboard] Initial load Goong reverse geocode error, falling back to OSM:', e);
        }
      }

      if (!success) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${studentCoords.latitude}&lon=${studentCoords.longitude}&format=json`, {
            headers: {
              'User-Agent': 'ProxiJobApp/1.0'
            }
          });
          if (response.ok) {
            const data = await response.json();
            const displayName = data.display_name || '';
            const addressVal = data.address?.road || data.address?.suburb || data.address?.quarter || data.address?.city_district || displayName.split(',')[0] || 'Vị trí hiện tại';
            const cityVal = data.address?.city || data.address?.town || data.address?.state || '';
            addressName = cityVal ? `${addressVal}, ${cityVal}` : addressVal;
          }
        } catch (err) {
          console.log('[StudentDashboard] Initial load OSM geocode error:', err);
        }
      }

      setProfileAddress(addressName);
    };

    reverseGeocodeCoords();
  }, [studentCoords]);

  // Reset page when search query or radius changes, skipping initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, radius]);

  // Distance processor
  const processedShifts = (shifts || []).map(shift => {
    if (!shift.latitude || !shift.longitude || (shift.latitude === 0 && shift.longitude === 0)) {
      return { ...shift, distanceKm: Infinity, noGps: true };
    }
    const distMeters = getDistanceInMeters(
      studentCoords.latitude,
      studentCoords.longitude,
      shift.latitude,
      shift.longitude
    );
    const distKm = parseFloat((distMeters / 1000).toFixed(1));
    return { ...shift, distanceKm: distKm, noGps: false };
  });

  // Find the absolute newest creation date in processedShifts
  const dates = processedShifts
    .map(s => s.createdAt && typeof s.createdAt === 'string' ? s.createdAt.split('T')[0] : '')
    .filter(Boolean);
  const newestDate = dates.length > 0 ? dates.sort().reverse()[0] : '';

  // Helper to sort shifts:
  // - Emergency shifts on the newest date go to the absolute top.
  // - Otherwise, sort by date descending (newest date first).
  // - If same date, and it is the newest date, prioritize emergency shifts.
  // - Otherwise, sort by creation time descending.
  const compareShifts = (a, b) => {
    const dateA = a.createdAt && typeof a.createdAt === 'string' ? a.createdAt.split('T')[0] : '';
    const dateB = b.createdAt && typeof b.createdAt === 'string' ? b.createdAt.split('T')[0] : '';

    const isNewestEmergencyA = a.isEmergency && dateA === newestDate;
    const isNewestEmergencyB = b.isEmergency && dateB === newestDate;

    if (isNewestEmergencyA && !isNewestEmergencyB) return -1;
    if (!isNewestEmergencyA && isNewestEmergencyB) return 1;

    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }

    if (dateA === newestDate) {
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;
    }

    const timeA = new Date(a.createdAt || a.startTime || 0).getTime();
    const timeB = new Date(b.createdAt || b.startTime || 0).getTime();
    return timeB - timeA;
  };

  // Dynamic filter query
  const filteredShifts = processedShifts
    .filter(shift => {
      const matchRadius = shift.noGps || radius === 999.0 || shift.distanceKm <= radius;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (shift.title || '').toLowerCase().includes(q) ||
        (shift.shopName || '').toLowerCase().includes(q);

      let matchCategory = true;
      if (selectedCategoryFilter) {
        const categoryName = shift.categoryName || shift.shopName || '';
        matchCategory = categoryName.trim().toLowerCase().includes(selectedCategoryFilter.toLowerCase());
      }

      return matchRadius && matchQuery && matchCategory;
    })
    .sort(compareShifts);

  const closestShift = filteredShifts.filter(s => !s.noGps).length > 0
    ? filteredShifts.filter(s => !s.noGps)[0]
    : null;

  const totalPages = Math.ceil(filteredShifts.length / ITEMS_PER_PAGE);
  const paginatedShifts = filteredShifts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


  const renderMapView = () => {
    const lat = studentCoords?.latitude || 10.7769;
    const lng = studentCoords?.longitude || 106.7009;

    const shiftsData = filteredShifts
      .filter(s => s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0)
      .map(s => ({
        id: s.id,
        title: s.title,
        shopName: s.shopName,
        latitude: s.latitude,
        longitude: s.longitude,
        hourlyRate: s.hourlyRate
      }));

    const mapHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          /* Custom user position marker circle with pulsing effect */
          .user-marker {
            background-color: #FF6B00;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            box-shadow: 0 0 12px rgba(255, 107, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 11px;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255, 107, 0, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 0, 0); }
          }
          /* Job markers styling */
          .job-marker {
            border: 1.5px solid #FFFFFF;
            border-radius: 12px;
            padding: 3px 6px;
            font-weight: 800;
            font-size: 9px;
            color: #FFFFFF;
            box-shadow: 0 3px 8px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false, tap: false }).setView([${lat}, ${lng}], 15);
          L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { attribution: 'Google Maps' }).addTo(map);

          L.control.zoom({ position: 'bottomright' }).addTo(map);

          // Add user current position marker
          var userIcon = L.divIcon({
            className: 'user-marker-container',
            html: '<div class="user-marker">🎓</div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          var userMarker = L.marker([${lat}, ${lng}], { icon: userIcon }).addTo(map);
          userMarker.bindPopup("<b>Vị trí của bạn</b><br/>Tập trung quét ca làm việc quanh đây.");

          // Render job markers
          var shifts = ${JSON.stringify(shiftsData)};
          
          shifts.forEach(function(shift) {
            var pinBg = '#FF6B00'; // Default orange
            var icon = '☕';
            var t = (shift.title || '').toLowerCase();
            var s = (shift.shopName || '').toLowerCase();

            if (t.includes('giao hàng') || t.includes('shipper') || t.includes('delivery')) {
              pinBg = '#7C3AED'; // Purple
              icon = '📦';
            } else if (t.includes('bán hàng') || s.includes('winmart') || s.includes('mart') || s.includes('store') || s.includes('siêu thị')) {
              pinBg = '#EF4444'; // Red
              icon = '🛍️';
            }

            var rate = shift.hourlyRate ? (shift.hourlyRate / 1000).toFixed(0) + 'k/h' : '30k/h';
            var markerHtml = '<div class="job-marker" style="background-color: ' + pinBg + ';">' + icon + ' ' + shift.shopName.substring(0,12) + ' • ' + rate + '</div>';

            var jobIcon = L.divIcon({
              className: 'job-marker-container',
              html: markerHtml,
              iconSize: [110, 22],
              iconAnchor: [55, 11]
            });

            var marker = L.marker([shift.latitude, shift.longitude], { icon: jobIcon }).addTo(map);
            
            var popupContent = '<div style="font-family: sans-serif; font-size:12px; line-height: 1.4; min-width: 140px;">' +
                               '<b style="color:#1E293B; font-size:13px;">' + shift.title + '</b><br/>' +
                               '<span style="color:#64748B;">' + shift.shopName + '</span><br/>' +
                               '<b style="color:#EA580C; display:inline-block; margin-top:4px;">Lương: ' + shift.hourlyRate.toLocaleString("vi-VN") + ' đ/h</b><br/>' +
                               '<button onclick="viewJobDetails(' + shift.id + ')" style="margin-top:8px; width:100%; padding:6px; background-color:#FF6B00; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; font-size:11px;">Xem chi tiết ⚡</button>' +
                               '</div>';

            marker.bindPopup(popupContent);
          });

          window.viewJobDetails = function(id) {
            var payload = JSON.stringify({ type: 'view_job', shiftId: id });
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(payload);
            } else {
              window.parent.postMessage(payload, '*');
            }
          };

          map.on('click', function(e) {
            var payload = JSON.stringify({ type: 'select_location', lat: e.latlng.lat, lng: e.latlng.lng });
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(payload);
            } else {
              window.parent.postMessage(payload, '*');
            }
          });
        </script>
      </body>
      </html>
    `;

    return (
      <View style={styles.mapViewContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Interactive Job Map"
          />
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'view_job') {
                  navigateTo('job_detail', { shiftId: data.shiftId });
                } else if (data.type === 'select_location') {
                  handleMapSelectLocation(data.lat, data.lng);
                }
              } catch (e) {
                console.log('[WebView message parsing error]:', e);
              }
            }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}

        {/* Floating locator button */}
        <TouchableOpacity
          style={styles.gpsFloatingButton}
          onPress={handleGetCurrentLocation}
          disabled={gpsLoading}
          activeOpacity={0.8}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="locate" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.gpsFloatingText}>Định vị GPS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const getGpsLabel = () => {
    if (profileAddress) {
      return profileAddress;
    }
    if (studentCoords.latitude === 10.7769 && studentCoords.longitude === 106.7009) {
      return "Q. 1, TP.HCM (mặc định)";
    }
    return `${studentCoords.latitude.toFixed(4)}, ${studentCoords.longitude.toFixed(4)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.gpsIndicator}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.gpsText} numberOfLines={1} ellipsizeMode="tail">{getGpsLabel()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.availabilityPill,
              isAvailable ? styles.availabilityPillActive : styles.availabilityPillInactive,
            ]}
            onPress={handleToggleAvailability}
            activeOpacity={0.85}
            disabled={availabilityLoading}
          >
            <View style={styles.availabilityPillContent}>
              <View style={[styles.availabilityDot, { backgroundColor: isAvailable ? '#22C55E' : '#94A3B8' }]} />
              <Text style={[styles.availabilityPillLabel, { color: isAvailable ? '#166534' : '#475569' }]}>
                {isAvailable ? 'Sẵn sàng nhận việc' : 'Chưa sẵn sàng'}
              </Text>
              {availabilityLoading && (
                <ActivityIndicator size="small" color={isAvailable ? '#166534' : '#475569'} style={{ marginLeft: 6 }} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerSubControlRow}>
          {/* View mode toggle - List vs Map */}
          <View style={styles.viewToggleSegmented}>
            <TouchableOpacity
              style={[styles.toggleSegmentBtn, viewMode === 'list' && styles.activeSegmentBtn]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.7}
            >
              <Ionicons name="list-outline" size={14} color={viewMode === 'list' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 4 }} />
              <Text style={[styles.segmentBtnText, viewMode === 'list' && styles.activeSegmentBtnText]}>Danh sách</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleSegmentBtn, viewMode === 'map' && styles.activeSegmentBtn]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={14} color={viewMode === 'map' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 4 }} />
              <Text style={[styles.segmentBtnText, viewMode === 'map' && styles.activeSegmentBtnText]}>Bản đồ Radar</Text>
            </TouchableOpacity>
          </View>

          {/* Search Radius chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusChipsScroll}>
            <TouchableOpacity
              style={[styles.radiusChip, radius === 999.0 && styles.radiusChipActive]}
              onPress={() => setRadius(999.0)}
            >
              <Text style={[styles.radiusChipText, radius === 999.0 && styles.radiusChipTextActive]}>Tất cả</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radiusChip, radius === 3.0 && styles.radiusChipActive]}
              onPress={() => setRadius(3.0)}
            >
              <Text style={[styles.radiusChipText, radius === 3.0 && styles.radiusChipTextActive]}>3km</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radiusChip, radius === 5.0 && styles.radiusChipActive]}
              onPress={() => setRadius(5.0)}
            >
              <Text style={[styles.radiusChipText, radius === 5.0 && styles.radiusChipTextActive]}>5km</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radiusChip, radius === 10.0 && styles.radiusChipActive]}
              onPress={() => setRadius(10.0)}
            >
              <Text style={[styles.radiusChipText, radius === 10.0 && styles.radiusChipTextActive]}>10km</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Category Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilterScroll}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategoryFilter && styles.categoryChipActive
            ]}
            onPress={() => {
              setSelectedCategoryFilter(null);
              setCurrentPage(1);
            }}
          >
            <Text style={[
              styles.categoryChipText,
              !selectedCategoryFilter && styles.categoryChipTextActive
            ]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.filter(c => c.id !== 9999).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategoryFilter === cat.name && styles.categoryChipActive
              ]}
              onPress={() => {
                setSelectedCategoryFilter(cat.name);
                setCurrentPage(1);
              }}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategoryFilter === cat.name && styles.categoryChipTextActive
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {viewMode === 'list' ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.student]}
              tintColor={theme.colors.student}
            />
          }
        >
          {closestShift && (
            <View style={[styles.closestShiftBanner, { marginHorizontal: 0, marginTop: 4, marginBottom: 12 }]}>
              <Ionicons name="compass-outline" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.closestShiftBannerText}>
                Ca làm gần nhất: <Text style={{ fontWeight: 'bold' }}>{closestShift.title}</Text> ({closestShift.shopName}) cách bạn chỉ <Text style={{ fontWeight: 'bold', color: theme.colors.student }}>{closestShift.distanceKm} km</Text>!
              </Text>
            </View>
          )}
          {filteredShifts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.colors.textLight} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Không tìm thấy ca làm việc nào trong bán kính {radius === 999.0 ? 'Tất cả' : `${radius}km`}.</Text>
              <Text style={styles.emptySub}>Hãy tăng phạm vi tìm kiếm hoặc bấm nút bên dưới để xem toàn bộ ca làm nhé!</Text>
              {radius !== 999.0 && (
                <TouchableOpacity
                  style={styles.showAllBtn}
                  onPress={() => setRadius(999.0)}
                >
                  <Text style={styles.showAllBtnText}>Xem tất cả ca làm</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {paginatedShifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  navigateTo={navigateTo}
                />
              ))}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? '#94A3B8' : '#FF6B00'} />
                    <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Trước</Text>
                  </TouchableOpacity>

                  <View style={styles.pageIndicator}>
                    <Text style={styles.pageIndicatorText}>
                      Trang <Text style={{ fontWeight: 'bold', color: '#FF6B00' }}>{currentPage}</Text> / {totalPages}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>Sau</Text>
                    <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? '#94A3B8' : '#FF6B00'} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        renderMapView()
      )}
      {/* Location Picker Modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%', paddingBottom: 20 }]}>
            <View style={styles.modalDragBar} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalShopName}>VỊ TRÍ TÌM VIỆC</Text>
                <Text style={[styles.modalJobTitle, { fontSize: 18, marginBottom: 0 }]}>Chọn vị trí hiện tại của bạn</Text>
              </View>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal search address input with suggestions overlay */}
            <View style={{ zIndex: 9999, position: 'relative' }}>
              <View style={styles.modalSearchRow}>
                <TextInput
                  placeholder="Nhập địa chỉ hoặc khu vực..."
                  placeholderTextColor="#94A3B8"
                  value={searchText}
                  onChangeText={handleSearchTextChange}
                  style={styles.modalSearchInput}
                  onSubmitEditing={handleSearchAddress}
                />
                <TouchableOpacity
                  onPress={handleSearchAddress}
                  style={styles.modalSearchBtn}
                  disabled={searchLoading}
                >
                  {searchLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="search" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              {showSuggestions && addressSuggestions.length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 50,
                  left: 16,
                  right: 16,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                  maxHeight: 180,
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

            {/* Interactive Leaflet Map */}
            <View style={styles.modalMapWrapper}>
              <WebView
                originWhitelist={['*']}
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                      <style>
                        body { margin: 0; padding: 0; }
                        #map { height: 100vh; width: 100vw; }
                        .center-pin {
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform: translate(-50%, -100%);
                          z-index: 1000;
                          pointer-events: none;
                        }
                      </style>
                    </head>
                    <body>
                      <div id="map"></div>
                      <div class="center-pin">
                        <img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" style="width: 32px; height: 32px;" />
                      </div>
                      <script>
                        var map = L.map('map', { zoomControl: true, tap: false }).setView([${mapCenter.lat}, ${mapCenter.lng}], 15);
                        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { attribution: 'Google Maps' }).addTo(map);

                        function sendCoords(lat, lng) {
                          var payload = JSON.stringify({ lat: lat, lng: lng });
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(payload);
                          } else {
                            window.parent.postMessage(payload, '*');
                          }
                        }

                        map.on('moveend', function() {
                          var center = map.getCenter();
                          sendCoords(center.lat, center.lng);
                        });

                        map.on('click', function(e) {
                          map.panTo(e.latlng);
                        });
                      </script>
                    </body>
                    </html>
                  `
                }}
                onMessage={handleMapMessage}
                style={{ flex: 1 }}
              />
            </View>

            {/* Confirm button */}
            <View style={styles.modalMapFooter}>
              <TouchableOpacity
                onPress={handleConfirmLocation}
                style={styles.modalConfirmBtn}
              >
                <Text style={styles.modalConfirmBtnText}>📍 Xác nhận vị trí này</Text>
              </TouchableOpacity>
            </View>

            {/* Quick selection scroll */}
            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
              <Text style={styles.sectionHeaderInsideModal}>Chọn nhanh khu vực phổ biến</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickLocationScroll}
                contentContainerStyle={styles.quickLocationContent}
              >
                <TouchableOpacity
                  style={[styles.quickLocationChip, studentCoords.latitude === 10.7769 && styles.quickLocationChipActive]}
                  onPress={() => handleSelectLocation(10.7769, 106.7009, 'Q. 1, TP.HCM')}
                >
                  <Text style={[styles.quickLocationChipText, studentCoords.latitude === 10.7769 && styles.quickLocationChipTextActive]}>Quận 1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickLocationChip, studentCoords.latitude === 10.7828 && styles.quickLocationChipActive]}
                  onPress={() => handleSelectLocation(10.7828, 106.6958, 'Quận 3')}
                >
                  <Text style={[styles.quickLocationChipText, studentCoords.latitude === 10.7828 && styles.quickLocationChipTextActive]}>Quận 3</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickLocationChip, studentCoords.latitude === 10.8016 && styles.quickLocationChipActive]}
                  onPress={() => handleSelectLocation(10.8016, 106.7118, 'Bình Thạnh')}
                >
                  <Text style={[styles.quickLocationChipText, studentCoords.latitude === 10.8016 && styles.quickLocationChipTextActive]}>Bình Thạnh</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickLocationChip, studentCoords.latitude === 10.8244 && styles.quickLocationChipActive]}
                  onPress={() => handleSelectLocation(10.8244, 106.6631, 'Gò Vấp')}
                >
                  <Text style={[styles.quickLocationChipText, studentCoords.latitude === 10.8244 && styles.quickLocationChipTextActive]}>Gò Vấp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickLocationChip, studentCoords.latitude === 10.8746 && styles.quickLocationChipActive]}
                  onPress={() => handleSelectLocation(10.8746, 106.8029, 'Thủ Đức')}
                >
                  <Text style={[styles.quickLocationChipText, studentCoords.latitude === 10.8746 && styles.quickLocationChipTextActive]}>Thủ Đức</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '0A',
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.primary + '22',
    flex: 1,
  },
  gpsSymbol: {
    fontSize: 12,
    marginRight: 4,
  },
  gpsText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
    flexShrink: 1,
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 10,
    flex: 1,
  },
  availabilityPillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  availabilityPillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  availabilityPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  availabilityPillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerSubControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  viewToggleSegmented: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
    alignItems: 'center',
    height: 32,
  },
  toggleSegmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 8,
    height: 28,
  },
  activeSegmentBtn: {
    backgroundColor: '#FF6B00',
  },
  segmentBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  activeSegmentBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  radiusChipsScroll: {
    gap: 4,
    alignItems: 'center',
  },
  radiusChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    height: 28,
    justifyContent: 'center',
  },
  radiusChipActive: {
    backgroundColor: '#FF6B0015',
    borderColor: '#FF6B00',
  },
  radiusChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  radiusChipTextActive: {
    color: '#FF6B00',
    fontWeight: '700',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sliderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.student,
  },
  sliderTrackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 2,
    marginBottom: theme.spacing.md,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeRadius: {
    backgroundColor: theme.colors.student,
  },
  radiusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  activeRadiusText: {
    color: theme.colors.white,
  },
  viewToggle: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeToggle: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.student,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  activeToggleText: {
    color: theme.colors.student,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 110,
  },
  cardShadowContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  cardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 20,
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoAndName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  shopLogoText: {
    fontSize: 15,
    fontWeight: '800',
  },
  shopRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  shopRatingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobTypeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  jobTypeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  emergencyTag: {
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appliedStatusTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  appliedStatusTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  approvedStatusTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  approvedStatusTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  jobTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
    lineHeight: 22,
  },
  shopSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeInfoText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  addressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  addressInfoText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  salaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EA580C',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  radarCircleBig: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: theme.colors.student + '22',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    position: 'relative',
  },
  radarCircleMedium: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: theme.colors.student + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircleSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: theme.colors.student + '44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.student,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  userEmoji: {
    fontSize: 11,
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.student,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyPin: {
    borderColor: theme.colors.danger,
  },
  pinIcon: {
    fontSize: 14,
  },
  pinLabel: {
    marginTop: 2,
    paddingHorizontal: 4,
  },
  pinLabelText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.text,
    maxWidth: 60,
  },
  radarTip: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 30 : theme.spacing.lg,
  },
  modalDragBar: {
    width: 40,
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginVertical: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  modalShopName: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: theme.colors.textMuted,
    fontWeight: 'bold',
  },
  modalScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  modalEmergencyHeader: {
    backgroundColor: theme.colors.danger + '1A',
    borderColor: theme.colors.danger + '33',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  modalEmergencyText: {
    color: theme.colors.danger,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalJobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalPaySection: {
    backgroundColor: theme.colors.success + '0A',
    borderColor: theme.colors.success + '22',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  modalPayLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  modalPayValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
    marginRight: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: 6,
  },
  descriptionBody: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
  modalFooter: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalApplyBtn: {
    backgroundColor: theme.colors.student,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.student,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modalAppliedBtn: {
    backgroundColor: theme.colors.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalApprovedBtn: {
    backgroundColor: theme.colors.success,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalApplyBtnText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  applyTip: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  closestShiftBanner: {
    backgroundColor: '#FF6B000F',
    borderColor: '#FF6B0022',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closestShiftBannerText: {
    fontSize: 12,
    color: '#5A4136',
    textAlign: 'center',
  },
  showAllBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.student,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  showAllBtnText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  /* Map View Mode Styles */
  mapViewContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    position: 'relative',
    marginBottom: Platform.OS === 'ios' ? 110 : 100,
  },
  gpsFloatingButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#FF6B00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 999,
  },
  gpsFloatingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mapImageBackground: {
    width: '100%',
    height: 460,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  mapEmptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapEmptyText: {
    color: '#64748B',
    fontWeight: 'bold',
  },
  mapMarkerContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  mapPinDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mapPinLabelContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mapPinLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: 110,
  },
  /* Top Unified Search Styles */
  /* Removed Top Unified Search Styles for cleaner layout */
  guestButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E9EB',
    backgroundColor: '#FFFFFF',
  },
  guestButtonText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFEBE0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  pageBtnDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    shadowOpacity: 0,
    elevation: 0,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginHorizontal: 4,
  },
  pageBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageIndicator: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  pageIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  categoryFilterScroll: {
    marginTop: 10,
    marginBottom: 2,
  },
  categoryFilterContent: {
    paddingRight: 16,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    height: 30,
    justifyContent: 'center',
    marginRight: 4,
  },
  categoryChipActive: {
    backgroundColor: '#FF6B0015',
    borderColor: '#FF6B00',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FF6B00',
    fontWeight: '700',
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
  },
  modalSearchBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMapWrapper: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  modalMapFooter: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  modalConfirmBtn: {
    height: 44,
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionHeaderInsideModal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  quickLocationScroll: {
    marginVertical: 4,
  },
  quickLocationContent: {
    gap: 6,
    alignItems: 'center',
  },
  quickLocationChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 6,
    height: 28,
    justifyContent: 'center',
  },
  quickLocationChipActive: {
    backgroundColor: '#FF6B0015',
    borderColor: '#FF6B00',
  },
  quickLocationChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  quickLocationChipTextActive: {
    color: '#FF6B00',
    fontWeight: '700',
  },
});
