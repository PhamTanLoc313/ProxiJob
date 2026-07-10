import { useState, useCallback } from 'react';

export const useNavigation = (isEnterprise, showToast, user) => {
  const [currentScreen, setCurrentScreen] = useState('student_dashboard');
  const [navigationStack, _setNavigationStack] = useState([]);
  const [navigationParams, setNavigationParams] = useState({});
  const [upgradeRedirectScreen, setUpgradeRedirectScreen] = useState(null);

  const setNavigationStack = useCallback((stackOrFunc) => {
    _setNavigationStack((prev) => {
      const resolved = typeof stackOrFunc === 'function' ? stackOrFunc(prev) : stackOrFunc;
      if (!Array.isArray(resolved)) return prev;
      return resolved.map(item => {
        if (typeof item === 'string') {
          return { screen: item, params: {} };
        }
        return item;
      });
    });
  }, []);

  const navigateTo = useCallback((screenName, params = {}) => {
    // Guest protection for student screens
    const protectedStudentScreens = [
      'student_calendar',
      'student_checkin',
      'student_portfolio',
      'student_chat'
    ];
    if (protectedStudentScreens.includes(screenName) && !user) {
      showToast('Vui lòng đăng nhập để sử dụng chức năng này!', 'warning');
      setNavigationParams(params);
      _setNavigationStack(prev => [...prev, { screen: currentScreen, params: navigationParams }]);
      setCurrentScreen('login');
      return;
    }

    // Avoid double routing to tab screens to prevent rendering loops and jitter
    const tabScreens = [
      'student_dashboard',
      'student_calendar',
      'student_checkin',
      'student_portfolio',
      'student_chat',
      'employer_approvals',
      'employer_hrm',
      'employer_scheduling',
      'employer_monitor',
      'employer_chat',
      'payroll_settlement'
    ];
    if (currentScreen === screenName && tabScreens.includes(screenName)) {
      setNavigationParams(params);
      return;
    }

    // Gatekeeping middleware
    const restrictedScreens = [
      'employer_hrm',
      'employer_scheduling',
      'employer_monitor',
      'payroll_settlement'
    ];
    if (restrictedScreens.includes(screenName) && !isEnterprise) {
      setUpgradeRedirectScreen(screenName);
      setNavigationParams(params);
      _setNavigationStack(prev => [...prev, { screen: currentScreen, params: navigationParams }]);
      setCurrentScreen('upgrade_package');
      showToast('Vui lòng nâng cấp gói HRM Basic (199.000đ) hoặc Enterprise để sử dụng tính năng!', 'warning');
      return;
    }

    setNavigationParams(params);
    _setNavigationStack(prev => [...prev, { screen: currentScreen, params: navigationParams }]);
    setCurrentScreen(screenName);
  }, [currentScreen, navigationParams, isEnterprise, showToast, user]);

  const goBack = useCallback(() => {
    if (navigationStack.length > 0) {
      const nextStack = [...navigationStack];
      const prev = nextStack.pop();
      _setNavigationStack(nextStack);
      setCurrentScreen(prev.screen);
      setNavigationParams(prev.params || {});
    }
  }, [navigationStack]);

  return {
    currentScreen,
    setCurrentScreen,
    navigationStack,
    setNavigationStack,
    navigationParams,
    setNavigationParams,
    upgradeRedirectScreen,
    setUpgradeRedirectScreen,
    navigateTo,
    goBack
  };
};
