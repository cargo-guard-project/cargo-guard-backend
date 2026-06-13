export type UserRole = 'admin' | 'operator' | 'observer';
export type ShipmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type ContainerStatus = 'available' | 'in_use' | 'maintenance' | 'retired';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cargo {
  id: number;
  name: string;
  description?: string;
  type: string;
  temperatureMin: number;
  temperatureMax: number;
  humidityMin: number;
  humidityMax: number;
  createdAt?: string;
}

export interface Container {
  id: number;
  serialNumber: string;
  name: string;
  apiKey?: string;
  status: ContainerStatus;
  lastTemperature?: number;
  lastHumidity?: number;
  lastLocationLat?: number;
  lastLocationLng?: number;
  lastUpdatedAt?: string;
}

export interface Shipment {
  id: number;
  status: ShipmentStatus;
  startDate?: string;
  endDate?: string;
  origin: string;
  destination: string;
  notes?: string;
  cargoId: number;
  containerId: number;
  userId: number;
  cargo?: Cargo;
  container?: Container;
  user?: User;
}

export interface Incident {
  id: number;
  type: string;
  severity: IncidentSeverity;
  description: string;
  resolvedAt?: string;
  createdAt?: string;
  shipmentId: number;
  shipment?: Shipment;
}

export interface TelemetryRecord {
  id: number;
  temperature: number;
  humidity: number;
  latitude?: number;
  longitude?: number;
  batteryLevel?: number;
  timestamp?: string;
  containerId: number;
}

export interface EventLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  details?: Record<string, unknown>;
  userId?: number;
  user?: User;
  createdAt?: string;
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  data: {
    users: User[];
    cargo: Cargo[];
    containers: Container[];
    shipments: Shipment[];
    telemetryRecords: TelemetryRecord[];
    incidents: Incident[];
    eventLogs: EventLog[];
  };
}
