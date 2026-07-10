import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, loginWithGoogle, navigateTo, authLoading, showToast } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedGoogleRole, setSelectedGoogleRole] = useState(null);

  // WebView states for Google Login fallback
  const [showGoogleWebView, setShowGoogleWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [targetRole, setTargetRole] = useState('student');

  const handleWebViewNavigationStateChange = async (navState) => {
    const { url } = navState;
    console.log('[LoginScreen] WebView navigating to:', url);

    // Check if the URL starts with the redirect URI
    if (url.startsWith('https://auth.expo.io/@anonymous/ProxiJob_Mobile')) {
      setShowGoogleWebView(false);

      // Extract parameters from fragment (#) or query (?)
      const paramsStr = url.split('#')[1] || url.split('?')[1] || '';
      const params = new URLSearchParams(paramsStr);
      const idToken = params.get('id_token') || params.get('credential');

      if (idToken) {
        console.log('[LoginScreen] WebView OAuth resolved token successfully.');
        showToast('Đăng nhập Google thành công!', 'success');
        await loginWithGoogle(idToken, targetRole);
      } else {
        console.log('[LoginScreen] Token not found in WebView URL:', url);
        showToast('Không lấy được token từ Google.', 'error');
      }
    }
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '761339432164-gth4e77gocarke99gj3vk38ti5bkcull.apps.googleusercontent.com',
    iosClientId: '761339432164-gth4e77gocarke99gj3vk38ti5bkcull.apps.googleusercontent.com',
    webClientId: '761339432164-gth4e77gocarke99gj3vk38ti5bkcull.apps.googleusercontent.com',
    useProxy: true,
    redirectUri: makeRedirectUri({
      useProxy: true
    })
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { idToken } = response.authentication || response.params || {};
      const actualToken = idToken || response.authentication?.idToken;
      if (actualToken && selectedGoogleRole) {
        console.log('[LoginScreen] Browser Google Login success. Token resolved.');
        loginWithGoogle(actualToken, selectedGoogleRole);
      } else {
        console.log('[LoginScreen] Browser Google Login success, but token not found in response details.', response);
        // Fallback to access_token if no idToken is present (some web configs)
        const tokenVal = response.authentication?.accessToken || response.params?.access_token;
        if (tokenVal) {
          loginWithGoogle(tokenVal, selectedGoogleRole);
        }
      }
    }
  }, [response]);



  const validateForm = () => {
    let tempErrors = {};

    if (!email || !email.trim()) {
      tempErrors.email = 'Email không được để trống.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        tempErrors.email = 'Định dạng email không hợp lệ.';
      }
    }

    if (!password || !password.trim()) {
      tempErrors.password = 'Mật khẩu không được để trống.';
    } else if (password.trim().length < 8) {
      tempErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      await login(email.trim(), password.trim());
    } catch (err) {
      setErrors({
        email: ' ',
        password: err.message || 'Tài khoản hoặc mật khẩu không chính xác.'
      });
    }
  };

  const handleGoogleLogin = () => {
    // Show role selection modal first before triggering login flow
    setShowRoleModal(true);
  };

  const handleRoleSelect = async (role) => {
    setShowRoleModal(false);
    setSelectedGoogleRole(role);

    // =========================================================================
    // --- GOOGLE SIGN-IN INTEGRATION FLOW ---
    // Client ID: 761339432164-gth4e77gocarke99gj3vk38ti5bkcull.apps.googleusercontent.com
    // =========================================================================
    try {
      try {
        const Constants = require('expo-constants').default;
        const isExpoGo = Constants?.appOwnership === 'expo';

        if (!isExpoGo) {
          const { NativeModules } = require('react-native');
          if (NativeModules.RNGoogleSignin) {
            const { GoogleSignin } = require('@react-native-google-signin/google-signin');
            GoogleSignin.configure({
              webClientId: '761339432164-gth4e77gocarke99gj3vk38ti5bkcull.apps.googleusercontent.com',
              offlineAccess: true
            });

            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.idToken || userInfo.data?.idToken;
            if (idToken) {
              console.log('[LoginScreen] Native Google Sign-In success.');
              await loginWithGoogle(idToken, role);
              return;
            }
          } else {
            console.log('[LoginScreen] Native RNGoogleSignin module not present in this build.');
          }
        } else {
          console.log('[LoginScreen] Running inside Expo Go. Bypassing native Google Sign-In to prevent crash.');
        }
      } catch (nativeErr) {
        console.log('[LoginScreen] Native GoogleSignin check failed. Falling back to browser AuthSession...', nativeErr.message);
      }

      // 2. Custom WebView-based Google Login for Expo Go (bypasses browser redirect blocks)
      showToast('Đang mở đăng nhập Google...', 'info');
      setTargetRole(role);

      const expoProxyUrl = 'https://auth.expo.io/@anonymous/ProxiJob_Mobile';
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=761339432164-gth4e77gocarke99gj3vk38ti5bkcull.apps.googleusercontent.com` +
        `&redirect_uri=${encodeURIComponent(expoProxyUrl)}` +
        `&response_type=id_token` +
        `&scope=openid%20profile%20email` +
        `&nonce=nonce_${Math.random().toString(36).substring(2)}`;

      console.log('[LoginScreen] Opening Google Login in WebView:', googleAuthUrl);
      setWebViewUrl(googleAuthUrl);
      setShowGoogleWebView(true);
    } catch (err) {
      console.log('Google Sign-in failed', err);
      showToast(err.message || 'Đăng nhập bằng Google thất bại.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Logo / Header Area */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../img/logoproxijobcamden.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>ProxiJob</Text>
            <Text style={styles.logoSubText}>Kết nối việc làm tức thì quanh bạn trong bán kính 3-5km</Text>
          </View>

          {/* Card Body */}
          <View style={[styles.loginCard, theme.shadows.medium]}>
            <Text style={styles.cardTitle}>Đăng nhập Hệ thống</Text>



            {/* Form Inputs */}
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Tài khoản Email</Text>
              <TextInput
                style={[
                  styles.input,
                  isEmailFocused && { borderColor: theme.colors.primary, borderWidth: 1.5 },
                  errors.email && { borderColor: theme.colors.danger, borderWidth: 1.5 }
                ]}
                placeholder="Nhập địa chỉ email..."
                placeholderTextColor={theme.colors.textLight}
                value={email}
                onChangeText={(e) => {
                  setEmail(e);
                  if (errors.email || errors.password) {
                    setErrors({ email: null, password: null });
                  }
                }}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!authLoading}
              />
              {errors.email && errors.email.trim() !== '' && <Text style={styles.errorText}>{errors.email}</Text>}

              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { paddingRight: 48, marginBottom: 0 },
                    isPasswordFocused && { borderColor: theme.colors.primary, borderWidth: 1.5 },
                    errors.password && { borderColor: theme.colors.danger, borderWidth: 1.5 }
                  ]}
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor={theme.colors.textLight}
                  value={password}
                  onChangeText={(e) => {
                    setPassword(e);
                    if (errors.email || errors.password) {
                      setErrors({ email: null, password: null });
                    }
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  editable={!authLoading}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color={theme.colors.textMuted || "#6B7280"}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              <View style={styles.forgotPasswordRow}>
                <TouchableOpacity
                  disabled={authLoading}
                  onPress={() => navigateTo('forgot_password')}
                >
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic Login Button */}
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    { backgroundColor: theme.colors.primary },
                    authLoading && { opacity: 0.6 }
                  ]}
                  activeOpacity={0.9}
                  onPress={handleSubmit}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Text style={styles.loginButtonText}>Đăng nhập</Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Hoặc đăng nhập bằng</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={[
                    styles.googleButton,
                    authLoading && { opacity: 0.7 }
                  ]}
                  activeOpacity={0.8}
                  onPress={handleGoogleLogin}
                  disabled={authLoading}
                >
                  <Ionicons name="logo-google" size={18} color="#4081EC" style={{ marginRight: 10 }} />
                  <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
                </TouchableOpacity>

                {/* Continue as Guest */}
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={() => navigateTo('student_dashboard')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="home-outline" size={16} color={theme.colors.textMuted || "#6B7280"} style={{ marginRight: 6 }} />
                  <Text style={styles.guestButtonText}>Tiếp tục xem việc làm (Khách)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Google Role Selection Modal */}
          <Modal
            visible={showRoleModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowRoleModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowRoleModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Bạn đăng nhập với vai trò nào?</Text>
                    <Text style={styles.modalSubtitle}>
                      Vui lòng chọn vai trò để ProxiJob cấu hình giao diện phù hợp với nhu cầu của bạn.
                    </Text>

                    <View style={styles.roleSelectionRow}>
                      {/* Student Card */}
                      <TouchableOpacity
                        style={[styles.roleSelectCard, styles.studentSelectCard]}
                        activeOpacity={0.85}
                        onPress={() => handleRoleSelect('student')}
                      >
                        <View style={[styles.roleSelectIconContainer, { backgroundColor: theme.colors.student + '15' }]}>
                          <Ionicons name="school-outline" size={28} color={theme.colors.student} />
                        </View>
                        <Text style={[styles.roleSelectCardTitle, { color: theme.colors.student }]}>Sinh viên</Text>
                        <Text style={styles.roleSelectCardDesc}>Tìm việc làm quanh đây kiếm thêm thu nhập</Text>
                      </TouchableOpacity>

                      {/* Employer Card */}
                      <TouchableOpacity
                        style={[styles.roleSelectCard, styles.employerSelectCard]}
                        activeOpacity={0.85}
                        onPress={() => handleRoleSelect('employer')}
                      >
                        <View style={[styles.roleSelectIconContainer, { backgroundColor: theme.colors.employer + '15' }]}>
                          <Ionicons name="storefront-outline" size={28} color={theme.colors.employer} />
                        </View>
                        <Text style={[styles.roleSelectCardTitle, { color: theme.colors.employer }]}>Chủ quán</Text>
                        <Text style={styles.roleSelectCardDesc}>Đăng tin tuyển nhân sự tức thì cho cửa hàng</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowRoleModal(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalCloseButtonText}>Đóng</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Register Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Chưa có tài khoản?</Text>
            <TouchableOpacity onPress={() => navigateTo('register')}>
              <Text
                style={[
                  styles.registerText,
                  { color: theme.colors.primary }
                ]}
              >
                Đăng ký ngay
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google WebView Modal Fallback for Expo Go */}
      <Modal
        visible={showGoogleWebView}
        animationType="slide"
        onRequestClose={() => setShowGoogleWebView(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{
            height: 92,
            paddingTop: 40,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            backgroundColor: '#F9FAFB'
          }}>
            <TouchableOpacity onPress={() => setShowGoogleWebView(false)} style={{ paddingVertical: 8 }}>
              <Text style={{ color: theme.colors.primary || '#FF6B00', fontSize: 16, fontWeight: '600' }}>Hủy</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>Đăng nhập Google</Text>
            <View style={{ width: 40 }} />
          </View>
          <WebView
            source={{ uri: webViewUrl }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            incognito={true}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: Platform.OS === 'web' ? theme.spacing.xl : 0,
  },
  logoImage: {
    width: 90,
    height: 110,
    marginBottom: -20,

  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  logoSubText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
  loginCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeStudentTab: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeEmployerTab: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  activeStudentTabText: {
    color: theme.colors.student,
  },
  activeEmployerTabText: {
    color: theme.colors.employer,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 11,
    marginTop: -10,
    marginBottom: 10,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  loginButton: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  registerText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  demoNoticeContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.primary + '0B',
    borderColor: theme.colors.primary + '33',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: 10,
  },
  demoNoticeHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.warning,
    marginBottom: 4,
  },
  demoNoticeText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8FAFC',
    marginTop: 0,
    width: '100%',
    maxWidth: 400,
  },
  guestButtonText: {
    color: theme.colors.textMuted || '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border || '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: theme.colors.textMuted || '#6B7280',
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: theme.borderRadius.md || 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.56)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  roleSelectionRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 24,
  },
  roleSelectCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentSelectCard: {
    borderColor: '#FFEBE0',
  },
  employerSelectCard: {
    borderColor: '#E0EBFF',
  },
  roleSelectIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleSelectCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  roleSelectCardDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 15,
  },
  modalCloseButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  }
});
