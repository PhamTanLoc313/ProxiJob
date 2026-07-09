import React, { useContext, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppProvider, AppContext } from "./src/context/AppContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme } from "./src/styles/theme";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import MainTabNavigator from "./src/navigation/MainTabNavigator";
import Toast from "./src/components/Toast";
import { Ionicons } from "@expo/vector-icons";

import { getAvatarSource, isValidAvatar } from "./src/utils/avatarHelper";
import { getJobPostQuotaApi } from "./src/api/auth";

const cacheBuster = Date.now();
const queryClient = new QueryClient();

function MainAppShell() {
  const {
    user,
    logout,
    notifications,
    isRestoringSession,
    currentScreen,
    isEnterprise,
    navigateTo,
    showToast,
    goBack,
    isChatRoomActive,
  } = useContext(AppContext);

  const getHeaderTitle = (screen) => {
    return null;
  };
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [quota, setQuota] = useState(null);

  const toggleAvatarMenu = async () => {
    const nextState = !avatarMenuOpen;
    setAvatarMenuOpen(nextState);
    if (nextState) {
      setNotifModalVisible(false); // Close notification dropdown if open
    }
    if (nextState && user && user.role !== "student") {
      try {
        const q = await getJobPostQuotaApi();
        if (q) setQuota(q);
      } catch (err) {
        console.log("Failed to fetch quota:", err);
      }
    }
  };

  if (isRestoringSession) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    const guestAllowedScreens = ["student_dashboard", "job_detail"];
    if (!guestAllowedScreens.includes(currentScreen)) {
      if (currentScreen === "register") {
        return <RegisterScreen />;
      } else if (currentScreen === "forgot_password") {
        return <ForgotPasswordScreen />;
      } else {
        return <LoginScreen />;
      }
    }
  }

  // Count unread notifications
  const unreadNotifsCount = user ? notifications.filter((n) => !n.read).length : 0;
  const isStudent = !user || user.role === "student";

  const tier = user?.subscriptionTier?.toLowerCase() || '';
  const hasStandard = tier === 'hrm basic' || tier === 'enterprise' || tier === 'standard' || tier === 'premium';

  const hideHeaderScreens = ["candidate_list", "payment_qr", "upgrade_package", "student_upgrade", "employer_emergency_post"];
  const showHeader = !hideHeaderScreens.includes(currentScreen) && !isChatRoomActive;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style="dark" />
      {(avatarMenuOpen || notifModalVisible) && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            setAvatarMenuOpen(false);
            setNotifModalVisible(false);
          }}
        />
      )}
      {showHeader && (
        <SafeAreaView
          edges={["top"]}
          style={{
            backgroundColor: "#FFFFFF",
            zIndex: 999,
            position: "relative",
          }}
        >
          {/* Universal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {(currentScreen === "job_detail" || currentScreen === "upgrade_package" || currentScreen === "payment_qr" || (currentScreen === "employer_profile" && hasStandard)) && (
                <TouchableOpacity
                  style={{ marginRight: 8, paddingVertical: 4, paddingRight: 4 }}
                  onPress={goBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color="#FF6B00" />
                </TouchableOpacity>
              )}
              {getHeaderTitle(currentScreen) ? (
                <Text style={styles.headerTitleText}>{getHeaderTitle(currentScreen)}</Text>
              ) : (
                <>
                  <Image
                    source={require("./src/img/logoproxijobcamden.png")}
                    style={styles.headerLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.headerBrandText}>ProxiJob</Text>
                </>
              )}
            </View>

            <View style={styles.headerRight}>
              {user ? (
                <>
                  {/* Notification Button */}
                  <TouchableOpacity
                    style={styles.bellButton}
                    onPress={() => {
                      setNotifModalVisible(!notifModalVisible);
                      setAvatarMenuOpen(false); // Close avatar dropdown if open
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={unreadNotifsCount > 0 ? "notifications" : "notifications-outline"} size={22} color="#F59E0B" />
                    {unreadNotifsCount > 0 && (
                      <View style={styles.bellBadge}>
                        <Text style={styles.bellBadgeText}>{unreadNotifsCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
 
                  {/* Avatar Button */}
                  <TouchableOpacity
                    style={[styles.avatarTouch, isStudent ? styles.studentAvatarRing : styles.employerAvatarRing]}
                    onPress={toggleAvatarMenu}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={getAvatarSource(user?.avatarUrl, user?.gender, user?.name)}
                      style={[styles.headerAvatar, { borderWidth: 0 }]}
                    />
                    {!isStudent && isEnterprise && (
                      <View style={styles.crownBadge}>
                        <Text style={styles.crownIcon}>👑</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.loginHeaderBtn}
                  onPress={() => navigateTo('login')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in-outline" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.loginHeaderBtnText}>Đăng nhập</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* Avatar Dropdown Menu */}
      {avatarMenuOpen && (
        <View style={styles.dropdownMenu}>
          {/* Caret pointing up to Avatar */}
          <View style={{
            position: 'absolute',
            top: -8,
            right: 22,
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: 8,
            borderRightWidth: 8,
            borderBottomWidth: 8,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#FFFFFF',
          }} />
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeDropdownBtn}
            onPress={() => setAvatarMenuOpen(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.closeDropdownText}>✕</Text>
          </TouchableOpacity>

          {/* Section 1: Current Plan */}
          <View style={styles.dropdownSection1}>
            <Text style={styles.dropdownStoreName}>
              {isStudent ? (user?.name || "Sinh viên") : (user?.name || "Doanh nghiệp")}
            </Text>
            <Text style={styles.dropdownEmail}>
              {isStudent ? (user?.email || "student@proxijob.test") : (user?.email || "business@proxijob.test")}
            </Text>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>
                {isStudent ? "Vai trò:" : "Gói dịch vụ:"}
              </Text>
              <View style={
                isStudent 
                  ? styles.studentPill 
                  : (!user?.subscriptionTier || user.subscriptionTier === 'None' || user.subscriptionTier === '')
                    ? { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }
                    : (user.subscriptionTier.toLowerCase() === 'recruit' || user.subscriptionTier.toLowerCase() === 'pershift')
                      ? { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }
                      : (user.subscriptionTier.toLowerCase() === 'hrm basic' || user.subscriptionTier.toLowerCase() === 'standard')
                        ? { backgroundColor: '#FAF5FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }
                        : styles.enterprisePill
              }>
                <Text style={
                  isStudent 
                    ? styles.studentPillText 
                    : (!user?.subscriptionTier || user.subscriptionTier === 'None' || user.subscriptionTier === '')
                      ? { color: '#64748B', fontSize: 11, fontWeight: '800' }
                      : (user.subscriptionTier.toLowerCase() === 'recruit' || user.subscriptionTier.toLowerCase() === 'pershift')
                        ? { color: '#059669', fontSize: 11, fontWeight: '800' }
                        : (user.subscriptionTier.toLowerCase() === 'hrm basic' || user.subscriptionTier.toLowerCase() === 'standard')
                          ? { color: '#7C3AED', fontSize: 11, fontWeight: '800' }
                          : styles.enterprisePillText
                }>
                  {(() => {
                    if (isStudent) return "Sinh viên";
                    const tierName = user?.subscriptionTier || "None";
                    const lowerTier = tierName.toLowerCase();
                    if (lowerTier === 'none' || lowerTier === 'free' || lowerTier === '') {
                      return "Chưa đăng ký";
                    }
                    
                    const remaining = quota 
                      ? quota.jobPostsRemaining 
                      : (user?.jobPostLimit !== undefined && user?.jobPostsUsed !== undefined)
                        ? Math.max(0, user.jobPostLimit - user.jobPostsUsed)
                        : (lowerTier === 'pershift' ? 1 : lowerTier === 'recruit' || lowerTier === 'basic' ? 30 : 999);
                    
                    let vietnameseName = tierName;
                    if (lowerTier === 'pershift') {
                      vietnameseName = 'Gói đăng ca lẻ';
                    } else if (lowerTier === 'recruit') {
                      vietnameseName = 'Tuyển dụng';
                    } else if (lowerTier === 'hrm basic' || lowerTier === 'standard') {
                      vietnameseName = 'HRM Cơ bản';
                    } else if (lowerTier === 'enterprise' || lowerTier === 'premium') {
                      vietnameseName = 'Doanh nghiệp';
                    } else if (lowerTier === 'trial') {
                      vietnameseName = 'Dùng thử';
                    }
                    
                    if (lowerTier === 'pershift') {
                      return `Đăng ca lẻ (Còn ${remaining} lượt)`;
                    }
                    return `${vietnameseName} (Còn ${remaining} lượt)`;
                  })()}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2: All Packages */}
          {!isStudent && (
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.6}
              onPress={() => {
                setAvatarMenuOpen(false);
                navigateTo("upgrade_package");
              }}
            >
              <Ionicons name="grid-outline" size={18} color="#64748B" style={styles.dropdownItemIcon} />
              <Text style={styles.dropdownItemText}>Xem các gói dịch vụ</Text>
            </TouchableOpacity>
          )}

          {/* Section 3: Store Profile */}
          {!isStudent && (
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.6}
              onPress={() => {
                setAvatarMenuOpen(false);
                navigateTo("employer_profile");
              }}
            >
              <Ionicons name="storefront-outline" size={18} color="#64748B" style={styles.dropdownItemIcon} />
              <Text style={styles.dropdownItemText}>Profile của quán</Text>
            </TouchableOpacity>
          )}

          {/* Section 4: Sign Out */}
          <View style={styles.dropdownDivider} />

          <TouchableOpacity
            style={[styles.dropdownItem, { paddingBottom: 2 }]}
            activeOpacity={0.6}
            onPress={() => {
              setAvatarMenuOpen(false);
              logout();
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={styles.dropdownItemIcon} />
            <Text style={[styles.dropdownItemText, { color: "#EF4444" }]}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification Dropdown Menu */}
      {notifModalVisible && (
        <View style={[styles.dropdownMenu, { width: 290 }]}>
          {/* Caret pointing up to Bell */}
          <View style={{
            position: 'absolute',
            top: -8,
            right: 67, // Points directly to the center of the bell button
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: 8,
            borderRightWidth: 8,
            borderBottomWidth: 8,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#FFFFFF',
          }} />
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications-outline" size={16} color="#1E293B" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>
                Thông báo Hệ thống
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setNotifModalVisible(false)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#F1F5F9',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Ionicons name="close" size={12} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Notification List inside ScrollView */}
          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                  Không có thông báo mới.
                </Text>
              </View>
            ) : (
              notifications.map((notif) => (
                <View key={notif.id} style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, backgroundColor: '#F8FAFC', borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: '#F1F5F9' }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#FF6B001A', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                    <Ionicons name="notifications-outline" size={14} color="#FF6B00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E293B' }}>{notif.title}</Text>
                      <Text style={{ fontSize: 9, color: '#94A3B8', fontWeight: '600' }}>{notif.time}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#475569', lineHeight: 14, marginTop: 2 }}>{notif.content}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
      {/* Main Content Area using MainTabNavigator */}
      <MainTabNavigator isStudent={isStudent} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <View style={{ flex: 1 }}>
            <MainAppShell />
            <Toast />
          </View>
        </AppProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  header: {
    height: 70,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 42,
    height: 42,
    marginRight: 12,
  },
  headerBrandText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FF6B00",
    letterSpacing: -0.5,
  },
  headerTitleText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginRight: 10,
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444", // vibrant red
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  bellBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  avatarTouch: {
    position: "relative",
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  studentAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employerAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#0A58CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    resizeMode: "cover",
  },
  crownBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFD700",
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  crownIcon: {
    fontSize: 8,
    lineHeight: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.3)", // slate-900 with elegant overlay transparency
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24, // Fully rounded floating container
    marginHorizontal: 16,
    marginBottom: Platform.OS === "ios" ? 34 : 20, // Float elegantly above screen bottom
    paddingBottom: 16,
    maxHeight: "60%", // Compact modal height
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  closeText: {
    fontSize: 18,
    color: "#64748B",
  },
  notifList: {
    padding: 12,
  },
  emptyNotif: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyNotifText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  notifCard: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC", // Sleek grey background card
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  notifBadgeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FF6B001A", // Light orange tint container
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  notifTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  notifTime: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },
  notifBody: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
    marginTop: 3,
  },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "ios" ? 104 : 95, // Account for status bar and header height
    right: 16,
    backgroundColor: "#FFFFFF", // Solid white for high contrast
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Clean slate border
    padding: 16,
    width: 272,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15, // Increased shadow opacity for maximum contrast
    shadowRadius: 30, // Softer, wider shadow glow
    elevation: 10, // Higher elevation to rise above all maps and components on Android
    zIndex: 99999,
  },
  dropdownSection1: {
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  dropdownStoreName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B", // deep graphite slate-800
  },
  dropdownEmail: {
    fontSize: 11,
    color: "#64748B", // muted slate-500
    marginTop: 2,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#F8FAFC",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  planLabel: {
    fontSize: 11,
    color: "#475569", // slate-600
    fontWeight: "600",
  },
  enterprisePill: {
    backgroundColor: "#EFF6FF", // blue-50/80
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  enterprisePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB", // blue-600
  },
  studentPill: {
    backgroundColor: "#FFF7ED", // orange-50/80
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  studentPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA580C", // orange-600
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
    marginHorizontal: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  dropdownItemIcon: {
    marginRight: 10,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155", // slate-700
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 998,
  },
  closeDropdownBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  closeDropdownText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "bold",
  },
  loginHeaderBtn: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  loginHeaderBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
