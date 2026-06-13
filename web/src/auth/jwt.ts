import type { UserRole } from '../api/types';

export interface JwtUser {
  userId: number;
  email: string;
  role: UserRole;
}

export function decodeJwt(token: string | null): JwtUser | null {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized));
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}
