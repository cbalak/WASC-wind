import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, validateLicence } from '../middleware/auth';

const router = Router();

router.use(authenticate, validateLicence);

router.post('/capture', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const schema = z.object({
    phoneNumber: z.string(),
    contactName: z.string().optional(),
    content: z.string(),
    senderType: z.enum(['contact', 'agent']),
    messageType: z.enum(['text', 'image', 'voice', 'document']).default('text'),
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
    where: { tenantId_phoneNumber: { tenantId, phoneNumber: data.phoneNumber } },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        tenantId,
        phoneNumber: data.phoneNumber,
        name: data.contactName || data.phoneNumber,
      },
    });
  } else if (data.contactName && !contact.name) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { name: data.contactName },
    });
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: { tenantId, contactId: contact.id, status: { not: 'closed' } },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        tenantId,
        contactId: contact.id,
        status: 'new',
      },
    });
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      tenantId,
      conversationId: conversation.id,
      senderType: data.senderType,
      content: data.content,
      messageType: data.messageType,
      createdAt: data.timestamp ? new Date(data.timestamp) : undefined,
    },
  });

  // Update conversation
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      unreadCount: data.senderType === 'contact' ? { increment: 1 } : undefined,
      status: data.senderType === 'agent' && conversation.status === 'waiting' ? 'active' : undefined,
    },
  });

  res.status(201).json({ message, conversation, contact });
});

router.get('/conversation/:conversationId', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const messages = await prisma.message.findMany({
    where: { tenantId, conversationId: req.params.conversationId },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });
  res.json(messages);
});

export default router;
