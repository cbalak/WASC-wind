import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, validateLicence, authorize } from '../middleware/auth';
import { logAudit } from '../lib/audit';

const router = Router();

router.use(authenticate, validateLicence);

router.get('/', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const {
    status,
    priority,
    assigneeId,
    revenueOpportunity,
    supportRisk,
    search,
    limit = '50',
    offset = '0',
  } = req.query;

  const where: any = { tenantId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId as string;
  if (revenueOpportunity === 'true') where.revenueOpportunity = true;
  if (supportRisk === 'true') where.supportRisk = true;
  if (search) {
    where.OR = [
      { contact: { name: { contains: search as string, mode: 'insensitive' } } },
      { contact: { phoneNumber: { contains: search as string } } },
    ];
  }

  const convos = await prisma.conversation.findMany({
    where,
    include: {
      contact: { select: { id: true, name: true, phoneNumber: true, leadScore: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.conversation.count({ where });

  res.json({ conversations: convos, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
});

router.get('/dashboard', async (req, res) => {
  const tenantId = req.user!.tenantId;

  const [newCount, waiting, unresolved, hotLeads, supportFires, followUps, avgResponse] = await Promise.all([
    prisma.conversation.count({ where: { tenantId, status: 'new' } }),
    prisma.conversation.count({ where: { tenantId, status: 'waiting' } }),
    prisma.conversation.count({ where: { tenantId, status: { not: 'closed' } } }),
    prisma.conversation.count({ where: { tenantId, revenueOpportunity: true, status: { not: 'closed' } } }),
    prisma.conversation.count({ where: { tenantId, supportRisk: true, status: { not: 'closed' } } }),
    prisma.conversation.count({ where: { tenantId, followUpAt: { lte: new Date() }, status: { not: 'closed' } } }),
    prisma.conversation.aggregate({
      where: { tenantId },
      _avg: { healthScore: true },
    }),
  ]);

  res.json({
    newLeads: newCount,
    waitingReplies: waiting,
    unresolved: unresolved,
    hotOpportunities: hotLeads,
    supportFires: supportFires,
    followUpsDue: followUps,
    avgHealthScore: Math.round(avgResponse._avg.healthScore || 0),
  });
});

router.get('/:id', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const convo = await prisma.conversation.findFirst({
    where: { id: req.params.id, tenantId },
    include: {
      contact: true,
      assignee: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 100,
      },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
      },
    },
  });

  if (!convo) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  await prisma.conversation.update({
    where: { id: convo.id },
    data: { unreadCount: 0 },
  });

  res.json(convo);
});

router.patch('/:id', authorize('manager', 'admin', 'super_admin', 'agent'), async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({
    status: z.string().optional(),
    priority: z.string().optional(),
    assigneeId: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    snoozedUntil: z.string().datetime().nullable().optional(),
    followUpAt: z.string().datetime().nullable().optional(),
    revenueOpportunity: z.boolean().optional(),
    supportRisk: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const convo = await prisma.conversation.updateMany({
    where: { id: req.params.id, tenantId },
    data: parsed.data,
  });

  if (convo.count === 0) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  await logAudit({
    tenantId,
    userId: req.user!.userId,
    action: 'conversation_updated',
    resource: 'conversation',
    resourceId: req.params.id,
    details: parsed.data,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ updated: true });
});

router.post('/:id/notes', authorize('manager', 'admin', 'super_admin', 'agent'), async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({ note: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Note required' });
    return;
  }

  const convo = await prisma.conversation.findFirst({
    where: { id: req.params.id, tenantId },
    include: { contact: true },
  });
  if (!convo) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const updatedNotes = [convo.contact?.notes || '', `[${req.user!.email}]: ${parsed.data.note}`].filter(Boolean).join('\n---\n');
  await prisma.contact.update({
    where: { id: convo.contactId },
    data: { notes: updatedNotes },
  });

  res.json({ success: true });
});

export default router;
