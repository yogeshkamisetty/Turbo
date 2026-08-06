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
    }
    return res.data;
  } catch (e) {
    console.warn('API login fallback:', e);
    return null;
  }
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
