import { prisma } from './prisma';

export async function logAudit(opts: {
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: opts.tenantId,
        userId: opts.userId,
        action: opts.action,
        resource: opts.resource,
        resourceId: opts.resourceId,
        details: opts.details ?? {},
        ip: opts.ip,
        userAgent: opts.userAgent,
      },
    });
  } catch {
    // Silent fail - don't block user action for audit logging
  }
}
