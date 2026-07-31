import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// ─── Student API ─────────────────────────────────────────

export async function fetchRotation() {
  const { data } = await api.get('/rotation');
  return data;
}

export async function fetchNavigate(offset) {
  const { data } = await api.get(`/rotation/navigate?offset=${offset}`);
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
  const { data } = await api.post('/admin/set-day', { day }, {
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
