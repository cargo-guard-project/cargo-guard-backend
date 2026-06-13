import type {
  ApiResponse,
  Cargo,
  Container,
  EventLog,
  ExportPayload,
  Incident,
  Shipment,
  TelemetryRecord,
  TokenPair,
  User,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'cargoguard.accessToken';
const REFRESH_TOKEN_KEY = 'cargoguard.refreshToken';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const contentType = response.headers.get('content-type') || '';
  const parsed = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof parsed === 'object' && parsed?.error ? parsed.error : `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (typeof parsed === 'object' && parsed && 'success' in parsed) {
    const apiResponse = parsed as ApiResponse<T>;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message || 'Request failed');
    }
    return (apiResponse.data ?? parsed) as T;
  }

  return parsed as T;
}

function cargoPayload(payload: Partial<Cargo>) {
  return {
    name: payload.name,
    description: payload.description,
    type: payload.type,
    temperatureMin: payload.temperatureMin,
    temperatureMax: payload.temperatureMax,
    humidityMin: payload.humidityMin,
    humidityMax: payload.humidityMax,
  };
}

function containerPayload(payload: Partial<Container>) {
  return {
    serialNumber: payload.serialNumber,
    name: payload.name,
    status: payload.status,
  };
}

function shipmentPayload(payload: Partial<Shipment>) {
  return {
    status: payload.status,
    startDate: payload.startDate || undefined,
    endDate: payload.endDate || undefined,
    origin: payload.origin,
    destination: payload.destination,
    notes: payload.notes,
    cargoId: payload.cargoId,
    containerId: payload.containerId,
  };
}

function userPayload(payload: Partial<User> & { password?: string }) {
  return {
    email: payload.email,
    password: payload.password || undefined,
    name: payload.name,
    role: payload.role,
  };
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<TokenPair>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    }),
  me: () => apiRequest<User>('/api/me'),
  users: () => apiRequest<User[]>('/api/users'),
  createUser: (payload: Partial<User> & { password: string }) =>
    apiRequest<User>('/api/users', { method: 'POST', body: JSON.stringify(userPayload(payload)) }),
  updateUser: (id: number, payload: Partial<User> & { password?: string }) =>
    apiRequest<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(userPayload(payload)) }),
  deleteUser: (id: number) => apiRequest(`/api/users/${id}`, { method: 'DELETE' }),
  cargo: () => apiRequest<Cargo[]>('/api/cargo'),
  saveCargo: (payload: Partial<Cargo>) =>
    payload.id
      ? apiRequest<Cargo>(`/api/cargo/${payload.id}`, { method: 'PUT', body: JSON.stringify(cargoPayload(payload)) })
      : apiRequest<Cargo>('/api/cargo', { method: 'POST', body: JSON.stringify(cargoPayload(payload)) }),
  deleteCargo: (id: number) => apiRequest(`/api/cargo/${id}`, { method: 'DELETE' }),
  containers: () => apiRequest<Container[]>('/api/containers'),
  saveContainer: (payload: Partial<Container>) =>
    payload.id
      ? apiRequest<Container>(`/api/containers/${payload.id}`, { method: 'PUT', body: JSON.stringify(containerPayload(payload)) })
      : apiRequest<Container>('/api/containers', { method: 'POST', body: JSON.stringify(containerPayload(payload)) }),
  deleteContainer: (id: number) => apiRequest(`/api/containers/${id}`, { method: 'DELETE' }),
  shipments: () => apiRequest<Shipment[]>('/api/shipments'),
  saveShipment: (payload: Partial<Shipment>) =>
    payload.id
      ? apiRequest<Shipment>(`/api/shipments/${payload.id}`, { method: 'PUT', body: JSON.stringify(shipmentPayload(payload)) })
      : apiRequest<Shipment>('/api/shipments', { method: 'POST', body: JSON.stringify(shipmentPayload(payload)) }),
  deleteShipment: (id: number) => apiRequest(`/api/shipments/${id}`, { method: 'DELETE' }),
  shipment: (id: number) => apiRequest<Shipment>(`/api/shipments/${id}`),
  shipmentIncidents: (id: number) => apiRequest<Incident[]>(`/api/shipments/${id}/incidents`),
  shipmentTelemetry: (id: number, limit = 50) =>
    apiRequest<TelemetryRecord[]>(`/api/shipments/${id}/telemetry?limit=${limit}`),
  updateShipmentStatus: (id: number, action: 'start' | 'complete' | 'cancel') =>
    apiRequest<Shipment>(`/api/shipments/${id}/${action}`, { method: 'PUT' }),
  incidents: () => apiRequest<Incident[]>('/api/incidents'),
  resolveIncident: (id: number) => apiRequest<Incident>(`/api/incidents/${id}/resolve`, { method: 'PUT' }),
  eventLogs: () => apiRequest<EventLog[]>('/api/events?limit=100'),
  exportData: () => apiRequest<ExportPayload>('/api/admin/data/export'),
  importData: (payload: unknown) =>
    apiRequest<{ imported: Record<string, number>; skipped: string[] }>('/api/admin/data/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  backup: async () => {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/data/backup`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.blob();
  },
};
