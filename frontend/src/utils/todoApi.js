import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Separate axios instance for To-Do APIs with 35s timeout to handle cold starts
const todoApi = axios.create({
  baseURL: API_BASE,
  timeout: 35000,
});

// Token persistently initialized from localStorage so user never has to log in again
let authToken = typeof window !== 'undefined' ? localStorage.getItem('todo_token') || null : null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('todo_token', token);
  } else {
    localStorage.removeItem('todo_token');
  }
}

export function getAuthToken() {
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('todo_token') || null;
  }
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('todo_token');
    localStorage.removeItem('todo_cached_user');
  }
}

// Attach auth token to every request
todoApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
todoApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────

export async function registerUser(username, password) {
  const { data } = await todoApi.post('/auth/register', { username, password });
  return data;
}

export async function loginUser(username, password) {
  const { data } = await todoApi.post('/auth/login', { username, password });
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function logoutUser() {
  try {
    await todoApi.post('/auth/logout');
  } catch {
    // Ignore errors on logout
  }
  clearAuthToken();
}

export async function fetchMe() {
  const { data } = await todoApi.get('/auth/me');
  return data;
}

export async function checkCapacity() {
  const { data } = await todoApi.get('/auth/capacity');
  return data;
}

// ─── Monthly Tasks API ────────────────────────────────────

export async function getMonthlyTasks() {
  const { data } = await todoApi.get('/todos/monthly');
  return data;
}

export async function createMonthlyTask(task) {
  const { data } = await todoApi.post('/todos/monthly', task);
  return data;
}

export async function updateMonthlyTask(id, updates) {
  const { data } = await todoApi.put(`/todos/monthly/${id}`, updates);
  return data;
}

export async function deleteMonthlyTask(id) {
  const { data } = await todoApi.delete(`/todos/monthly/${id}`);
  return data;
}

// ─── Weekly Tasks API ─────────────────────────────────────

export async function getWeeklyTasks() {
  const { data } = await todoApi.get('/todos/weekly');
  return data;
}

export async function createWeeklyTask(task) {
  const { data } = await todoApi.post('/todos/weekly', task);
  return data;
}

export async function updateWeeklyTask(id, updates) {
  const { data } = await todoApi.put(`/todos/weekly/${id}`, updates);
  return data;
}

export async function deleteWeeklyTask(id) {
  const { data } = await todoApi.delete(`/todos/weekly/${id}`);
  return data;
}

export async function generateWeeklyPlan() {
  const { data } = await todoApi.post('/todos/generate-weekly-plan');
  return data;
}

export async function saveGeneratedWeeklyTasks(tasks) {
  const { data } = await todoApi.post('/todos/save-generated-weekly-tasks', { tasks });
  return data;
}

export async function generateAiPlanAgent(prompt) {
  const { data } = await todoApi.post('/todos/ai-plan-agent', { prompt });
  return data;
}

export async function batchCreateTasks(tasks) {
  const { data } = await todoApi.post('/todos/batch-create', { tasks });
  return data;
}

export async function pullTodayFromWeekly() {
  const { data } = await todoApi.post('/todos/pull-today-from-weekly');
  return data;
}

// ─── Daily Tasks API ──────────────────────────────────────

export async function getDailyTasks(date) {
  const params = date ? `?date=${date}` : '';
  const { data } = await todoApi.get(`/todos/daily${params}`);
  return data;
}

export async function createDailyTask(task) {
  const { data } = await todoApi.post('/todos/daily', task);
  return data;
}

export async function updateDailyTask(id, updates) {
  const { data } = await todoApi.put(`/todos/daily/${id}`, updates);
  return data;
}

export async function deleteDailyTask(id) {
  const { data } = await todoApi.delete(`/todos/daily/${id}`);
  return data;
}

export async function addExistingToDaily(taskId, date) {
  const { data } = await todoApi.post('/todos/daily/add-existing', { taskId, date });
  return data;
}

// ─── Progress API ─────────────────────────────────────────

export async function getProgress() {
  const { data } = await todoApi.get('/todos/progress');
  return data;
}

// ─── Critical Admin API ───────────────────────────────────

let criticalAdminToken = typeof window !== 'undefined' ? localStorage.getItem('critical_admin_token') || null : null;

export function setCriticalAdminToken(token) {
  criticalAdminToken = token;
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('critical_admin_token', token);
  } else if (typeof window !== 'undefined') {
    localStorage.removeItem('critical_admin_token');
  }
}

export function clearCriticalAdminToken() {
  criticalAdminToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('critical_admin_token');
  }
}

const criticalAdminApi = axios.create({
  baseURL: API_BASE,
  timeout: 35000,
});

criticalAdminApi.interceptors.request.use((config) => {
  if (criticalAdminToken) {
    config.headers.Authorization = `Bearer ${criticalAdminToken}`;
  }
  return config;
});

export async function criticalAdminLogin(password) {
  const { data } = await criticalAdminApi.post('/critical-admin/login', { password });
  if (data.token) {
    setCriticalAdminToken(data.token);
  }
  return data;
}

export async function getCriticalAdminStats() {
  const { data } = await criticalAdminApi.get('/critical-admin/stats');
  return data;
}

export async function getCriticalAdminUsers() {
  const { data } = await criticalAdminApi.get('/critical-admin/users');
  return data;
}

export async function getCriticalAdminVisitors() {
  const { data } = await criticalAdminApi.get('/critical-admin/visitors');
  return data;
}

export async function getCriticalAdminUserTasks(userId) {
  const { data } = await criticalAdminApi.get(`/critical-admin/user-tasks/${userId}`);
  return data;
}

export async function getCriticalAdminAllTasks() {
  const { data } = await criticalAdminApi.get('/critical-admin/all-tasks');
  return data;
}

export async function deleteCriticalAdminUser(userId) {
  const { data } = await criticalAdminApi.delete(`/critical-admin/users/${userId}`);
  return data;
}

export async function disableCriticalAdminUser(userId, disabled) {
  const { data } = await criticalAdminApi.put(`/critical-admin/users/${userId}/disable`, { disabled });
  return data;
}

export async function getCriticalAdminSessions() {
  const { data } = await criticalAdminApi.get('/critical-admin/sessions');
  return data;
}

export async function revokeCriticalAdminSession(sessionId) {
  const { data } = await criticalAdminApi.post(`/critical-admin/sessions/${sessionId}/revoke`);
  return data;
}
