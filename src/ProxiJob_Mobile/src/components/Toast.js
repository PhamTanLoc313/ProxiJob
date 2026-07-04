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
  }, [visible]);

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
          color: theme.colors.success,
          icon: 'checkmark-circle-sharp',
          title: 'Thành công'
        };
      case 'error':
        return {
          color: theme.colors.danger,
          icon: 'close-circle-sharp',
          title: 'Thất bại'
        };
      case 'warning':
        return {
          color: theme.colors.warning,
          icon: 'warning-sharp',
          title: 'Cảnh báo'
        };
      case 'info':
      default:
        return {
          color: theme.colors.primary,
          icon: 'information-circle-sharp',
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
          borderLeftColor: config.color,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchArea}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        <View style={styles.contentRow}>
          {/* Badge Icon */}
          <View style={[styles.iconContainer, { backgroundColor: config.color + '12' }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          
          {/* Details */}
          <View style={styles.textContainer}>
            <Text style={[styles.statusTitle, { color: config.color }]}>
              {config.title}
            </Text>
            <Text numberOfLines={2} style={styles.messageText}>
              {message}
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
    left: 16,
    right: 16,
    zIndex: 99999,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  touchArea: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  messageText: {
    fontSize: 13,
    color: '#334155', // Slate-700
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  closeBtnContainer: {
    padding: 4,
    marginLeft: 8,
  },
});
