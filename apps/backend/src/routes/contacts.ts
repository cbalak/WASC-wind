import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, validateLicence } from '../middleware/auth';
import { logAudit } from '../lib/audit';

const router = Router();

router.use(authenticate, validateLicence);

router.get('/', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const { search, tags, leadScoreMin, limit = '50', offset = '0' } = req.query;

  const where: any = { tenantId };
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { phoneNumber: { contains: search as string } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (tags) where.tags = { hasSome: (tags as string).split(',') };
  if (leadScoreMin) where.leadScore = { gte: parseInt(leadScoreMin as string) };

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      _count: { select: { conversations: true } },
      conversations: { orderBy: { lastMessageAt: 'desc' }, take: 1, select: { status: true, lastMessageAt: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.contact.count({ where });

  res.json({ contacts, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
});

router.get('/:id', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const contact = await prisma.contact.findFirst({
    where: { id: req.params.id, tenantId },
    include: {
      conversations: {
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      tasks: { include: { assignee: { select: { name: true } } } },
    },
  });

  if (!contact) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }

  res.json(contact);
});

router.post('/', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({
    phoneNumber: z.string().min(5),
    name: z.string().optional(),
    email: z.string().email().optional(),
    company: z.string().optional(),
    tags: z.array(z.string()).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const contact = await prisma.contact.create({
      data: { ...parsed.data, tenantId },
    });

    await logAudit({
      tenantId,
      userId: req.user!.userId,
      action: 'contact_created',
      resource: 'contact',
      resourceId: contact.id,
      details: parsed.data,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(contact);
  } catch {
    res.status(409).json({ error: 'Contact with this phone number already exists' });
  }
});

router.patch('/:id', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    company: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    leadScore: z.number().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const contact = await prisma.contact.updateMany({
    where: { id: req.params.id, tenantId },
    data: parsed.data,
  });

  if (contact.count === 0) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }

  res.json({ updated: true });
});

export default router;
