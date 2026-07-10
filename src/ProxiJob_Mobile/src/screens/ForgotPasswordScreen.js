import React, { useState, useContext, useEffect } from 'react';
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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { AppContext } from '../context/AppContext';
import { forgotPasswordApi, verifyResetTokenApi, resetPasswordApi } from '../api/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const { navigateTo, selectedRole } = useContext(AppContext);
  
  // State for Multi-step Wizard
  const [step, setStep] = useState(1); // 1 = email input, 2 = OTP verification, 3 = reset password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const activeColor = selectedRole === 0 ? theme.colors.student : theme.colors.employer;

  // Countdown timer for OTP resending
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const startCountdown = () => {
    setTimer(60);
    setIsTimerActive(true);
  };

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email không được để trống.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Định dạng email không hợp lệ.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    setError('');
    try {
      await forgotPasswordApi(email.trim());
      setStep(2);
      startCountdown();
    } catch (err) {
      console.log('[ForgotPassword] Error sending OTP:', err.message);
      setError(err.message || 'Gửi mã khôi phục thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isTimerActive) return;
    setError('');
    try {
      await forgotPasswordApi(email.trim());
      startCountdown();
    } catch (err) {
      setError(err.message || 'Gửi lại mã OTP thất bại.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!code.trim()) {
      setError('Vui lòng nhập mã xác minh.');
      return;
    }
    if (code.trim().length !== 6) {
      setError('Mã xác minh phải gồm 6 chữ số.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await verifyResetTokenApi(email.trim(), code.trim());
      setStep(3);
    } catch (err) {
      console.log('[ForgotPassword] Error verifying OTP:', err.message);
      setError(err.message || 'Mã xác minh không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError('Mật khẩu mới không được để trống.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPasswordApi(email.trim(), code.trim(), newPassword, confirmNewPassword);
      setSuccess(true);
    } catch (err) {
      console.log('[ForgotPassword] Error resetting password:', err.message);
      setError(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (success) {
      return (
        <View style={styles.successContainer}>
          <View style={styles.successIconBadge}>
            <Ionicons name="checkmark-circle" size={36} color="#198754" />
          </View>
          <Text style={styles.successTitle}>Đổi mật khẩu thành công!</Text>
          <Text style={styles.successMessage}>
            Mật khẩu mới của bạn đã được cập nhật. Bây giờ bạn có thể đăng nhập bằng tài khoản này.
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: activeColor, width: '100%', marginTop: 20 }]}
            onPress={() => navigateTo('login')}
          >
            <Text style={styles.submitButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (step) {
      case 1:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.instructionText}>
              Nhập địa chỉ email đăng ký của bạn bên dưới. Chúng tôi sẽ gửi một mã OTP gồm 6 chữ số để khôi phục mật khẩu.
            </Text>

            <Text style={styles.inputLabel}>Tài khoản Email</Text>
            <TextInput
              style={[
                styles.input,
                isEmailFocused && { borderColor: activeColor, borderWidth: 1.5 },
                error && { borderColor: theme.colors.danger, borderWidth: 1.5 }
              ]}
              placeholder="Nhập địa chỉ email..."
              placeholderTextColor={theme.colors.textLight}
              value={email}
              onChangeText={(e) => {
                setEmail(e);
                if (error) setError('');
              }}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: activeColor }, loading && { opacity: 0.6 }]}
              activeOpacity={0.9}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Gửi mã xác thực OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.instructionText}>
              Mã xác thực OTP đã được gửi đến hòm thư <Text style={{ fontWeight: 'bold', color: theme.colors.text }}>{email}</Text>. Vui lòng nhập mã bên dưới.
            </Text>

            <Text style={styles.inputLabel}>Mã xác thực OTP (6 chữ số)</Text>
            <TextInput
              style={[
                styles.input,
                styles.otpInput,
                isCodeFocused && { borderColor: activeColor, borderWidth: 1.5 },
                error && { borderColor: theme.colors.danger, borderWidth: 1.5 }
              ]}
              placeholder="123456"
              placeholderTextColor={theme.colors.textLight}
              value={code}
              onChangeText={(e) => {
                setCode(e.replace(/[^0-9]/g, ''));
                if (error) setError('');
              }}
              onFocus={() => setIsCodeFocused(true)}
              onBlur={() => setIsCodeFocused(false)}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
              editable={!loading}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Countdown / Resend Link */}
            <View style={styles.timerRow}>
              {isTimerActive ? (
                <Text style={styles.timerText}>Gửi lại mã sau {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={[styles.resendText, { color: activeColor }]}>Gửi lại mã OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.backStepButton, { borderColor: activeColor }]}
                onPress={() => {
                  setError('');
                  setStep(1);
                }}
                disabled={loading}
              >
                <Text style={[styles.backStepButtonText, { color: activeColor }]}>Quay lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextStepButton, { backgroundColor: activeColor }, loading && { opacity: 0.6 }]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Xác nhận mã</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.instructionText}>
              Xác minh thành công! Bây giờ vui lòng thiết lập mật khẩu đăng nhập mới cho tài khoản của bạn.
            </Text>

            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  { paddingRight: 48, marginBottom: 0 },
                  isPasswordFocused && { borderColor: activeColor, borderWidth: 1.5 },
                  error && { borderColor: theme.colors.danger, borderWidth: 1.5 }
                ]}
                placeholder="Nhập mật khẩu mới..."
                placeholderTextColor={theme.colors.textLight}
                value={newPassword}
                onChangeText={(e) => {
                  setNewPassword(e);
                  if (error) setError('');
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color={theme.colors.textMuted || "#6B7280"}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  { paddingRight: 48, marginBottom: 0 },
                  isConfirmFocused && { borderColor: activeColor, borderWidth: 1.5 },
                  error && { borderColor: theme.colors.danger, borderWidth: 1.5 }
                ]}
                placeholder="Xác nhận mật khẩu..."
                placeholderTextColor={theme.colors.textLight}
                value={confirmNewPassword}
                onChangeText={(e) => {
                  setConfirmNewPassword(e);
                  if (error) setError('');
                }}
                onFocus={() => setIsConfirmFocused(true)}
                onBlur={() => setIsConfirmFocused(false)}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={20}
                  color={theme.colors.textMuted || "#6B7280"}
                />
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: activeColor, marginTop: 15 }, loading && { opacity: 0.6 }]}
              activeOpacity={0.9}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Đặt lại mật khẩu</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
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
            <Text style={styles.logoSubText}>Khôi phục lại mật khẩu tài khoản của bạn</Text>
          </View>

          {/* Card Body */}
          <View style={[styles.loginCard, theme.shadows.medium]}>
            <Text style={styles.cardTitle}>
              {success ? 'Hoàn tất' : `Khôi phục Mật khẩu (Bước ${step}/3)`}
            </Text>

            {renderStepContent()}
          </View>

          {/* Back to Login Footer */}
          {!success && (
            <View style={styles.footerContainer}>
              <TouchableOpacity onPress={() => navigateTo('login')} disabled={loading}>
                <Text style={[styles.backToLoginText, { color: activeColor }]}>
                  ← Quay lại Đăng nhập
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Continue as Guest */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigateTo('student_dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={16} color={theme.colors.textMuted || "#6B7280"} style={{ marginRight: 6 }} />
            <Text style={styles.guestButtonText}>Tiếp tục xem việc làm (Khách)</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  instructionText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
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
  otpInput: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 8,
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
  errorText: {
    color: theme.colors.danger,
    fontSize: 11,
    marginTop: -10,
    marginBottom: 10,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  timerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  resendText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  submitButton: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 5,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 5,
  },
  backStepButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backStepButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextStepButton: {
    flex: 2,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  successIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1987541A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#198754',
    marginBottom: theme.spacing.sm,
  },
  successMessage: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: 'bold',
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
    marginTop: 10,
    width: '100%',
    maxWidth: 400,
  },
  guestButtonText: {
    color: theme.colors.textMuted || '#64748B',
    fontSize: 13,
    fontWeight: '600',
  }
});
