import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';
import { AppContext } from '../../context/AppContext';
import {
  useShiftsQuery,
  usePayrollsQuery,
  useConfirmReceiptPayrollMutation,
  useCancelApplicationMutation
} from '../../hooks/queries';
import { Ionicons } from '@expo/vector-icons';
import { getMyApplications } from '../../api/jobs';

const { width } = Dimensions.get('window');

function getWeekDaysForDate(referenceDate) {
  const today = new Date();
  const currentDay = referenceDate.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + distanceToMonday);

  const days = [];
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const apiDateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    const isToday = d.toDateString() === today.toDateString();

    days.push({
      name: dayNames[i],
      date: dateStr,
      apiDateStr: apiDateStr,
      isToday: isToday,
      fullYear: d.getFullYear(),
      month: d.getMonth() + 1
    });
  }
  return days;
}

const getDistrict = (address) => {
  if (!address) return '';
  const match = address.match(/(Quận \d+|Q\.\s*\d+|Quận [a-zA-ZÀ-ỹ\s]+|Bình Thạnh|Gò Vấp|Thủ Đức|Phú Nhuận|Tân Bình|Tân Phú|Bình Tân)/i);
  return match ? match[0] : address;
};

const formatHoursAndMinutes = (totalHours) => {
  if (!totalHours || isNaN(totalHours)) return '0 phút';
  const hrs = Math.floor(totalHours);
  const mins = Math.round((totalHours - hrs) * 60);

  if (hrs === 0) {
    return `${mins} phút`;
  }
  if (mins === 0) {
    return `${hrs} giờ`;
  }
  return `${hrs} giờ ${mins} phút`;
};

const getShiftDateLabel = (startTime) => {
  if (!startTime) return '';
  const date = new Date(startTime);
  const today = new Date();

  // Reset hours to compare dates only
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = dDate.getTime() - dToday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Hôm nay';
  } else if (diffDays === 1) {
    return `Mai, ${date.getDate()} Th${date.getMonth() + 1}`;
  } else if (diffDays === -1) {
    return `Hôm qua`;
  }

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = dayNames[date.getDay()];
  return `${dayName}, ${date.getDate()} Th${date.getMonth() + 1}`;
};

export default function StudentCalendar() {
  const { navigateTo, user, studentCoords, activeShift, showToast } = useContext(AppContext);
  const { data: shifts = [], refetch: loadMyApplications } = useShiftsQuery(user, studentCoords);
  const { data: payrolls = [], refetch: refetchPayrolls } = usePayrollsQuery(user);
  const confirmReceiptMutation = useConfirmReceiptPayrollMutation(user, showToast);
  const cancelMutation = useCancelApplicationMutation(user, showToast);

  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const [weekDays, setWeekDays] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed'
  const [referenceDate, setReferenceDate] = useState(new Date());

  const handlePrevWeek = () => {
    const prev = new Date(referenceDate);
    prev.setDate(prev.getDate() - 7);
    setReferenceDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + 7);
    setReferenceDate(next);
  };

  const handleGoToToday = () => {
    setReferenceDate(new Date());
  };

  // Trạng thái Yêu cầu Xin nghỉ / Đổi ca
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedShiftForRequest, setSelectedShiftForRequest] = useState(null);
  const [isSwapRequest, setIsSwapRequest] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('day'); // 'day', 'week', 'month'
  const [requestReason, setRequestReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const handleOpenConfirmModal = (payroll) => {
    setSelectedPayroll(payroll);
    setRating(5);
    setComments('');
    setIsConfirmedCheckbox(false);
    setIsModalVisible(true);
  };

  const handleSubmitConfirm = () => {
    if (!selectedPayroll || !isConfirmedCheckbox) return;

    confirmReceiptMutation.mutateAsync({
      payrollId: selectedPayroll.id || selectedPayroll.Id,
      rating,
      comments
    }).then(() => {
      setIsModalVisible(false);
      setSelectedPayroll(null);
      refetchPayrolls();
    }).catch(() => {
      setIsModalVisible(false);
      setSelectedPayroll(null);
    });
  };

  const handleShiftOptions = (shift) => {
    if (shift.status !== 'approved') {
      showToast('Ca làm này ở trạng thái chờ duyệt hoặc đã hoàn thành, không thể xin nghỉ hay đổi ca.', 'warning');
      return;
    }
    setSelectedShiftForRequest(shift);
    setRequestReason('');
    setReasonError('');
    setOptionsModalVisible(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedShiftForRequest) return;
    if (!requestReason.trim()) {
      setReasonError('Vui lòng nhập lý do cụ thể.');
      return;
    }
    if (requestReason.trim().length < 10) {
      setReasonError('Lý do phải ghi cụ thể ít nhất 10 ký tự.');
      return;
    }
    setReasonError('');

    let appId = selectedShiftForRequest.applicationId;
    const bizId = selectedShiftForRequest.businessId;
    const shiftId = selectedShiftForRequest.id;

    // If applicationId is missing, try to look it up dynamically
    if (!appId && user) {
      try {
        const appsRes = await getMyApplications(user.id);
        const apps = Array.isArray(appsRes) ? appsRes : (Array.isArray(appsRes?.data) ? appsRes.data : (appsRes?.items || appsRes?.Items || appsRes?.data?.items || appsRes?.data?.Items || []));

        // For virtual schedule shifts (sched_*), use jobShiftId to match
        const realShiftId = selectedShiftForRequest.jobShiftId || shiftId;

        const matchedApp = apps.find(a => {
          const aShiftId = a.shiftId !== undefined ? a.shiftId : a.ShiftId;
          // Match by numeric shift ID
          if (Number(aShiftId) === Number(realShiftId)) return true;
          // Fallback: match by job title (any status) if shift is a schedule
          if (String(shiftId).startsWith('sched_') && a.jobTitle === selectedShiftForRequest.title) return true;
          return false;
        });
        if (matchedApp) {
          const matchedStatus = matchedApp.status !== undefined ? matchedApp.status : matchedApp.Status;
          if (matchedStatus === 'Cancelled') {
            showToast('Bạn đã gửi yêu cầu xin nghỉ/đổi ca cho ca này rồi. Vui lòng chờ Chủ quán phản hồi.', 'warning');
            setRequestModalVisible(false);
            return;
          }
          appId = matchedApp.id !== undefined ? matchedApp.id : matchedApp.Id;
        }
      } catch (err) {
        console.log('Error fetching applications for leave request:', err);
      }
    }

    if (!appId) {
      showToast('Không tìm thấy thông tin đơn ứng tuyển để gửi yêu cầu. Vui lòng thử lại sau.', 'error');
      return;
    }

    cancelMutation.mutateAsync({
      applicationId: appId,
      businessId: bizId || 1,
      note: requestReason,
      isSwap: isSwapRequest
    }).then(() => {
      setRequestModalVisible(false);
      setSelectedShiftForRequest(null);
      loadMyApplications();
    }).catch(() => {
      setRequestModalVisible(false);
      setSelectedShiftForRequest(null);
    });
  };

  React.useEffect(() => {
    const days = getWeekDaysForDate(referenceDate);
    setWeekDays(days);
    const todayIdx = days.findIndex(d => d.isToday);
    setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0);
  }, [referenceDate]);

  const isSameDate = (shiftStartTime, apiDateStr) => {
    if (!shiftStartTime || !apiDateStr) return false;
    try {
      const shiftDate = new Date(shiftStartTime);
      const [year, month, day] = apiDateStr.split('-').map(Number);
      return shiftDate.getFullYear() === year &&
        (shiftDate.getMonth() + 1) === month &&
        shiftDate.getDate() === day;
    } catch (e) {
      return false;
    }
  };

  const selectedDay = weekDays[selectedDayIndex];

  const now = new Date();

  // Filter only student's own shifts (where they applied or were assigned)
  const myShifts = shifts.filter(s => s.applicationId !== undefined || String(s.id).startsWith('sched_'));

  // Filter completed shifts globally (or shifts that are in the past)
  const completedShiftsGlobal = myShifts.filter(
    (s) => s.status === 'completed' || s.status === 'absent' || new Date(s.endTime) < now
  );

  // Filter approved/active/applied shifts globally (which are in the future)
  const upcomingShiftsGlobal = myShifts.filter(
    (s) => !completedShiftsGlobal.some(cs => cs.id === s.id) && (s.status === 'approved' || s.status === 'checkin_active' || s.status === 'applied')
  );

  // Filter approved/active/applied shifts by selected day
  const upcomingShifts = upcomingShiftsGlobal.filter(s =>
    selectedDay ? isSameDate(s.startTime, selectedDay.apiDateStr) : true
  );

  // Filter completed shifts based on historyFilter selection, sorted by start time desc
  const completedShifts = completedShiftsGlobal.filter(s => {
    if (!selectedDay) return true;
    const sDate = new Date(s.startTime);
    if (historyFilter === 'day') {
      return isSameDate(s.startTime, selectedDay.apiDateStr);
    } else if (historyFilter === 'week') {
      return weekDays.some(wd => isSameDate(s.startTime, wd.apiDateStr));
    } else if (historyFilter === 'month') {
      return (sDate.getMonth() + 1) === selectedDay.month && sDate.getFullYear() === selectedDay.fullYear;
    }
    return true;
  }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  const getShiftHours = (shift) => {
    // If completed and has actual checkin/checkout times, calculate actual hours
    if (shift.status === 'completed' && shift.actualCheckInTime && shift.actualCheckOutTime) {
      try {
        const diffMs = new Date(shift.actualCheckOutTime) - new Date(shift.actualCheckInTime);
        const diffHrs = diffMs / (1000 * 60 * 60);
        return diffHrs > 0 ? diffHrs : 0;
      } catch (e) {
        console.log('Error calculating actual shift hours:', e);
      }
    }
    // Fallback to scheduled time
    if (!shift.startTime || !shift.endTime) return 4;
    try {
      const diffMs = new Date(shift.endTime) - new Date(shift.startTime);
      const diffHrs = diffMs / (1000 * 60 * 60);
      return diffHrs > 0 ? diffHrs : 4;
    } catch (e) {
      return 4;
    }
  };

  const currentMonth = selectedDay ? selectedDay.month : (new Date().getMonth() + 1);
  const currentYear = selectedDay ? selectedDay.fullYear : new Date().getFullYear();

  // Calculate monthly earnings using real payroll data combined with shifts in the current month to avoid missing completed-but-unpaid shifts
  const completedPayrollEarnings = (payrolls || [])
    .filter(p => p.status === 'Paid' || p.Status === 'Paid' || p.status === 2 || p.Status === 2)
    .reduce((sum, p) => sum + (p.finalAmount || p.FinalAmount || 0), 0);

  const completedShiftsValue = completedShiftsGlobal
    .filter(s => {
      const d = new Date(s.startTime);
      return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, s) => sum + Math.round(s.hourlyRate * getShiftHours(s)), 0);

  const upcomingShiftsValue = upcomingShiftsGlobal
    .filter(s => {
      const d = new Date(s.startTime);
      return s.status !== 'applied' && (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, s) => sum + Math.round(s.hourlyRate * getShiftHours(s)), 0);

  // Total value is all worked shifts + all upcoming approved shifts in this month
  const totalValue = completedShiftsValue + upcomingShiftsValue;

  const completedEarnings = completedPayrollEarnings;
  const projectedEarnings = Math.max(0, totalValue - completedEarnings);
  const totalEarnings = completedEarnings + projectedEarnings;

  const getTimelineLabel = () => {
    if (!selectedDay) return 'Tuần này';
    return `Tháng ${selectedDay.month}, ${selectedDay.fullYear}`;
  };

  const getDaySummaryTitle = () => {
    if (!selectedDay) return 'Lịch trình';
    if (activeTab === 'completed') {
      if (historyFilter === 'week') return 'Lịch sử tuần này';
      if (historyFilter === 'month') return `Lịch sử tháng ${selectedDay.month}`;
    }
    const dayName = selectedDay.name === 'CN' ? 'Chủ Nhật' : `Thứ ${selectedDay.name.slice(1)}`;
    return `${dayName}, ${selectedDay.date.split('/')[0]} tháng ${selectedDay.month}`;
  };

  const renderShiftItem = (shift) => {
    const isPast = new Date(shift.endTime) < now;
    const isWorking = (shift.status === 'checkin_active' ||
      (activeShift && (
        activeShift.id === shift.id ||
        activeShift.jobShiftId === shift.id ||
        `sched_${activeShift.id}` === shift.id ||
        activeShift.id === `sched_${shift.id}`
      ))) && !isPast;
    const isCompleted = shift.status === 'completed';
    const isApplied = shift.status === 'applied' && !isPast;
    const isApproved = shift.status === 'approved' && !isWorking && !isPast;

    // Left indicator border and visual colors
    let statusColor = '#94A3B8';
    let statusText = 'CHỜ DUYỆT';
    let badgeBg = '#F1F5F9';
    let badgeText = '#475569';

    if (isPast) {
      if (isCompleted) {
        statusColor = '#64748B';
        statusText = 'HOÀN THÀNH';
        badgeBg = '#F8FAFC';
        badgeText = '#64748B';
      } else {
        statusColor = '#EF4444';
        statusText = 'VẮNG MẶT';
        badgeBg = '#FEF2F2';
        badgeText = '#EF4444';
      }
    } else if (isWorking) {
      statusColor = '#10B981';
      statusText = 'ĐANG LÀM VIỆC';
      badgeBg = '#ECFDF5';
      badgeText = '#10B981';
    } else if (isApproved) {
      statusColor = '#FF6B00';
      statusText = 'ĐÃ DUYỆT';
      badgeBg = '#FFF3EB';
      badgeText = '#FF6B00';
    } else if (isApplied) {
      statusColor = '#F59E0B';
      statusText = 'CHỜ DUYỆT';
      badgeBg = '#FEF3C7';
      badgeText = '#D97706';
    } else if (isCompleted) {
      statusColor = '#64748B';
      statusText = 'HOÀN THÀNH';
      badgeBg = '#F8FAFC';
      badgeText = '#64748B';
    }

    return (
      <View key={shift.id} style={[styles.shiftCard, { borderLeftColor: statusColor }]}>
        {/* Top: Status Badges & Quick Action */}
        <View style={styles.cardHeaderRow}>
          <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: badgeText }]}>{statusText}</Text>
          </View>
          <TouchableOpacity
            style={styles.ellipsisButton}
            activeOpacity={0.6}
            onPress={() => handleShiftOptions(shift)}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.shiftTitle}>{shift.title}</Text>

        {/* Location & Brand */}
        <View style={styles.cardInfoRow}>
          <View style={styles.iconCircleBg}>
            <Ionicons name="storefront-outline" size={14} color="#FF6B00" />
          </View>
          <Text style={styles.infoText} numberOfLines={1}>
            {shift.shopName}
          </Text>
        </View>

        <View style={styles.cardInfoRow}>
          <View style={styles.iconCircleBg}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
          </View>
          <Text style={styles.infoText} numberOfLines={1}>
            {shift.address}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Bottom Metadata & Earnings */}
        <View style={styles.cardFooterRow}>
          <View style={styles.timeMeta}>
            <Ionicons name="time-outline" size={15} color="#FF6B00" style={{ marginRight: 6 }} />
            <Text style={styles.timeText}>{shift.time}</Text>
          </View>
          <View style={styles.earningsWrapper}>
            <Text style={styles.earningsLabelText}>
              {isCompleted ? 'Lương thực nhận' : 'Lương ước tính'}
            </Text>
            <Text style={styles.earningsValueText}>
              {Math.round(shift.hourlyRate * getShiftHours(shift)).toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>

        {/* Interactive Action Button for non-completed */}
        {!isCompleted && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isWorking && styles.actionButtonActive,
              isApplied && styles.actionButtonDisabled
            ]}
            disabled={isApplied}
            activeOpacity={0.8}
            onPress={() => navigateTo('student_checkin', { shiftId: shift.id })}
          >
            <Ionicons
              name={isWorking ? "checkmark-circle-outline" : isApplied ? "hourglass-outline" : "location-outline"}
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.actionButtonText}>
              {isWorking ? 'Đã điểm danh' : isApplied ? 'Chờ duyệt hồ sơ...' : 'Điểm danh GPS ngay'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const pendingConfirmationPayrolls = (payrolls || []).filter(p => p.status === 'PendingStudentConfirmation' || p.Status === 'PendingStudentConfirmation');

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sleek Custom Top Navigation Bar */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerTitle}>Lịch làm việc</Text>
            <Text style={styles.headerSubtitle}>Chào ngày mới! Xem lịch trình của bạn</Text>
          </View>
          <TouchableOpacity style={styles.headerBadge} activeOpacity={0.7} onPress={() => loadMyApplications()}>
            <Text style={styles.headerBadgeText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
        {/* Earnings Card with Modern FinTech Styling */}
        <View style={styles.earningsCard}>
          {/* Abstract backgrounds bubbles for visual depth */}
          <View style={styles.cardBubbleLeft} />
          <View style={styles.cardBubbleRight} />

          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsTitle}>Thu nhập tháng này</Text>
              <Text style={styles.earningsSubTitle}>Tổng thu nhập tháng này của bạn</Text>
            </View>
            <View style={styles.walletIconContainer}>
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.earningsMainValue}>{Math.round(totalEarnings).toLocaleString('vi-VN')}đ</Text>

          <View style={styles.earningsFooter}>
            <View style={styles.earningsSplit}>
              <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} />
              <Text style={styles.earningsSplitText}>Đã nhận: {Math.round(completedEarnings).toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={styles.earningsSplitDivider} />
            <View style={styles.earningsSplit}>
              <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} />
              <Text style={styles.earningsSplitText}>Chờ nhận: {Math.round(projectedEarnings).toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        </View>

        {pendingConfirmationPayrolls.length > 0 && (
          <View style={styles.pendingSection}>
            <View style={styles.pendingSectionHeader}>
              <View style={styles.alertIconBg}>
                <Ionicons name="notifications-outline" size={14} color="#FF6B00" />
              </View>
              <Text style={styles.pendingSectionTitle}>BẢNG LƯƠNG CHỜ BẠN XÁC NHẬN</Text>
            </View>

            {pendingConfirmationPayrolls.map((payroll) => {
              const storeName = payroll.shopName || payroll.ShopName || 'Cửa hàng ProxiJob';
              const initialChar = storeName.charAt(0).toUpperCase();

              return (
                <View key={payroll.id || payroll.Id} style={styles.pendingReceiptCard}>
                  {/* Left & Right Circular Cutouts for ticket/receipt look */}
                  <View style={styles.cutoutLeft} />
                  <View style={styles.cutoutRight} />

                  {/* Receipt Header */}
                  <Text style={styles.receiptTitleHeader}>BIÊN LAI ĐỐI SOÁT CA</Text>

                  <View style={styles.pendingCardHeader}>
                    <View style={styles.storeAvatarBg}>
                      <Text style={styles.storeAvatarText}>{initialChar}</Text>
                    </View>
                    <View style={styles.pendingStoreInfo}>
                      <Text style={styles.pendingStoreName} numberOfLines={1}>{storeName}</Text>
                      <Text style={styles.pendingOrderId}>Mã hóa đơn: #{payroll.id || payroll.Id}</Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <View style={styles.pendingBadgeDot} />
                      <Text style={styles.pendingBadgeText}>Chờ xác nhận</Text>
                    </View>
                  </View>

                  {/* Dashed Separator */}
                  <View style={styles.receiptDashedLine} />

                  {/* Receipt Key-Value Details */}
                  <View style={styles.receiptDetailsContainer}>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Thời gian làm việc</Text>
                      <Text style={styles.receiptRowValue}>
                        {formatHoursAndMinutes(payroll.totalHours || payroll.TotalHours)}
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Hình thức thanh toán</Text>
                      <Text style={[styles.receiptRowValue, { color: '#059669' }]}>
                        Ví MoMo / Tiền mặt
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Trạng thái đối soát</Text>
                      <Text style={[styles.receiptRowValue, { color: '#FF6B00' }]}>
                        Chủ quán đã chuyển tiền
                      </Text>
                    </View>
                  </View>

                  {/* Dashed Separator */}
                  <View style={styles.receiptDashedLine} />

                  {/* Payout Summary */}
                  <View style={styles.receiptAmountContainer}>
                    <Text style={styles.receiptAmountLabel}>THỰC NHẬN (VND)</Text>
                    <Text style={styles.receiptAmountValue}>
                      {payroll.finalAmount ? (Math.round(payroll.finalAmount).toLocaleString('vi-VN') + ' đ') : '0 đ'}
                    </Text>
                  </View>

                  {/* Payment Alert Banner */}
                  <View style={styles.paymentAlertBanner}>
                    <Ionicons name="information-circle" size={14} color="#D97706" style={{ marginRight: 6 }} />
                    <Text style={styles.paymentAlertText}>
                      Hãy kiểm tra ví trước khi bấm xác nhận nhé!
                    </Text>
                  </View>



                  {/* Premium Solid Action Button */}
                  <TouchableOpacity
                    style={styles.pendingActionBtn}
                    onPress={() => handleOpenConfirmModal(payroll)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle-sharp" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.pendingActionBtnText}>Đã nhận tiền & Đánh giá chủ quán </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Elegant Week Timeline Navigation */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={handlePrevWeek} style={styles.navWeekBtn} activeOpacity={0.6}>
                <Ionicons name="chevron-back" size={16} color="#64748B" />
              </TouchableOpacity>
              <Text style={styles.timelineHeading}>{getTimelineLabel()}</Text>
              <TouchableOpacity onPress={handleNextWeek} style={styles.navWeekBtn} activeOpacity={0.6}>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.todayButton} onPress={handleGoToToday} activeOpacity={0.7}>
              <Text style={styles.todayButtonText}>Hôm nay</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
            {weekDays.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              const dayHasShift = myShifts.some(s => isSameDate(s.startTime, day.apiDateStr));
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayHeaderCell,
                    isSelected && styles.selectedDayHeaderCell,
                    day.isToday && !isSelected && styles.todayHeaderCell
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDayIndex(idx)}
                >
                  <Text style={[
                    styles.dayNameText,
                    isSelected && styles.selectedDayNameText,
                    day.isToday && !isSelected && { color: '#FF6B00', fontWeight: '800' }
                  ]}>
                    {day.name}
                  </Text>
                  <Text style={[
                    styles.dayDateText,
                    isSelected && styles.selectedDayDateText,
                    day.isToday && !isSelected && { color: '#FF6B00' }
                  ]}>
                    {day.date.split('/')[0]}
                  </Text>

                  {dayHasShift && (
                    <View style={[
                      styles.shiftIndicatorDot,
                      isSelected ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#FF6B00' }
                    ]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab Selection Segments */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'upcoming' && styles.activeTabButton]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'upcoming' && styles.activeTabButtonText]}>
              Ca sắp tới ({upcomingShifts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'completed' && styles.activeTabButton]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'completed' && styles.activeTabButtonText]}>
              Lịch sử ca ({completedShifts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Header title */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>{getDaySummaryTitle()}</Text>
          {selectedDay?.isToday && activeTab === 'upcoming' && (
            <View style={styles.todayPillBadge}>
              <Text style={styles.todayPillText}>Hôm nay</Text>
            </View>
          )}
        </View>

        {activeTab === 'completed' && (
          <View style={styles.historyFilterContainer}>
            <TouchableOpacity
              style={[styles.historyFilterBtn, historyFilter === 'day' && styles.historyFilterBtnActive]}
              activeOpacity={0.8}
              onPress={() => setHistoryFilter('day')}
            >
              <Text style={[styles.historyFilterBtnText, historyFilter === 'day' && styles.historyFilterBtnTextActive]}>
                Ngày
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyFilterBtn, historyFilter === 'week' && styles.historyFilterBtnActive]}
              activeOpacity={0.8}
              onPress={() => setHistoryFilter('week')}
            >
              <Text style={[styles.historyFilterBtnText, historyFilter === 'week' && styles.historyFilterBtnTextActive]}>
                Tuần
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyFilterBtn, historyFilter === 'month' && styles.historyFilterBtnActive]}
              activeOpacity={0.8}
              onPress={() => setHistoryFilter('month')}
            >
              <Text style={[styles.historyFilterBtnText, historyFilter === 'month' && styles.historyFilterBtnTextActive]}>
                Tháng
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Shifts List mapping */}
        <View style={styles.shiftsListContainer}>
          {activeTab === 'upcoming' ? (
            upcomingShifts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                  <Ionicons name="calendar-clear-outline" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptyText}>Trống lịch trình</Text>
                <Text style={styles.emptySubText}>Bạn không có ca làm việc nào trong ngày này.</Text>
              </View>
            ) : (
              upcomingShifts.map(renderShiftItem)
            )
          ) : (
            completedShifts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                  <Ionicons name="checkmark-done-circle-outline" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptyText}>Chưa có lịch sử ca</Text>
                <Text style={styles.emptySubText}>Hoàn thành ca làm việc để xem lịch sử tích lũy tại đây.</Text>
              </View>
            ) : (
              completedShifts.map(renderShiftItem)
            )
          )}
        </View>
      </ScrollView>

      {/* Student Rating & Confirmation Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContent, { maxHeight: '80%' }]}>
            {/* Close Button Top Right */}
            <TouchableOpacity
              style={styles.dialogCloseHeaderBtn}
              onPress={() => setIsModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: 'center',
                paddingBottom: keyboardHeight > 0 ? keyboardHeight - 20 : 10
              }}
              keyboardShouldPersistTaps="handled"
              style={{ width: '100%' }}
            >
              {/* Decorative Header Icon */}
              <View style={styles.dialogHeaderIconBg}>
                <Ionicons name="cash" size={28} color="#10B981" />
              </View>

              <Text style={styles.dialogHeading}>Xác nhận đã nhận lương</Text>
              <Text style={styles.dialogSubheading}>
                Xác thực việc nhận tiền thanh toán trực tiếp/chuyển khoản từ chủ quán.
              </Text>

              {/* Receipt Summary Card inside Modal */}
              <View style={styles.dialogSummaryCard}>
                <Text style={styles.dialogSummaryLabel}>SỐ TIỀN THANH TOÁN</Text>
                <Text style={styles.dialogSummaryAmount}>
                  {selectedPayroll?.finalAmount ? (Math.round(selectedPayroll.finalAmount).toLocaleString('vi-VN') + ' đ') : '0 đ'}
                </Text>
                <View style={styles.dialogStoreBadge}>
                  <Ionicons name="storefront" size={12} color="#475569" style={{ marginRight: 4 }} />
                  <Text style={styles.dialogStoreName} numberOfLines={1}>
                    {selectedPayroll?.shopName || selectedPayroll?.ShopName || 'Cửa hàng ProxiJob'}
                  </Text>
                </View>
              </View>

              {/* Checkbox (Secure Confirmation) */}
              <TouchableOpacity
                style={styles.dialogCheckboxRow}
                onPress={() => setIsConfirmedCheckbox(!isConfirmedCheckbox)}
                activeOpacity={0.7}
              >
                <View style={styles.dialogCheckboxActive}>
                  <Ionicons
                    name={isConfirmedCheckbox ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={isConfirmedCheckbox ? "#10B981" : "#94A3B8"}
                  />
                </View>
                <Text style={styles.dialogCheckboxText}>
                  Tôi cam đoan đã nhận đủ và chính xác số tiền trên.
                </Text>
              </TouchableOpacity>

              {/* Star Rating Section */}
              <Text style={styles.dialogLabel}>ĐÁNH GIÁ MÔI TRƯỜNG LÀM VIỆC</Text>
              <View style={styles.dialogStarRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                    style={styles.dialogStarWrapper}
                  >
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={30}
                      color={star <= rating ? "#F59E0B" : "#CBD5E1"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feedback Comments Text Input */}
              <Text style={styles.dialogLabel}>NHẬN XÉT VỀ CỬA HÀNG (TÙY CHỌN)</Text>
              <View style={styles.dialogInputContainer}>
                <TextInput
                  style={styles.dialogFeedbackInput}
                  value={comments}
                  onChangeText={(text) => setComments(text)}
                  placeholder="Chủ quán thân thiện, môi trường làm việc thoải mái..."
                  multiline={true}
                  numberOfLines={2}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.dialogSubmitBtn, !isConfirmedCheckbox && styles.dialogSubmitBtnDisabled]}
                disabled={confirmReceiptMutation.isPending || !isConfirmedCheckbox}
                onPress={handleSubmitConfirm}
                activeOpacity={0.8}
              >
                {confirmReceiptMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.dialogSubmitBtnText}>Xác nhận & Gửi đánh giá</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Leave/Swap Request Modal */}
      <Modal
        visible={requestModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalHeading}>
                {isSwapRequest ? 'Yêu cầu đổi ca làm việc' : 'Yêu cầu xin nghỉ phép'}
              </Text>
              <Text style={styles.modalSubheading}>
                {isSwapRequest
                  ? 'Gửi yêu cầu xin chuyển đổi sang một ca làm việc khác đến Chủ quán. Vui lòng ghi rõ thông tin chi tiết.'
                  : 'Xin nghỉ phép cho ca làm việc đã được duyệt này. Yêu cầu của bạn cần được Chủ quán phê duyệt.'}
              </Text>

              <View style={styles.modalDivider} />

              <View style={styles.checkboxRow}>
                <View style={[styles.checkboxBox, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}>
                  <Text style={styles.checkboxTick}>✓</Text>
                </View>
                <Text style={styles.checkboxText}>
                  Ca làm: <Text style={{ fontWeight: '800', color: '#1F2937' }}>{selectedShiftForRequest?.title}</Text> ({selectedShiftForRequest?.time})
                </Text>
              </View>

              <Text style={styles.modalLabel}>LÝ DO CHI TIẾT (BẮT BUỘC)</Text>
              <View style={[styles.inputContainer, reasonError ? { borderColor: '#EF4444', borderWidth: 1 } : {}]}>
                <TextInput
                  style={styles.feedbackInput}
                  value={requestReason}
                  onChangeText={(text) => {
                    setRequestReason(text);
                    if (text.trim().length >= 10) {
                      setReasonError('');
                    }
                  }}
                  placeholder={isSwapRequest
                    ? "Ví dụ: Tôi muốn đổi sang ca chiều ngày mai 05/07 từ 13h-17h vì có lịch học đột xuất..."
                    : "Ví dụ: Em có lịch thi học kỳ đột xuất tại trường nên không thể tham gia ca làm này..."}
                  multiline={true}
                  numberOfLines={3}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {reasonError ? (
                <Text style={{ color: '#EF4444', fontSize: 12, marginTop: -4, marginBottom: 12, fontWeight: '600' }}>
                  {reasonError}
                </Text>
              ) : null}

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: '#EF4444' }]}
                  disabled={cancelMutation.isPending}
                  onPress={handleSubmitRequest}
                >
                  {cancelMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Gửi yêu cầu duyệt ⚡</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setRequestModalVisible(false)}
                >
                  <Text style={styles.modalCloseBtnText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Bottom Sheet Option Modal */}
      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetKnob} />

            <Text style={styles.bottomSheetTitle}>Tùy chọn ca làm việc</Text>
            <Text style={styles.bottomSheetSubtitle}>
              Bạn muốn gửi yêu cầu nào cho Chủ quán cho ca làm:{"\n"}
              <Text style={{ fontWeight: '800', color: theme.colors.text }}>{selectedShiftForRequest?.title}</Text>
            </Text>

            <View style={styles.bottomSheetButtons}>
              {/* Option 1: Xin nghỉ phép */}
              <TouchableOpacity
                style={[styles.bottomSheetBtn, { borderLeftColor: theme.colors.danger }]}
                onPress={() => {
                  setOptionsModalVisible(false);
                  setIsSwapRequest(false);
                  setRequestReason('');
                  setRequestModalVisible(true);
                }}
              >
                <View style={[styles.bottomSheetIconBg, { backgroundColor: theme.colors.danger + '12' }]}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bottomSheetBtnTitle, { color: theme.colors.danger }]}>Xin nghỉ phép ca này</Text>
                  <Text style={styles.bottomSheetBtnDesc}>Gửi đơn xin nghỉ phép ca làm đã được duyệt</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Option 2: Xin đổi ca */}
              <TouchableOpacity
                style={[styles.bottomSheetBtn, { borderLeftColor: theme.colors.primary }]}
                onPress={() => {
                  setOptionsModalVisible(false);
                  setIsSwapRequest(true);
                  setRequestReason('');
                  setRequestModalVisible(true);
                }}
              >
                <View style={[styles.bottomSheetIconBg, { backgroundColor: theme.colors.primary + '12' }]}>
                  <Ionicons name="swap-horizontal-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bottomSheetBtnTitle, { color: theme.colors.primary }]}>Yêu cầu đổi ca làm</Text>
                  <Text style={styles.bottomSheetBtnDesc}>Đề xuất đổi sang một ca làm việc khác</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.bottomSheetCancelBtn}
              onPress={() => setOptionsModalVisible(false)}
            >
              <Text style={styles.bottomSheetCancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1.0,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: '#FFF3EB',
    borderWidth: 1,
    borderColor: '#FFE0CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 130,
  },
  earningsCard: {
    backgroundColor: '#FF6B00',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 24,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  cardBubbleLeft: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    top: -60,
    left: -40,
  },
  cardBubbleRight: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -90,
    right: -40,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  earningsTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    opacity: 0.98,
  },
  earningsSubTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginTop: 1,
  },
  walletIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsMainValue: {
    fontSize: 36,
    fontWeight: '950',
    color: '#FFFFFF',
    marginVertical: 12,
    zIndex: 2,
    letterSpacing: -0.8,
  },
  earningsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
    marginTop: 2,
    zIndex: 2,
  },
  earningsSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  earningsSplitText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  earningsSplitDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  timelineSection: {
    marginTop: 20,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  timelineHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFEBE0',
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B00',
  },
  daysScroll: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  dayHeaderCell: {
    width: 52,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedDayHeaderCell: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  todayHeaderCell: {
    borderWidth: 1.5,
    borderColor: '#FF6B00',
    backgroundColor: '#FFF8F4',
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  selectedDayNameText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
  },
  dayDateText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  selectedDayDateText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  shiftIndicatorDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabButtonText: {
    color: '#FF6B00',
    fontWeight: '800',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  todayPillBadge: {
    backgroundColor: '#FFF3EB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  todayPillText: {
    color: '#FF6B00',
    fontSize: 10,
    fontWeight: '800',
  },
  shiftsListContainer: {
    paddingHorizontal: 20,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 5,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ellipsisButton: {
    padding: 2,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 10,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircleBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  earningsWrapper: {
    alignItems: 'flex-end',
  },
  earningsLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  earningsValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
  },
  actionButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 14,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  actionButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowColor: 'transparent',
    elevation: 0,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 4,
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
  pendingSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  pendingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  alertIconBg: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#FFEFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B00',
    letterSpacing: 1,
  },
  pendingReceiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cutoutLeft: {
    position: 'absolute',
    left: -10,
    top: '30%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  cutoutRight: {
    position: 'absolute',
    right: -10,
    top: '30%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  receiptTitleHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  receiptDetailsContainer: {
    marginVertical: 4,
    gap: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  receiptRowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  receiptAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 2,
  },
  receiptAmountLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  receiptAmountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF6B00',
  },
  barcodeWrapper: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 18,
    opacity: 0.8,
  },
  barcodeContainer: {
    flexDirection: 'row',
    height: 30,
    alignItems: 'stretch',
  },
  barcodeBar: {
    height: '100%',
  },
  barcodeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 6,
  },
  pendingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  storeAvatarBg: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFEFEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B00',
  },
  pendingStoreInfo: {
    flex: 1,
    marginRight: 8,
  },
  pendingStoreName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingOrderId: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  receiptDashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 4,
    marginBottom: 14,
  },
  receiptBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  receiptBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  receiptBadgeVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  paymentAlertBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  paymentAlertText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
    flex: 1,
    lineHeight: 14,
  },
  pendingAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  pendingAmountRowLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9E4A28',
    letterSpacing: 0.5,
  },
  pendingAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF6B00',
  },
  pendingCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  pendingActionBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pendingActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  navWeekBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubheading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 16,
  },
  modalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  starIcon: {
    fontSize: 28,
    color: '#E2E8F0',
  },
  starIconActive: {
    color: '#FF6B00',
  },
  inputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  feedbackInput: {
    width: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontSize: 12,
    color: '#0F172A',
  },
  modalActionRow: {
    marginTop: 20,
    gap: 10,
  },
  modalSubmitBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalCloseBtn: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 99,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  bottomSheetKnob: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  bottomSheetSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  bottomSheetButtons: {
    gap: 12,
    marginBottom: 16,
  },
  bottomSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bottomSheetIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bottomSheetBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  bottomSheetBtnDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  bottomSheetCancelBtn: {
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  historyFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  historyFilterBtn: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyFilterBtnActive: {
    backgroundColor: '#FFEFEB',
    borderColor: '#FFDBCC',
  },
  historyFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  historyFilterBtnTextActive: {
    color: '#FF6B00',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    maxHeight: '85%',
  },
  dialogCloseHeaderBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dialogHeaderIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  dialogSubheading: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  dialogSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    width: '100%',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogSummaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  dialogSummaryAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#10B981',
    marginVertical: 4,
  },
  dialogStoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 2,
    maxWidth: '90%',
  },
  dialogStoreName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  dialogCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  dialogCheckboxActive: {
    marginRight: 8,
  },
  dialogCheckboxText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  dialogLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dialogStarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dialogStarWrapper: {
    padding: 4,
  },
  dialogInputContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 18,
  },
  dialogFeedbackInput: {
    height: 60,
    textAlignVertical: 'top',
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },
  dialogSubmitBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  dialogSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dialogSubmitBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
});
