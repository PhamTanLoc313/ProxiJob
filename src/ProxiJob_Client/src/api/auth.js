import { IDENTITY_API_BASE_URL } from './apiConfig';

const AUTH_TOKEN_KEY = '@proxijob_auth_token';
const AUTH_USER_KEY = '@proxijob_auth_user';

// Base64 decoder for JWT token
export function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.log('[ProxiJob Auth] Error decoding JWT:', error.message);
    return null;
  }
}

/**
 * Call backend login API
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{token: string, user: object}>}
 */
export async function loginApi(email, password) {
  try {
    const response = await fetch(`${IDENTITY_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = resData.message || (resData.errors && resData.errors.join(', ')) || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      throw new Error(errorMsg);
    }

    const authData = resData.data || resData;
    const token = authData.accessToken || authData.token;
    const refreshToken = authData.refreshToken;

    if (!token) {
      throw new Error('Không nhận được token từ hệ thống.');
    }

    const decodedUser = decodeJwt(token);
    const rawRole = decodedUser['role'] || decodedUser['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
    const roleStr = (Array.isArray(rawRole) ? rawRole[0] : rawRole).toString();
    const mappedRole = roleStr.toLowerCase() === 'student' ? 'student' : 'employer';
    const userId = parseInt(decodedUser.sub || decodedUser['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 1, 10);
    const subTier = decodedUser['subscription_tier'] || 'Free';
    const avatarUrl = decodedUser['avatar_url'] || '';

    const session = {
      token: token,
      refreshToken: refreshToken,
      user: {
        id: userId,
        email: decodedUser.email || email,
        name: decodedUser.name || decodedUser.unique_name || decodedUser['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || (roleStr.toLowerCase() === 'student' ? 'Sinh viên' : 'Chủ quán'),
        role: mappedRole,
        subscriptionTier: subTier,
        avatarUrl: avatarUrl,
      }
    };

    storeAuthSession(session.token, session.user);
    return session;
  } catch (error) {
    console.log('[ProxiJob API] loginApi failed:', error.message);
    throw error;
  }
}

/**
 * Call backend register API
 * @param {string} fullName 
 * @param {string} email 
 * @param {string} password 
 * @param {string} confirmPassword 
 * @param {number} userType 0 = student, 1 = employer/business
 * @returns {Promise<object>}
 */
export async function registerApi(fullName, email, password, confirmPassword, userType) {
  try {
    const response = await fetch(`${IDENTITY_API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullName, email, password, confirmPassword, userType }),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = resData.message || (resData.errors && resData.errors.join(', ')) || 'Đăng ký thất bại. Vui lòng kiểm tra lại.';
      throw new Error(errorMsg);
    }

    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob API] registerApi failed:', error.message);
    throw error;
  }
}

/**
 * Validate token and get current user profile
 * @param {string} token 
 * @returns {Promise<object>}
 */
export async function checkAuthApi(token) {
  try {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) {
      throw new Error('Token không hợp lệ.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    const rawRole = decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
    const roleStr = (Array.isArray(rawRole) ? rawRole[0] : rawRole).toString();
    const mappedRole = roleStr.toLowerCase() === 'student' ? 'student' : 'employer';
    const userId = parseInt(decoded.sub || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 1, 10);
    const subTier = decoded['subscription_tier'] || 'Free';
    const avatarUrl = decoded['avatar_url'] || '';

    return {
      id: userId,
      email: decoded.email || '',
      name: decoded.name || decoded.unique_name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || (roleStr.toLowerCase() === 'student' ? 'Sinh viên' : 'Chủ quán'),
      role: mappedRole,
      subscriptionTier: subTier,
      avatarUrl: avatarUrl,
    };
  } catch (error) {
    console.log('[ProxiJob Auth] checkAuthApi failed:', error.message);
    throw error;
  }
}

export function storeAuthSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

/**
 * Request password reset OTP
 */
export async function forgotPasswordApi(email) {
  try {
    const response = await fetch(`${IDENTITY_API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = resData.message || (resData.errors && resData.errors.join(', ')) || 'Gửi yêu cầu khôi phục mật khẩu thất bại.';
      throw new Error(errorMsg);
    }

    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob Auth API] forgotPasswordApi failed:', error.message);
    throw error;
  }
}

/**
 * Verify password reset OTP
 */
export async function verifyResetTokenApi(email, code) {
  try {
    const response = await fetch(`${IDENTITY_API_BASE_URL}/auth/verify-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = resData.message || (resData.errors && resData.errors.join(', ')) || 'Mã xác minh không chính xác hoặc đã hết hạn.';
      throw new Error(errorMsg);
    }

    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob Auth API] verifyResetTokenApi failed:', error.message);
    throw error;
  }
}

/**
 * Reset password using OTP
 */
export async function resetPasswordApi(email, code, newPassword, confirmNewPassword) {
  try {
    const response = await fetch(`${IDENTITY_API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, newPassword, confirmNewPassword }),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = resData.message || (resData.errors && resData.errors.join(', ')) || 'Đặt lại mật khẩu thất bại.';
      throw new Error(errorMsg);
    }

    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob Auth API] resetPasswordApi failed:', error.message);
    throw error;
  }
}

/**
 * Fetch dynamic job post quota for current user
 */
export async function getJobPostQuotaApi() {
  try {
    const token = getStoredToken();
    if (!token) return null;
    const response = await fetch(`${IDENTITY_API_BASE_URL}/plans/job-posts/quota`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob API] getJobPostQuotaApi failed:', error.message);
    return null;
  }
}

/**
 * Consume 1 job post quota after successful post creation
 */
export async function consumeJobPostQuotaApi() {
  try {
    const token = getStoredToken();
    if (!token) return null;
    const response = await fetch(`${IDENTITY_API_BASE_URL}/plans/job-posts/consume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob API] consumeJobPostQuotaApi failed:', error.message);
    return null;
  }
}

/**
 * Fetch subscription plans
 */
export async function getPlansApi() {
  try {
    const response = await fetch(`${IDENTITY_API_BASE_URL}/plans`);
    if (!response.ok) {
      throw new Error(`Failed to fetch plans: ${response.status}`);
    }
    const resData = await response.json();
    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob Auth API] getPlansApi error:', error.message);
    throw error;
  }
}

/**
 * Initiate a plan purchase
 */
export async function purchasePlanApi(planId) {
  try {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const payload = { planId };
    const response = await fetch(`${IDENTITY_API_BASE_URL}/plans/purchase`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errMessages = resData.errors && Array.isArray(resData.errors) ? resData.errors.join(', ') : '';
      const errorMsg = resData.message || errMessages || `Failed to purchase plan: ${response.status}`;
      throw new Error(errorMsg);
    }
    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob Auth API] purchasePlanApi error:', error.message);
    throw error;
  }
}

/**
 * Get payment order status
 */
export async function getPaymentStatusApi(orderId) {
  try {
    const token = getStoredToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${IDENTITY_API_BASE_URL.replace('/api', '')}/api/payments/${orderId}`, {
      method: 'GET',
      headers,
    });
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(resData.message || `Failed to get payment status: ${response.status}`);
    }
    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob Auth API] getPaymentStatusApi error:', error.message);
    throw error;
  }
}

/**
 * Issue new session tokens after payment is confirmed
 */
export async function createPaymentSessionApi(orderId) {
  try {
    const token = getStoredToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${IDENTITY_API_BASE_URL.replace('/api', '')}/api/payments/${orderId}/session`, {
      method: 'POST',
      headers,
    });
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(resData.message || `Failed to create payment session: ${response.status}`);
    }
    return resData.data || resData;
  } catch (error) {
    console.log('[ProxiJob Auth API] createPaymentSessionApi error:', error.message);
    throw error;
  }
}

