export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type UserRole = 'admin' | 'operator' | 'observer';

export type ShipmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export type IncidentType = 'temperature_violation' | 'humidity_violation' | 'container_opened';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ContainerStatus = 'available' | 'in_use' | 'maintenance' | 'retired';
