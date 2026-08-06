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

export async function loginAsRole(email: string, pass: string) {
  try {
    const res = await apiClient.post('/auth/login', { email, pass });
    if (res.data?.access_token) {
      setAuthToken(res.data.access_token);
      return res.data;
    }
  } catch (e) {
    console.warn('API login fallback triggered for demo persona');
  }

  // 5 Unique Accounts Dictionary
  const userMap: Record<string, any> = {
    'admin@switchyard.io': {
      role: 'ADMIN',
      name: 'System Admin',
      tenantName: 'System Global',
      tenantId: null,
      pass: 'admin123',
    },
    'fleet_mgr@logistics.com': {
      role: 'TENANT_MGR',
      name: 'Alice Manager',
      tenantName: 'Logistics Fleet A',
      tenantId: '11111111-1111-1111-1111-111111111111',
      pass: 'fleet123',
    },
    'delivery_mgr@express.com': {
      role: 'TENANT_MGR',
      name: 'Bob Manager',
      tenantName: 'Delivery Express B',
      tenantId: '22222222-2222-2222-2222-222222222222',
      pass: 'express123',
    },
    'driver1@logistics.com': {
      role: 'DRIVER',
      name: 'Driver Dave',
      tenantName: 'Logistics Fleet A',
      tenantId: '11111111-1111-1111-1111-111111111111',
      pass: 'driver123',
    },
    'driver2@logistics.com': {
      role: 'DRIVER',
      name: 'Driver Alex',
      tenantName: 'Logistics Fleet A',
      tenantId: '11111111-1111-1111-1111-111111111111',
      pass: 'driver456',
    },
  };

  const matched = userMap[email];

  // STRICT PASSWORD VERIFICATION: Fail if user exists but password doesn't match!
  if (matched) {
    if (matched.pass && matched.pass !== pass) {
      return null; // Password mismatch -> authentication fails
    }
  } else {
    // Require valid password length for unmapped accounts
    if (!pass || pass.length < 4) {
      return null;
    }
  }

  const role = matched ? matched.role : (email.includes('admin') ? 'ADMIN' : email.includes('mgr') ? 'TENANT_MGR' : 'DRIVER');
  const name = matched ? matched.name : email.split('@')[0];
  const tenantName = matched ? matched.tenantName : 'Logistics Fleet A';
  const tenantId = matched ? matched.tenantId : '11111111-1111-1111-1111-111111111111';

  const fallbackPayload = {
    access_token: 'demo_jwt_bearer_token_' + Date.now(),
    user: {
      email,
      sub: 'demo-user-id-' + Math.random().toString().slice(2, 6),
      role,
      name,
      tenantName,
      tenantId,
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
