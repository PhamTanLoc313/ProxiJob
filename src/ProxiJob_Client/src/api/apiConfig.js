import { IDENTITY_API_URL, JOB_API_URL, MANAGEMENT_API_URL } from '../apiConfig';

export const IDENTITY_API_BASE_URL = IDENTITY_API_URL;
export const JOB_API_BASE_URL = JOB_API_URL;
export const MANAGEMENT_API_BASE_URL = MANAGEMENT_API_URL;

const AUTH_TOKEN_KEY = '@proxijob_auth_token';

/**
 * Get HTTP headers for request, including Bearer Authorization token if present
 * @returns {object}
 */
export function getAuthHeader() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
