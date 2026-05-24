import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, validateLicence, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, validateLicence);

router.get('/', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const { status, assigneeId, overdue } = req.query;

  const where: any = { tenantId };
  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId as string;
  if (overdue === 'true') {
    where.status = { not: 'completed' };
    where.dueAt = { lt: new Date() };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      contact: { select: { name: true, phoneNumber: true } },
      assignee: { select: { name: true } },
      conversation: { select: { id: true } },
    },
    orderBy: { dueAt: 'asc' },
  });

  res.json(tasks);
});

router.post('/', authorize('manager', 'admin', 'agent'), async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    contactId: z.string().optional(),
    conversationId: z.string().optional(),
    assigneeId: z.string().optional(),
    dueAt: z.string().datetime().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      tenantId,
      createdBy: req.user!.userId,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
    },
  });

  res.status(201).json(task);
});

router.patch('/:id', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    assigneeId: z.string().nullable().optional(),
    dueAt: z.string().datetime().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const task = await prisma.task.updateMany({
    where: { id: req.params.id, tenantId },
    data: parsed.data,
  });

  if (task.count === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ updated: true });
});

export default router;
