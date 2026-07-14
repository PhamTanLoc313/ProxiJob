import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AppContext } from '../context/AppContext';

export default function Toast() {
  const { toast, hideToast } = useContext(AppContext);
  const { visible, message, type } = toast;

  const [shouldRender, setShouldRender] = useState(false);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate In
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: Platform.OS === 'ios' ? 60 : 30,
          useNativeDriver: true,
          bounciness: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Set auto hide timeout
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, 3500);
    } else if (shouldRender) {
      handleDismiss();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, message, type]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShouldRender(false);
      hideToast();
    });
  };

  if (!shouldRender) {
    return null;
  }

  // Get status details based on type
  const getStatusConfig = () => {
    switch (type) {
      case 'success':
        return {
          color: '#10B981', // Emerald 500
          bgColor: '#ECFDF5', // Emerald 50
          iconName: 'checkmark',
          title: 'Thành công'
        };
      case 'error':
        return {
          color: '#EF4444', // Red 500
          bgColor: '#FEF2F2', // Red 50
          iconName: 'alert',
          title: 'Thất bại'
        };
      case 'warning':
        return {
          color: '#F59E0B', // Amber 500
          bgColor: '#FFFBEB', // Amber 50
          iconName: 'warning',
          title: 'Cảnh báo'
        };
      case 'info':
      default:
        return {
          color: '#3B82F6', // Blue 500
          bgColor: '#EFF6FF', // Blue 50
          iconName: 'information',
          title: 'Thông báo'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchArea}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        <View style={styles.contentRow}>
          {/* Badge Icon (Light background capsule containing solid color circle) */}
          <View style={[styles.iconBadge, { backgroundColor: config.bgColor }]}>
            <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
              <Ionicons name={config.iconName} size={13} color="#FFFFFF" />
            </View>
          </View>
          
          {/* Details */}
          <View style={styles.textContainer}>
            <Text numberOfLines={2} style={styles.messageText}>
              {message}
            </Text>
            <Text style={[styles.statusActionText, { color: config.color }]}>
              {config.title}
            </Text>
          </View>

          {/* Close indicator */}
          <View style={styles.closeBtnContainer}>
            <Ionicons name="close" size={16} color="#94A3B8" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 99999,
    backgroundColor: '#FFFFFF',
    borderRadius: 999, // Pill shape capsule
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  touchArea: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B', // Slate-800
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
    lineHeight: 16,
  },
  statusActionText: {
    fontSize: 11,
    fontWeight: '750',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  closeBtnContainer: {
    padding: 6,
    marginRight: 6,
  },
});
