import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, validateLicence, authorize } from '../middleware/auth';
import { logAudit } from '../lib/audit';
import * as aiService from '../services/ai';

const router = Router();

router.use(authenticate, validateLicence);

router.post('/draft', authorize('manager', 'admin', 'agent'), async (req, res) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;

  const schema = z.object({
    conversationId: z.string(),
    tone: z.enum(['professional', 'friendly', 'casual', 'urgent']).default('professional'),
    context: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { conversationId, tone, context } = parsed.data;

  // Get conversation history
  const messages = await prisma.message.findMany({
    where: { conversationId, tenantId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  if (messages.length === 0) {
    res.status(400).json({ error: 'No messages in conversation' });
    return;
  }

  const result = await aiService.draftReply({ messages, tone, context });

  const action = await prisma.aIAction.create({
    data: {
      tenantId,
      userId,
      conversationId,
      actionType: 'draft_reply',
      input: messages.map((m) => `${m.senderType}: ${m.content}`).join('\n'),
      output: result.text,
      confidence: result.confidence,
      tokensUsed: result.tokensUsed,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'ai_draft_generated',
    resource: 'ai_action',
    resourceId: action.id,
    details: { confidence: result.confidence, conversationId },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ draft: result.text, confidence: result.confidence, actionId: action.id });
});

router.post('/summarize', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({ conversationId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: parsed.data.conversationId, tenantId },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  const result = await aiService.summarizeConversation(messages);
  res.json({ summary: result.summary, keyPoints: result.keyPoints, sentiment: result.sentiment });
});

router.post('/extract-lead', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({ conversationId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: parsed.data.conversationId, tenantId },
    orderBy: { createdAt: 'asc' },
  });

  const result = await aiService.extractLeadInfo(messages);
  res.json(result);
});

router.post('/follow-up', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({ conversationId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: parsed.data.conversationId, tenantId },
    orderBy: { createdAt: 'asc' },
  });

  const result = await aiService.generateFollowUp(messages);
  res.json({ followUp: result.text, confidence: result.confidence });
});

router.post('/approve/:actionId', async (req, res) => {
  const tenantId = req.user!.tenantId;
  await prisma.aIAction.updateMany({
    where: { id: req.params.actionId, tenantId, userId: req.user!.userId },
    data: { approved: true },
  });
  res.json({ approved: true });
});

router.get('/usage', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.userId;

  const [monthly, total] = await Promise.all([
    prisma.aIAction.count({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.aIAction.count({ where: { tenantId } }),
  ]);

  res.json({ monthly, total, userId });
});

export default router;
