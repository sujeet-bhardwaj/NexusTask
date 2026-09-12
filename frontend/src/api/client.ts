const BASE_URL = '/api';

export class ApiError extends Error {
  statusCode: number;
  errors?: any;
  constructor(message: string, statusCode = 400, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem('nexus_token');
  },

  setToken(token: string) {
    localStorage.setItem('nexus_token', token);
  },

  clearToken() {
    localStorage.removeItem('nexus_token');
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
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

    return data.data !== undefined ? data.data : data;
  },

  // Auth
  login: (email: string, password: string) =>
    api.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  switchDemo: (userId: string) =>
    api.request<{ token: string; user: any }>('/auth/switch-demo', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  getMe: () => api.request<any>('/auth/me'),

  getUsers: () => api.request<any[]>('/auth/users'),

  // Dashboard
  getMetrics: (scope: 'global' | 'mine' = 'global') =>
    api.request<{ metrics: any; statusBreakdown: any; recentActivity: any[] }>(`/dashboard/metrics?scope=${scope}`),

  // Tasks
  getTasks: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request<any[]>(`/tasks${query ? `?${query}` : ''}`);
  },

  getTaskById: (id: string) => api.request<any>(`/tasks/${id}`),

  updateTaskStatus: (id: string, status: string, notes?: string) =>
    api.request<any>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  assignTask: (id: string, data: any) =>
    api.request<any>(`/tasks/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  createTask: (data: any) =>
    api.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Engagements
  getEngagements: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request<any[]>(`/engagements${query ? `?${query}` : ''}`);
  },

  getEngagementById: (id: string) => api.request<any>(`/engagements/${id}`),

  createEngagement: (data: any) =>
    api.request<any>('/engagements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateNextPeriod: (id: string) =>
    api.request<any>(`/engagements/${id}/next-period`, {
      method: 'POST',
    }),

  // Clients
  getClients: () => api.request<any[]>('/clients'),

  createClient: (data: any) =>
    api.request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Services
  getServices: () => api.request<any[]>('/services'),

  createService: (data: any) =>
    api.request<any>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
