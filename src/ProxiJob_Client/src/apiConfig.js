const isDev = import.meta.env.DEV;

export const IDENTITY_API_URL = isDev
  ? 'http://localhost:5231/api'
  : 'https://api.proxijob.io.vn/api';

export const JOB_API_URL = isDev
  ? 'http://localhost:5021/api'
  : 'https://api.proxijob.io.vn/api';
