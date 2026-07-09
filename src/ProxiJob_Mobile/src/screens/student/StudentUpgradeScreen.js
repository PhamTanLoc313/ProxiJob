import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { theme } from '../../styles/theme';
import { AppContext } from '../../context/AppContext';
import { getPlansApi, purchasePlanApi } from '../../api/auth';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');

const FONT_REGULAR = Platform.OS === 'web' ? '"Plus Jakarta Sans", sans-serif' : 'PlusJakartaSans-Regular';
const FONT_BOLD = Platform.OS === 'web' ? '"Plus Jakarta Sans", sans-serif' : 'PlusJakartaSans-Bold';
const FONT_EXTRABOLD = Platform.OS === 'web' ? '"Plus Jakarta Sans", sans-serif' : 'PlusJakartaSans-ExtraBold';

export default function StudentUpgradeScreen() {
  const { navigateTo, showToast, user, goBack } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(null);
  const [plans, setPlans] = useState([]);
  const [fetchingPlans, setFetchingPlans] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for the premium card
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    try {
      const data = await getPlansApi();
      const studentPlans = Array.isArray(data) 
        ? data.filter(p => p.planName === 'Student10' || p.Name === 'Student10')
        : [];
      setPlans(studentPlans);
    } catch (err) {
      console.log('Error loading student plans:', err);
      // Fallback
      setPlans([
        { id: 5, planName: 'Student10', price: 10000, description: 'Gói 10 lượt ứng tuyển dành cho sinh viên', durationDays: 30 }
      ]);
    } finally { setFetchingPlans(false); }
  }

  const handlePurchase = async (plan) => {
    setLoading(plan.id);
    try {
      const res = await purchasePlanApi(plan.id);
      showToast(`Đơn gói ${plan.planName || 'Student10'} đã được tạo!`, 'success');
      navigateTo('payment_qr', {
        orderId: res.orderId,
        orderCode: res.orderCode,
        amount: res.amount,
        expiresAt: res.expiresAt,
        planName: plan.planName || 'Student10',
        bankTransfer: res.bankTransfer,
        checkoutUrl: res.checkoutUrl,
        qrCode: res.qrCode,
      });
    } catch (err) {
      showToast('Tạo đơn thất bại: ' + (err.message || 'Thử lại.'), 'error');
    } finally { setLoading(null); }
  };

  const fmt = (p) => (!p || p === 0) ? '0đ' : p.toLocaleString('vi-VN') + 'đ';

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
        <TouchableOpacity style={s.hBack} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={s.hTitle}>Gói ứng tuyển</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Hero Section */}
          <View style={s.hero}>
            <Text style={s.heroTitle}>Nâng cao cơ hội tìm việc</Text>
            <Text style={s.heroSub}>
              Mua thêm lượt ứng tuyển để kết nối nhanh chóng với những ca làm việc bán thời gian phù hợp nhất với bạn.
            </Text>
          </View>

          {fetchingPlans ? (
            <ActivityIndicator size="large" color="#FF6B00" style={{ marginVertical: 60 }} />
          ) : plans.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
              <Text style={s.emptyText}>Hiện chưa có gói ứng tuyển nào cho sinh viên.</Text>
            </View>
          ) : (
            <View style={s.plansContainer}>
              {plans.map((plan) => (
                <View key={plan.id} style={[s.card, s.cardPremium]}>
                  {/* Glowing ambient background light */}
                  <Animated.View style={[s.orbOrange, { transform: [{ scale: pulseAnim }] }]} />

                  {/* Hot Badge */}
                  <Animated.View style={[s.badge, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={s.badgeText}>🔥 GÓI KHUYÊN DÙNG</Text>
                  </Animated.View>

                  {/* Premium corner brackets */}
                  <View style={s.bracketTL} />
                  <View style={s.bracketTR} />
                  <View style={s.bracketBL} />
                  <View style={s.bracketBR} />

                  <View style={s.cardTop}>
                    <View style={[s.cardIconCircle, { backgroundColor: '#FFF0E6' }]}>
                      <Text style={s.cardIcon}>🎟️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardName}>Gói 10 lượt ứng tuyển</Text>
                      <Text style={s.cardDesc}>Tích lũy vĩnh viễn (Không hết hạn)</Text>
                    </View>
                  </View>

                  <View style={s.priceRow}>
                    <Text style={s.price}>{fmt(plan.price)}</Text>
                    <Text style={s.pricePer}>/10 lượt</Text>
                  </View>

                  <View style={s.features}>
                    <View style={s.featRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#FF6B00" style={{ marginRight: 8, marginTop: 1 }} />
                      <Text style={s.featText}>Cộng dồn vĩnh viễn vào tài khoản</Text>
                    </View>
                    <View style={s.featRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#FF6B00" style={{ marginRight: 8, marginTop: 1 }} />
                      <Text style={s.featText}>Tự động hoàn lượt nếu nhà tuyển dụng hủy ca</Text>
                    </View>
                    <View style={s.featRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#FF6B00" style={{ marginRight: 8, marginTop: 1 }} />
                      <Text style={s.featText}>Thanh toán VietQR / Ngân hàng tức thì</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[s.purchaseBtn, { backgroundColor: '#FF6B00' }]}
                    activeOpacity={0.85}
                    onPress={() => handlePurchase(plan)}
                    disabled={loading !== null}
                  >
                    {loading === plan.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={s.purchaseBtnText}>Mua ngay</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Guarantee Section */}
          <View style={s.trustHero}>
            <Ionicons name="shield-checkmark" size={28} color="#FF6B00" style={{ marginBottom: 6 }} />
            <Text style={s.trustTitle}>Giao dịch Bảo mật & An toàn</Text>
            <Text style={s.trustSub}>
              Mọi giao dịch thanh toán đều được xử lý tự động qua VietQR / cổng PayOS và được mã hóa bảo mật tuyệt đối.
            </Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  hBack: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: FONT_EXTRABOLD,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  hero: {
    marginTop: 8,
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 36,
    fontFamily: FONT_EXTRABOLD,
  },
  heroSub: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginTop: 10,
    fontWeight: '500',
    fontFamily: FONT_REGULAR,
  },
  plansContainer: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 24,
    marginBottom: 28,
    position: 'relative',
    overflow: 'visible',
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  cardPremium: {
    borderColor: '#FF6B00',
    borderWidth: 2,
    paddingTop: 32,
    backgroundColor: '#FFFDFB',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 9999,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: FONT_EXTRABOLD,
  },
  bracketTL: { position: 'absolute', top: 10, left: 10, width: 16, height: 16, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderColor: '#FF6B00', borderTopLeftRadius: 6 },
  bracketTR: { position: 'absolute', top: 10, right: 10, width: 16, height: 16, borderTopWidth: 3.5, borderRightWidth: 3.5, borderColor: '#FF6B00', borderTopRightRadius: 6 },
  bracketBL: { position: 'absolute', bottom: 10, left: 10, width: 16, height: 16, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderColor: '#FF6B00', borderBottomLeftRadius: 6 },
  bracketBR: { position: 'absolute', bottom: 10, right: 10, width: 16, height: 16, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderColor: '#FF6B00', borderBottomRightRadius: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: { fontSize: 22 },
  cardName: { fontSize: 20, fontWeight: '800', color: '#0F172A', fontFamily: FONT_EXTRABOLD },
  cardDesc: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500', fontFamily: FONT_REGULAR },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  price: { fontSize: 32, fontWeight: '900', color: '#0F172A', fontFamily: FONT_EXTRABOLD },
  pricePer: { fontSize: 14, color: '#64748B', marginLeft: 4, fontWeight: '700', fontFamily: FONT_BOLD },
  features: { marginBottom: 20 },
  featRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  featText: { fontSize: 13, color: '#334155', fontWeight: '500', flex: 1, fontFamily: FONT_REGULAR },
  purchaseBtn: { height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  purchaseBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', fontFamily: FONT_EXTRABOLD },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONT_REGULAR,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  trustHero: {
    backgroundColor: '#FFF7ED',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFE2D1',
    marginTop: 10,
  },
  trustTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: FONT_EXTRABOLD,
  },
  trustSub: {
    fontSize: 12,
    color: '#7C2D12',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    fontWeight: '500',
    fontFamily: FONT_REGULAR,
  },
  orbOrange: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FF6B00',
    opacity: 0.07,
    top: -50,
    right: -50,
    zIndex: -1,
  },
});
