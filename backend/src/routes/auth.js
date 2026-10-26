const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const { SignJWT } = require('jose');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth, secretKey } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const credentialSchema = z.object({ credential: z.string().min(20).max(10000) });

router.post('/google', async (req, res, next) => {
  try {
    const parsed = credentialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'A Google credential is required.' });
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p?.sub || !p.email || p.email_verified !== true) {
      return res.status(401).json({ error: 'Google account could not be verified.' });
    }

    const user = await prisma.user.upsert({
      where: { googleSub: p.sub },
      update: { email: p.email.toLowerCase(), name: p.name || p.email, pictureUrl: p.picture || null },
      create: { googleSub: p.sub, email: p.email.toLowerCase(), name: p.name || p.email, pictureUrl: p.picture || null },
      select: { id: true, email: true, name: true, pictureUrl: true },
    });
    const jwt = await new SignJWT({ email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey());

    res.cookie('spc_session', jwt, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.json({ user });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, pictureUrl: true, createdAt: true },
    });
    if (!user) return res.status(401).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) { next(err); }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('spc_session', { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: process.env.COOKIE_SAME_SITE || 'lax', path: '/' });
  res.status(204).end();
});

module.exports = router;
