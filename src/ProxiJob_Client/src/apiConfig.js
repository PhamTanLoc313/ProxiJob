const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const IDENTITY_API_URL = isLocal ? 'http://localhost:5231/api' : 'https://api.proxijob.io.vn/api';
export const JOB_API_URL = isLocal ? 'http://localhost:5021/api' : 'https://api.proxijob.io.vn/api';
export const MANAGEMENT_API_URL = isLocal ? 'http://localhost:5057/api' : 'https://api.proxijob.io.vn/api';


