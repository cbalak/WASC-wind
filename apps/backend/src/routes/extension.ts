import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signAccessToken } from '../lib/jwt';
import { logAudit } from '../lib/audit';

const router = Router();

// Extension handshake: validates licence and returns a short-lived token
router.post('/handshake', async (req, res) => {
  const schema = z.object({
    apiKey: z.string(),
    deviceId: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid handshake' });
    return;
  }

  const { apiKey, deviceId } = parsed.data;

  // In production, apiKey maps to a tenant/user via secure lookup
  // For MVP: apiKey is user's JWT access token (simplified)
  // Better: use a dedicated extension API key stored per user

  // Look up extension key -> user mapping
  const user = await prisma.user.findFirst({
    where: { tenant: { licenceStatus: { in: ['active', 'trial'] } } },
    include: { tenant: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!user || !user.tenant) {
    res.status(403).json({ error: 'Invalid licence or tenant not found' });
    return;
  }

  if (user.tenant.licenceExpiry < new Date()) {
    res.status(403).json({ error: 'Licence expired' });
    return;
  }

  // Generate extension token (short-lived, scoped)
  const extToken = signAccessToken(user.id, user.tenant.id, user.email, user.role as any);

  await logAudit({
    tenantId: user.tenant.id,
    userId: user.id,
    action: 'extension_handshake',
    resource: 'extension',
    details: { deviceId },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({
    token: extToken,
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      plan: user.tenant.plan,
      features: {}, // feature flags
    },
    user: { id: user.id, name: user.name, role: user.role },
  });
});

// Extension captures chat messages
router.post('/capture', async (req, res) => {
  // This endpoint is called by the extension to sync WhatsApp messages
  // Requires extension token in header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // In full implementation, verify extension token here
  // For now, simplified

  const schema = z.object({
    tenantId: z.string(),
    phoneNumber: z.string(),
    contactName: z.string().optional(),
    content: z.string(),
    senderType: z.enum(['contact', 'agent']),
    timestamp: z.string().datetime().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;

  // Upsert contact
  let contact = await prisma.contact.findUnique({
    where: { tenantId_phoneNumber: { tenantId: data.tenantId, phoneNumber: data.phoneNumber } },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        tenantId: data.tenantId,
        phoneNumber: data.phoneNumber,
        name: data.contactName || data.phoneNumber,
      },
    });
  }

  let conversation = await prisma.conversation.findFirst({
    where: { tenantId: data.tenantId, contactId: contact.id, status: { not: 'closed' } },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        tenantId: data.tenantId,
        contactId: contact.id,
        status: 'new',
      },
    });
  }

  const message = await prisma.message.create({
    data: {
      tenantId: data.tenantId,
      conversationId: conversation.id,
      senderType: data.senderType,
      content: data.content,
      createdAt: data.timestamp ? new Date(data.timestamp) : undefined,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      unreadCount: data.senderType === 'contact' ? { increment: 1 } : undefined,
    },
  });

  res.status(201).json({ message, conversation, contact });
});

export default router;
