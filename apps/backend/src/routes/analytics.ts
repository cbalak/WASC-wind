import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, validateLicence } from '../middleware/auth';

const router = Router();

router.use(authenticate, validateLicence);

router.get('/dashboard', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    today,
    thisWeek,
    thisMonth,
    missedLeads,
    hotOpportunities,
    supportFires,
    revenueAtRisk,
    followUpsDue,
    teamResponseTime,
    aiUsage,
  ] = await Promise.all([
    prisma.analyticsDaily.findFirst({
      where: { tenantId, date: { gte: todayStart } },
      orderBy: { date: 'desc' },
    }),
    prisma.analyticsDaily.aggregate({
      where: { tenantId, date: { gte: weekAgo } },
      _sum: { newLeads: true, missedLeads: true, hotOpportunities: true, supportFires: true, dealsCreated: true },
    }),
    prisma.analyticsDaily.aggregate({
      where: { tenantId, date: { gte: monthAgo } },
      _sum: { newLeads: true, missedLeads: true, hotOpportunities: true, supportFires: true, dealsCreated: true, aiActionsSaved: true },
    }),
    prisma.conversation.count({
      where: { tenantId, status: { not: 'closed' }, lastMessageAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.conversation.count({
      where: { tenantId, revenueOpportunity: true, status: { not: 'closed' } },
    }),
    prisma.conversation.count({
      where: { tenantId, supportRisk: true, status: { not: 'closed' } },
    }),
    prisma.conversation.count({
      where: {
        tenantId,
        revenueOpportunity: true,
        status: { not: 'closed' },
        lastMessageAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
    }),
    prisma.conversation.count({
      where: {
        tenantId,
        followUpAt: { lte: now },
        status: { not: 'closed' },
      },
    }),
    prisma.conversation.aggregate({
      where: { tenantId },
      _avg: { healthScore: true },
    }),
    prisma.aIAction.count({
      where: { tenantId, createdAt: { gte: monthAgo } },
    }),
  ]);

  res.json({
    today: today || {},
    thisWeek: thisWeek._sum,
    thisMonth: thisMonth._sum,
    current: {
      missedLeads,
      hotOpportunities,
      supportFires,
      revenueAtRisk,
      followUpsDue,
      avgHealthScore: Math.round(teamResponseTime._avg.healthScore || 0),
      aiUsage,
      totalConversations: await prisma.conversation.count({ where: { tenantId } }),
      totalContacts: await prisma.contact.count({ where: { tenantId } }),
    },
  });
});

router.get('/team-performance', async (req, res) => {
  const tenantId = req.user!.tenantId;
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      role: true,
      _count: {
        select: {
          assignedConvos: true,
        },
      },
    },
  });

  const withStats = await Promise.all(
    users.map(async (user) => {
      const messages = await prisma.message.count({
        where: { tenantId, senderId: user.id, senderType: 'agent' },
      });
      return { ...user, messagesSent: messages };
    })
  );

  res.json(withStats);
});

export default router;
