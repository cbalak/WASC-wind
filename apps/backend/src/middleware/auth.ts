import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, hasRole } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import type { Role } from '@wacc/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        email: string;
        role: Role;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const allowed = roles.some((r) => hasRole(req.user!.role, r));
    if (!allowed) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export async function validateLicence(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: req.user.tenantId },
    select: { licenceStatus: true, licenceExpiry: true },
  });

  if (!tenant) {
    res.status(403).json({ error: 'Tenant not found' });
    return;
  }

  const activeStatuses = ['active', 'trial'];
  if (!activeStatuses.includes(tenant.licenceStatus) || tenant.licenceExpiry < new Date()) {
    res.status(403).json({ error: 'Licence expired or suspended. Please renew your subscription.' });
    return;
  }

  next();
}
