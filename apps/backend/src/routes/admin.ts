import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { logAudit } from '../lib/audit';

const router = Router();

router.use(authenticate, authorize('super_admin', 'admin'));

router.get('/tenants', async (req, res) => {
  const tenants = await prisma.tenant.findMany({
    include: {
      _count: { select: { users: true, conversations: true, contacts: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(tenants);
});

router.get('/tenants/:id', async (req, res) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.params.id },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, lastLoginAt: true } },
      crmConnections: { select: { type: true, status: true } },
      _count: { select: { conversations: true, contacts: true, messages: true } },
    },
  });
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  res.json(tenant);
});

router.patch('/tenants/:id', async (req, res) => {
  const schema = z.object({
    plan: z.string().optional(),
    licenceStatus: z.string().optional(),
    licenceExpiry: z.string().datetime().optional(),
    suspended: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const update: any = { ...parsed.data };
  if (parsed.data.suspended === true) {
    update.licenceStatus = 'suspended';
  } else if (parsed.data.suspended === false) {
    update.licenceStatus = 'active';
  }
  delete update.suspended;

  await prisma.tenant.update({
    where: { id: req.params.id },
    data: update,
  });

  await logAudit({
    tenantId: req.params.id,
    userId: req.user!.userId,
    action: 'tenant_updated_by_admin',
    resource: 'tenant',
    resourceId: req.params.id,
    details: parsed.data,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ updated: true });
});

router.get('/audit-logs', async (req, res) => {
  const { tenantId, limit = '50', offset = '0' } = req.query;
  const where: any = {};
  if (tenantId) where.tenantId = tenantId as string;

  const logs = await prisma.auditLog.findMany({
    where,
    include: { tenant: { select: { name: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  res.json(logs);
});

router.get('/security-events', async (req, res) => {
  const events = await prisma.securityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(events);
});

router.get('/resellers', async (req, res) => {
  const resellers = await prisma.reseller.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(resellers);
});

router.get('/usage', async (req, res) => {
  const stats = await prisma.usageRecord.groupBy({
    by: ['periodStart'],
    _sum: { aiActionsUsed: true, crmSyncsUsed: true, messagesCount: true },
    orderBy: { periodStart: 'desc' },
    take: 30,
  });
  res.json(stats);
});

export default router;
