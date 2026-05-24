import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../lib/audit';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/register', async (req, res) => {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    company: z.string().min(1),
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password, name, company } = parsed.data;
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: company,
      slug: `${company.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      plan: 'trial',
      licenceStatus: 'trial',
      licenceExpiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      name,
      passwordHash: hash,
      role: 'admin',
    },
  });

  const accessToken = signAccessToken(user.id, tenant.id, user.email, user.role as any);
  const refreshToken = signRefreshToken(user.id);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  await logAudit({
    tenantId: tenant.id,
    userId: user.id,
    action: 'user_registered',
    resource: 'user',
    resourceId: user.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ accessToken, refreshToken, user: { id: user.id, email, name, role: user.role } });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findFirst({ where: { email }, include: { tenant: true } });
  if (!user || !user.tenant) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (user.tenant.licenceStatus === 'suspended') {
    res.status(403).json({ error: 'Account suspended' });
    return;
  }

  const accessToken = signAccessToken(user.id, user.tenant.id, user.email, user.role as any);
  const refreshToken = signRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastLoginAt: new Date() },
  });

  await logAudit({
    tenantId: user.tenant.id,
    userId: user.id,
    action: 'user_login',
    resource: 'user',
    resourceId: user.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant: { id: user.tenant.id, name: user.tenant.name, plan: user.tenant.plan, licenceStatus: user.tenant.licenceStatus },
    },
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const { userId } = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
    if (!user || user.refreshToken !== refreshToken || !user.tenant) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const newAccess = signAccessToken(user.id, user.tenant.id, user.email, user.role as any);
    const newRefresh = signRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } });

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { tenant: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenant: user.tenant,
  });
});

export default router;
