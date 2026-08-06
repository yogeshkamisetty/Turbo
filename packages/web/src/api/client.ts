import axios from 'axios';
import io, { Socket } from 'socket.io-client';

const API_BASE = 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE,
});

let token = '';

export function setAuthToken(newToken: string) {
  token = newToken;
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
}

export function createSocketConnection(): Socket {
  return io(API_BASE, {
    auth: { token },
    query: { token },
    transports: ['websocket', 'polling'],
  });
}

export async function loginAsRole(email: string, pass: string = 'password123') {
  try {
    const res = await apiClient.post('/auth/login', { email, pass });
    if (res.data?.access_token) {
      setAuthToken(res.data.access_token);
      return res.data;
    }
  } catch (e) {
    console.warn('API login fallback triggered for demo persona');
  }

  // Demo session fallback logic
  const role = email.includes('admin') ? 'ADMIN' : email.includes('fleet') ? 'TENANT_MGR' : 'DRIVER';
  const name = email.includes('admin') ? 'System Admin' : email.includes('fleet') ? 'Alice Manager' : 'Driver Dave';
  const tenantName = email.includes('admin') ? 'System Admin' : 'Logistics Fleet A';
  
  const fallbackPayload = {
    access_token: 'demo_jwt_bearer_token_' + Date.now(),
    user: {
      email,
      sub: 'demo-user-id',
      role,
      name,
      tenantName,
      tenantId: role === 'ADMIN' ? null : '11111111-1111-1111-1111-111111111111'
    }
  };
  setAuthToken(fallbackPayload.access_token);
  return fallbackPayload;
}

export async function fetchSessions() {
  try {
    const res = await apiClient.get('/sessions');
    return res.data;
  } catch (e) {
    return [];
  }
}

export async function fetchReceipt(sessionId: string) {
  try {
    const res = await apiClient.get(`/sessions/${sessionId}/receipt`);
    return res.data;
  } catch (e) {
    return null;
  }
}

export async function fetchInvoice() {
  try {
    const res = await apiClient.get('/billing/invoice');
    return res.data;
  } catch (e) {
    return null;
  }
}

export async function fetchCopilotAnalysis(query: string) {
  try {
    const res = await apiClient.post('/sessions/copilot/analyze', { query });
    return res.data;
  } catch (e) {
    return null;
  }
}

export async function fetchBenchmark() {
  try {
    const res = await apiClient.post('/sessions/benchmark');
    return res.data;
  } catch (e) {
    return null;
  }
}
