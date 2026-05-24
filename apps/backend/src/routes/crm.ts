import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, validateLicence, authorize } from '../middleware/auth';
import { logAudit } from '../lib/audit';
import * as crmService from '../services/crm';

const router = Router();

router.use(authenticate, validateLicence);

router.get('/', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const connections = await prisma.cRMConnection.findMany({
    where: { tenantId },
    select: { id: true, type: true, name: true, status: true, lastSyncAt: true, lastError: true },
  });
  res.json(connections);
});

router.post('/', authorize('manager', 'admin'), async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({
    type: z.string(),
    name: z.string(),
    config: z.record(z.unknown()).default({}),
    tokens: z.record(z.string()).default({}),
    fieldMapping: z.record(z.string()).default({}),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const conn = await prisma.cRMConnection.create({
    data: {
      tenantId,
      type: parsed.data.type,
      name: parsed.data.name,
      config: parsed.data.config,
      tokens: '',
      fieldMapping: parsed.data.fieldMapping,
      status: 'disconnected',
    },
  });

  if (Object.keys(parsed.data.tokens).length > 0) {
    await crmService.storeTokens(conn.id, parsed.data.tokens);
  }

  // Test connection
  const test = await crmService.testConnection(tenantId, parsed.data.type);
  if (test.success) {
    await prisma.cRMConnection.update({
      where: { id: conn.id },
      data: { status: 'connected', lastSyncAt: new Date() },
    });
  } else {
    await prisma.cRMConnection.update({
      where: { id: conn.id },
      data: { status: 'error', lastError: test.error },
    });
  }

  await logAudit({
    tenantId,
    userId: req.user!.userId,
    action: 'crm_connection_created',
    resource: 'crm_connection',
    resourceId: conn.id,
    details: { type: parsed.data.type, status: test.success ? 'connected' : 'error' },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({ ...conn, status: test.success ? 'connected' : 'error' });
});

router.post('/:id/sync-contact', authorize('manager', 'admin', 'agent'), async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({
    contactId: z.string(),
    createDeal: z.boolean().optional(),
    note: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const result = await crmService.syncContactToCRM(tenantId, parsed.data.contactId, {
    createDeal: parsed.data.createDeal,
    note: parsed.data.note,
  });

  res.json(result);
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  const tenantId = req.user!.tenantId;
  await prisma.cRMConnection.deleteMany({
    where: { id: req.params.id, tenantId },
  });
  res.json({ deleted: true });
});

export default router;
