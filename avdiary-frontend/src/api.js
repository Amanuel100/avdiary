const API_BASE = 'http://localhost:5000/api';
export const BACKEND_URL = 'http://localhost:5000';

/**
 * Helper function to make authenticated requests.
 * Reads the JWT token from localStorage.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('avdiary-token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ---------- Auth ----------
export const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
};

// ---------- Trades ----------
export const tradesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/trades?${query}`);
  },
  create: (body) => request('/trades', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/trades/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/trades/${id}`, { method: 'DELETE' }),
};

// ---------- Messages ----------
export const messagesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/messages?${query}`);
  },
  markRead: (id) => request(`/messages/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/messages/read-all', { method: 'PUT' }),
  sendAdmin: (body) => request('/messages', { method: 'POST', body: JSON.stringify({ targetUserId: body.userId, content: body.content, type: 'admin' }) }),
};

// ---------- Payments ----------
export const paymentsAPI = {
  getStatus: () => request('/payments'),
  submit: (formData) => {
    const token = localStorage.getItem('avdiary-token');
    return fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    }).then(res => res.json());
  },
};

// ---------- Admin ----------
export const adminAPI = {
  getStats: () => request('/admin/stats'),
  getUsers: () => request('/admin/users'),
  getPendingPayments: () => request('/admin/payments'),
  handlePayment: (body) => request('/admin/payments', { method: 'PUT', body: JSON.stringify(body) }),
  messageAll: (body) => request('/admin/message-all', { method: 'POST', body: JSON.stringify(body) }),
};

// ---------- Referral ----------
export const referralAPI = {
  getInfo: () => request('/referral'),
};