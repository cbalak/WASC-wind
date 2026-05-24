const API_URL = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('accessToken');
}

export async function api(path: string, opts: RequestInit = {}) {
  const url = `${API_URL}/api${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...((opts.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, { ...opts, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}

export const auth = {
  login: (email: string, password: string) => api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload: Record<string, string>) => api('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  refresh: (refreshToken: string) => api('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  me: () => api('/auth/me'),
};

export const conversations = {
  list: (params?: string) => api(`/conversations?${params || ''}`),
  dashboard: () => api('/conversations/dashboard'),
  get: (id: string) => api(`/conversations/${id}`),
  update: (id: string, data: unknown) => api(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const contacts = {
  list: (params?: string) => api(`/contacts?${params || ''}`),
  get: (id: string) => api(`/contacts/${id}`),
  create: (data: unknown) => api('/contacts', { method: 'POST', body: JSON.stringify(data) }),
};

export const tasks = {
  list: (params?: string) => api(`/tasks?${params || ''}`),
  create: (data: unknown) => api('/tasks', { method: 'POST', body: JSON.stringify(data) }),
};

export const ai = {
  draft: (data: unknown) => api('/ai/draft', { method: 'POST', body: JSON.stringify(data) }),
  summarize: (data: unknown) => api('/ai/summarize', { method: 'POST', body: JSON.stringify(data) }),
  extractLead: (data: unknown) => api('/ai/extract-lead', { method: 'POST', body: JSON.stringify(data) }),
  followUp: (data: unknown) => api('/ai/follow-up', { method: 'POST', body: JSON.stringify(data) }),
  usage: () => api('/ai/usage'),
};

export const crm = {
  list: () => api('/crm'),
  create: (data: unknown) => api('/crm', { method: 'POST', body: JSON.stringify(data) }),
  syncContact: (id: string, data: unknown) => api(`/crm/${id}/sync-contact`, { method: 'POST', body: JSON.stringify(data) }),
};

export const analytics = {
  dashboard: () => api('/analytics/dashboard'),
  team: () => api('/analytics/team-performance'),
};

export const admin = {
  tenants: () => api('/admin/tenants'),
  auditLogs: () => api('/admin/audit-logs'),
  securityEvents: () => api('/admin/security-events'),
};
