const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('prahari_token') || localStorage.getItem('sif_sentinel_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('prahari_token', token);
  } else {
    localStorage.removeItem('prahari_token');
    localStorage.removeItem('sif_sentinel_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData upload
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.errors = data.errors;
    error.isDuplicate = data.isDuplicate;
    throw error;
  }

  return data;
}

export const api = {
  // Config
  getConfig: () => request('/config'),

  // Auth
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  getMe: () => request('/auth/me'),

  // Reports
  getReports: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/reports?${query.toString()}`);
  },
  getReportById: (id) => request(`/reports/${id}`),
  createReport: (reportData) => request('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData)
  }),
  updateReportStatus: (id, status) => request(`/reports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  reclassifyReport: (id, reclassificationData) => request(`/reports/${id}/reclassify`, {
    method: 'PATCH',
    body: JSON.stringify(reclassificationData)
  }),
  bulkImport: (formData) => request('/reports/bulk', {
    method: 'POST',
    body: formData
  }),

  // Stats & Audit
  getStats: () => request('/stats'),
  getAuditLogs: (reportId) => request(`/audit${reportId ? `?report_id=${reportId}` : ''}`),

  // Demo Seed
  seedData: () => request('/seed', { method: 'POST' })
};
