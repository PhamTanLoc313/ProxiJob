import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { theme } from '../../styles/theme';
import { AppContext } from '../../context/AppContext';
import { getPaymentStatusApi, createPaymentSessionApi, saveAuthSession, checkAuthApi } from '../../api/auth';
import { Ionicons } from '@expo/vector-icons';

const POLL_INTERVAL_MS = 8000;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// QR Dimensions
const QR_WIDTH = Math.min(SCREEN_W - 80, 260);
const QR_HEIGHT = QR_WIDTH;

export default function PaymentQRScreen() {
  const { navigationParams, goBack, showToast, navigateTo, setIsEnterprise } = useContext(AppContext);
  const { orderId, orderCode, amount, expiresAt, planName, bankTransfer } = navigationParams || {};

  const [checkoutUrl, setCheckoutUrl] = useState(navigationParams?.checkoutUrl || null);
  const [qrCode, setQrCode] = useState(navigationParams?.qrCode || null);
  const [paymentData, setPaymentData] = useState(bankTransfer || null);

  const [status, setStatus] = useState('Pending');
  const [polling, setPolling] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [checking, setChecking] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Pulsing animation for QR Border
  useEffect(() => {
    if (status !== 'Pending') return;
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    p.start();
    return () => p.stop();
  }, [status]);

  // Scan line animation on the QR Code
  useEffect(() => {
    if (status !== 'Pending') return;
    const s = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    s.start();
    return () => s.stop();
  }, [status]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const iv = setInterval(() => {
      const d = new Date(expiresAt) - new Date();
      if (d <= 0) {
        setCountdown('00:00:00');
        setStatus('Expired');
        setPolling(false);
        clearInterval(iv);
        return;
      }
      const h = String(Math.floor(d / 3600000)).padStart(2, '0');
      const m = String(Math.floor((d % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((d % 60000) / 1000)).padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  // Status Polling
  useEffect(() => {
    if (!orderId || !polling) return;
    let alive = true;
    const poll = async () => {
      try {
        const r = await getPaymentStatusApi(orderId);
        if (!alive) return;
        setStatus(r.status);
        if (r.checkoutUrl) setCheckoutUrl(r.checkoutUrl);
        if (r.qrCode) setQrCode(r.qrCode);
        if (r.bankTransfer) setPaymentData(r.bankTransfer);
        if (r.status === 'Paid') {
          setPolling(false);
          handlePaid();
        } else if (r.status === 'Expired' || r.status === 'Cancelled') {
          setPolling(false);
        }
      } catch { }
    };
    poll();
    const iv = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [orderId, polling]);

  const handlePaid = async () => {
    try {
      const tk = await createPaymentSessionApi(orderId);
      if (tk?.accessToken) {
        const u = await checkAuthApi(tk.accessToken);
        await saveAuthSession(tk.accessToken, tk.refreshToken, u);
      }
      setIsEnterprise(true);
      showToast('Thanh toán thành công! Gói đã kích hoạt.', 'success');
    } catch {
      showToast('Thanh toán xác nhận! Đăng nhập lại để cập nhật.', 'success');
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const r = await getPaymentStatusApi(orderId);
      setStatus(r.status);
      if (r.checkoutUrl) setCheckoutUrl(r.checkoutUrl);
      if (r.qrCode) setQrCode(r.qrCode);
      if (r.bankTransfer) setPaymentData(r.bankTransfer);
      if (r.status === 'Paid') {
        setPolling(false);
        await handlePaid();
      } else if (r.status === 'Expired' || r.status === 'Cancelled') {
        setPolling(false);
        showToast(r.status === 'Expired' ? 'Đơn đã hết hạn.' : 'Đơn đã bị hủy.', 'error');
      } else {
        showToast('Hệ thống chưa nhận được thanh toán. Hãy thử lại sau vài giây.', 'warning');
      }
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    } finally {
      setChecking(false);
    }
  };

  const copy = async (text, label) => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
      } else {
        const C = require('expo-clipboard');
        await C.setStringAsync(text);
      }
      showToast(`Đã sao chép ${label}!`, 'success');
    } catch {
      showToast('Không thể sao chép.', 'error');
    }
  };

  const fmt = (v) => (!v && v !== 0) ? '0 đ' : Number(v).toLocaleString('vi-VN') + ' đ';

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, QR_HEIGHT - 10],
  });

  // ═══════ SUCCESS STATE ═══════
  if (status === 'Paid') {
    return (
      <SafeAreaView style={st.container}>
        <Animated.View style={[st.successWrap, { opacity: fadeAnim }]}>
          <View style={st.successIconWrapper}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          <Text style={st.successTitle}>Thanh toán thành công</Text>
          <Text style={st.successSub}>
            Gói dịch vụ <Text style={{ fontWeight: '800', color: '#FF6B00' }}>{planName}</Text> đã được kích hoạt thành công trên tài khoản của bạn.
          </Text>
          <View style={st.successInfo}>
            <View style={st.successRow}>
              <Text style={st.sLabel}>Mã đơn hàng</Text>
              <Text style={st.sVal}>{orderCode}</Text>
            </View>
            <View style={[st.successRow, { borderBottomWidth: 0 }]}>
              <Text style={st.sLabel}>Số tiền đã thanh toán</Text>
              <Text style={[st.sVal, { color: '#10B981', fontSize: 16, fontWeight: '800' }]}>{fmt(amount)}</Text>
            </View>
          </View>
          <TouchableOpacity style={st.successBtn} onPress={() => navigateTo('employer_approvals')} activeOpacity={0.85}>
            <Text style={st.successBtnText}>Về Trang Chủ</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ═══════ DEFAULT STATE (PAYMENT) ═══════
  return (
    <SafeAreaView style={st.container}>
      {/* Dynamic Glow Orbs Background decoration */}
      <View style={st.ambientGlowTop} />
      <View style={st.ambientGlowBottom} />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.hBack} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={st.hTitle}>Thanh toán dịch vụ</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ══ DYNAMIC QR CODE CARD ══ */}
          {qrCode && status === 'Pending' && (
            <View style={st.qrSection}>
              <Animated.View style={[st.qrWrapper, { transform: [{ scale: pulseAnim }] }]}>
                {/* QR Image */}
                <Image
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}` }}
                  style={st.qrImg}
                  resizeMode="contain"
                />
                {/* Visual Scan Line */}
                <Animated.View style={[st.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]} />
              </Animated.View>

              {/* Status Header */}
              <View style={st.qrStatusContainer}>
                <View style={st.liveStatusDot} />
                <Text style={st.qrStatusText}>Hệ thống duyệt tự động Napas247</Text>
              </View>

              <Text style={st.qrHint}>Mở app ngân hàng quét mã VietQR để thanh toán tức thì</Text>

              {/* Countdown timer badge */}
              {countdown ? (
                <View style={st.timerBadge}>
                  <Ionicons name="time-outline" size={14} color="#C2410C" style={{ marginRight: 4 }} />
                  <Text style={st.timerText}>Mã QR hết hạn sau: <Text style={st.timerBold}>{countdown}</Text></Text>
                </View>
              ) : null}
            </View>
          )}

          {/* ══ ORDER SUMMARY CARD ══ */}
          <View style={st.card}>
            <View style={st.cardHeader}>
              <Ionicons name="receipt-outline" size={20} color="#FF6B00" />
              <Text style={st.cardTitle}>Thông tin đơn hàng</Text>
            </View>
            <View style={st.cardBody}>
              <PremiumRow label="Gói dịch vụ" value={planName || '—'} isHighlight />
              <PremiumRow label="Số tiền thanh toán" value={fmt(amount)} isPrice last />
            </View>
          </View>

          {/* ══ RECIPIENT ACCOUNT DETAILS CARD ══ */}
          {paymentData && status === 'Pending' && (
            <View style={st.card}>
              <View style={st.cardHeader}>
                <Ionicons name="business-outline" size={20} color="#3B82F6" />
                <Text style={st.cardTitle}>Thông tin tài khoản nhận</Text>
              </View>
              <View style={st.cardBody}>
                <PremiumRow label="Ngân hàng thụ hưởng" value={paymentData.bankName} />
                <PremiumRow label="Tên chủ tài khoản" value={paymentData.accountHolder} />
                <PremiumRow
                  label="Số tài khoản"
                  value={paymentData.accountNumber}
                  isMono
                  isCopyable
                  onCopy={() => copy(paymentData.accountNumber, 'Số tài khoản')}
                />
                <PremiumRow
                  label="Nội dung chuyển khoản"
                  value={paymentData.transferContent}
                  isMono
                  isDanger
                  isCopyable
                  onCopy={() => copy(paymentData.transferContent, 'Nội dung chuyển khoản')}
                  last
                />
              </View>
            </View>
          )}

          {/* Expired / Cancelled State Info */}
          {(status === 'Expired' || status === 'Cancelled') && (
            <View style={st.errorPill}>
              <Ionicons name="alert-circle-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={st.errorTitle}>{status === 'Expired' ? 'Giao dịch hết hạn' : 'Giao dịch bị hủy'}</Text>
                <Text style={st.errorSub}>Vui lòng quay lại trang trước để tạo giao dịch mới.</Text>
              </View>
            </View>
          )}

          {/* ══ MAIN ACTIONS ══ */}
          <View style={st.actionSection}>
            {status === 'Pending' && (
              <TouchableOpacity
                style={[st.mainActionBtn, checking && { opacity: 0.8 }]}
                onPress={handleCheck}
                disabled={checking}
                activeOpacity={0.85}
              >
                {checking ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={st.mainActionText}>Đã thanh toán? Kiểm tra trạng thái</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {(status === 'Expired' || status === 'Cancelled') && (
              <TouchableOpacity
                style={[st.mainActionBtn, { backgroundColor: '#F59E0B' }]}
                onPress={() => navigateTo('upgrade_package')}
                activeOpacity={0.85}
              >
                <Text style={st.mainActionText}>Tạo yêu cầu thanh toán mới</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={st.secondaryActionBtn} onPress={goBack} activeOpacity={0.85}>
              <Text style={st.secondaryActionText}>Quay lại</Text>
            </TouchableOpacity>
          </View>

          {/* Live checking status indicator */}
          {polling && status === 'Pending' && (
            <View style={st.statusCheckIndicator}>
              <ActivityIndicator size="small" color="#FF6B00" style={{ marginRight: 8 }} />
              <Text style={st.statusCheckText}>Hệ thống đang kiểm tra tự động giao dịch của bạn...</Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ══ Row-by-Row Layout Component (Visual design) ══ */
function PremiumRow({ label, value, isHighlight, isPrice, isMono, isCopyable, onCopy, isDanger, last }) {
  return (
    <View style={[st.rowContainer, last && { borderBottomWidth: 0, paddingBottom: 0 }]}>
      <View style={st.rowTextContainer}>
        <Text style={st.rowLabel}>{label}</Text>
        <Text style={[
          st.rowValue,
          isHighlight && { color: '#FF6B00', fontWeight: '800' },
          isPrice && { color: '#10B981', fontSize: 18, fontWeight: '800' },
          isMono && { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 0.5 },
          isDanger && { color: '#EF4444', fontWeight: '800' }
        ]} numberOfLines={2}>{value}</Text>
      </View>

      {isCopyable && (
        <TouchableOpacity style={st.rowCopyBtn} onPress={onCopy} activeOpacity={0.6}>
          <View style={st.copyIconCircle}>
            <Ionicons name="copy-outline" size={15} color="#64748B" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ══ Styles ══ */
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Background glow decor
  ambientGlowTop: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#7C3AED',
    opacity: 0.04,
    zIndex: -1,
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: 50,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF6B00',
    opacity: 0.04,
    zIndex: -1,
  },

  /* Header */
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 34,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  hBack: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  hTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  scroll: { paddingHorizontal: 16, paddingVertical: 16 },

  /* QR Code Section */
  qrSection: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  qrWrapper: {
    width: QR_WIDTH + 20,
    height: QR_HEIGHT + 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  qrImg: {
    width: QR_WIDTH,
    height: QR_HEIGHT,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#FF6B00',
    opacity: 0.7,
    borderRadius: 99,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  qrStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  qrStatusText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '700',
  },
  qrHint: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  timerBadge: {
    marginTop: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 11,
    color: '#C2410C',
  },
  timerBold: {
    fontWeight: '800',
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 8,
  },
  cardBody: {},

  /* Row Components */
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  rowTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  rowLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  rowCopyBtn: {
    padding: 6,
  },
  copyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Errors */
  errorPill: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  errorSub: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },

  /* Actions */
  actionSection: {
    marginTop: 4,
  },
  mainActionBtn: {
    backgroundColor: '#FF6B00',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  mainActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Polling indicators */
  statusCheckIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  statusCheckText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Success State */
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  successIconWrapper: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successInfo: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 24,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  sVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  successBtn: {
    backgroundColor: '#FF6B00',
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
