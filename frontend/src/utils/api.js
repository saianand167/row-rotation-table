import axios from 'axios';

export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.localStorage?.getItem('rrt_api_url')) {
    return window.localStorage.getItem('rrt_api_url');
  }
  const isCapacitor = typeof window !== 'undefined' && (
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:'
  );
  if (isCapacitor) {
    return 'https://row-rotation-table-1.onrender.com/api';
  }
  return 'http://localhost:5000/api';
}

const api = axios.create({
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Student API ─────────────────────────────────────────

export async function fetchRotation() {
  const localDate = getLocalDateString();
  const { data } = await api.get(`/rotation?clientDate=${localDate}`);
  return data;
}

export async function fetchNavigate(offset) {
  const localDate = getLocalDateString();
  const { data } = await api.get(`/rotation/navigate?offset=${offset}&clientDate=${localDate}`);
  return data;
}

// ─── Admin API ───────────────────────────────────────────

export async function verifyPin(pin) {
  const { data } = await api.post('/admin/verify', { pin });
  return data;
}

export async function fetchAdminState(pin) {
  const { data } = await api.get('/admin/state', {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function setDay(pin, day) {
  const localDate = getLocalDateString();
  const { data } = await api.post('/admin/set-day', { day, clientDate: localDate }, {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function getLeaveDays(pin) {
  const { data } = await api.get('/admin/leave-days', {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function addLeaveDay(pin, date) {
  const { data } = await api.post('/admin/leave-days', { date }, {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function removeLeaveDay(pin, date) {
  const { data } = await api.delete('/admin/leave-days', {
    headers: { 'x-admin-pin': pin },
    data: { date },
  });
  return data;
}

export async function setAnnouncement(pin, text, active) {
  const { data } = await api.post('/admin/announcement', { text, active }, {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function setPause(pin, paused) {
  const { data } = await api.post('/admin/pause', { paused }, {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

// ─── Seating Edit API ────────────────────────────────────

export async function fetchAllSeating(pin) {
  const { data } = await api.get('/admin/seating', {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function updateSeating(pin, day, arrangement) {
  const { data } = await api.put(`/admin/seating/${day}`, { arrangement }, {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function resetSeating(pin, day) {
  const { data } = await api.delete(`/admin/seating/${day}`, {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function toggleRowsView(pin, enabled) {
  const { data } = await api.post('/admin/toggle-rows-view', { enabled }, {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function generateRandomSeating(pin) {
  const localDate = getLocalDateString();
  const { data } = await api.post('/admin/generate-random-seating', { clientDate: localDate }, {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}

export async function clearRandomSeating(pin) {
  const { data } = await api.post('/admin/clear-random-seating', {}, {
    headers: { 'x-admin-pin': pin },
  });
  return data;
}
