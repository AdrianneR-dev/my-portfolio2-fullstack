const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'authToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.issues = data?.issues;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (email, password) => request('/api/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/auth/me', { auth: true }),

  // Projects
  listProjects: () => request('/api/projects'),
  likeProject: (id, visitorId) => request(`/api/projects/${id}/like`, { method: 'POST', body: { visitorId } }),
  createProject: (data) => request('/api/projects', { method: 'POST', body: data, auth: true }),
  updateProject: (id, data) => request(`/api/projects/${id}`, { method: 'PUT', body: data, auth: true }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE', auth: true }),

  // Skills
  listSkills: ({ search, sort, order } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    const qs = params.toString();
    return request(`/api/skills${qs ? `?${qs}` : ''}`);
  },
  createSkill: (data) => request('/api/skills', { method: 'POST', body: data, auth: true }),
  updateSkill: (id, data) => request(`/api/skills/${id}`, { method: 'PUT', body: data, auth: true }),
  deleteSkill: (id) => request(`/api/skills/${id}`, { method: 'DELETE', auth: true }),

  // Messages (guestbook)
  listMessages: () => request('/api/messages'),
  createMessage: (data) => request('/api/messages', { method: 'POST', body: data }),
  deleteMessage: (id) => request(`/api/messages/${id}`, { method: 'DELETE', auth: true }),
};

/** Gets (or creates and persists) a per-browser anonymous ID used for the race-proof like feature. */
export function getVisitorId() {
  const KEY = 'visitorId';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
