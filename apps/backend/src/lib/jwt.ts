import jwt from 'jsonwebtoken';
import { ROLE_HIERARCHY } from '@wacc/shared';
import type { Role } from '@wacc/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

export function signAccessToken(userId: string, tenantId: string, email: string, role: Role): string {
  return jwt.sign({ userId, tenantId, email, role }, JWT_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}
