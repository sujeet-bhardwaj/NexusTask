const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(message, statusCode = 400, errors) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const api = {
  getToken() {
    return localStorage.getItem('nexus_token');
  },

  setToken(token) {
    localStorage.setItem('nexus_token', token);
  },

  clearToken() {
    localStorage.removeItem('nexus_token');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(msg, response.status, data?.errors);
    }

    return data && data.data !== undefined ? data.data : data;
  },

  // Auth
  login: (email, password) =>
    api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  switchDemo: (userId) =>
    api.request('/auth/switch-demo', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  getMe: () => api.request('/auth/me'),

  getUsers: () => api.request('/auth/users'),

  // Dashboard
  getMetrics: (scope = 'global') =>
    api.request(`/dashboard/metrics?scope=${scope}`),

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/tasks${query ? `?${query}` : ''}`);
  },

  getTaskById: (id) => api.request(`/tasks/${id}`),

  updateTaskStatus: (id, status, notes) =>
    api.request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  assignTask: (id, data) =>
    api.request(`/tasks/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  createTask: (data) =>
    api.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Engagements
  getEngagements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/engagements${query ? `?${query}` : ''}`);
  },

  getEngagementById: (id) => api.request(`/engagements/${id}`),

  createEngagement: (data) =>
    api.request('/engagements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateNextPeriod: (id) =>
    api.request(`/engagements/${id}/next-period`, {
      method: 'POST',
    }),

  // Clients
  getClients: () => api.request('/clients'),

  createClient: (data) =>
    api.request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Services
  getServices: () => api.request('/services'),

  createService: (data) =>
    api.request('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
