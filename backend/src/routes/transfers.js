const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { createClaimToken, hashToken } = require('../lib/tokens');

const router = express.Router();
const passSchema = z.object({ boxCode: z.string().trim().regex(/^SP-\d{5}$/i), message: z.string().trim().max(300).optional() });
const claimSchema = z.object({ token: z.string().min(30).max(200) });
const ttlHours = Math.min(720, Math.max(1, Number.parseInt(process.env.CLAIM_LINK_TTL_HOURS || '168', 10) || 168));

// Create a claim invitation. The box remains owned by the sender until a recipient claims it.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = passSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Provide a valid box code.', details: parsed.error.flatten() });
    const box = await prisma.box.findUnique({ where: { boxCode: parsed.data.boxCode.toUpperCase() } });
    if (!box) return res.status(404).json({ error: 'Box not found.' });
    if (box.currentOwnerId !== req.userId) return res.status(403).json({ error: 'You can only pass a box you currently own.' });

    const rawToken = createClaimToken();
    const transfer = await prisma.transfer.create({ data: {
      boxId: box.id, senderId: req.userId, tokenHash: hashToken(rawToken),
      message: parsed.data.message || null, expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
    }, include: { box: { select: { boxCode: true, imageUrl: true } }, sender: { select: { name: true } } } });
    const claimUrl = `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/claim/${rawToken}`;
    const whatsappText = `You've been sent ${transfer.box.boxCode} from ${transfer.sender.name}! Sign in to claim this Soan Papdi box: ${claimUrl}${transfer.message ? `\nMessage: ${transfer.message}` : ''}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    res.status(201).json({ transfer: { id: transfer.id, status: transfer.status, expiresAt: transfer.expiresAt, box: transfer.box }, claimUrl, whatsappUrl });
  } catch (err) { next(err); }
});

// Preview is read-only. Merely opening/scanning a link never transfers ownership.
router.get('/claim/:token', async (req, res, next) => {
  try {
    const tokenHash = hashToken(req.params.token);
    const transfer = await prisma.transfer.findUnique({
      where: { tokenHash }, include: {
        box: { select: { boxCode: true, imageUrl: true, currentOwnerId: true } },
        sender: { select: { name: true } },
      },
    });
    if (!transfer) return res.status(404).json({ error: 'This claim link is invalid.' });
    if (transfer.status !== 'PENDING') return res.status(409).json({ error: 'This claim link has already been used or is no longer active.' });
    if (transfer.expiresAt <= new Date()) return res.status(410).json({ error: 'This claim link has expired.' });
    if (transfer.box.currentOwnerId !== transfer.senderId) return res.status(409).json({ error: 'This box has already moved to another owner.' });
    res.json({ claim: { boxCode: transfer.box.boxCode, imageUrl: transfer.box.imageUrl, senderName: transfer.sender.name, message: transfer.message, expiresAt: transfer.expiresAt } });
  } catch (err) { next(err); }
});

// Explicit claim; transaction + conditional writes make this a single-winner operation.
router.post('/claim', requireAuth, async (req, res, next) => {
  try {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'A valid claim token is required.' });
    const tokenHash = hashToken(parsed.data.token);
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({ where: { tokenHash }, include: { box: true } });
      if (!transfer) return { status: 404, body: { error: 'This claim link is invalid.' } };
      if (transfer.senderId === req.userId) return { status: 400, body: { error: 'You cannot claim your own invitation.' } };
      if (transfer.status !== 'PENDING') return { status: 409, body: { error: 'This claim link has already been used.' } };
      if (transfer.expiresAt <= now) {
        await tx.transfer.updateMany({ where: { id: transfer.id, status: 'PENDING' }, data: { status: 'EXPIRED' } });
        return { status: 410, body: { error: 'This claim link has expired.' } };
      }
      // First lock-like conditional status transition wins. Other simultaneous claims see count 0.
      const claimed = await tx.transfer.updateMany({
        where: { id: transfer.id, status: 'PENDING', expiresAt: { gt: now } },
        data: { status: 'CLAIMED', recipientId: req.userId, claimedAt: now },
      });
      if (claimed.count !== 1) return { status: 409, body: { error: 'Someone else has already claimed this box.' } };
      const moved = await tx.box.updateMany({
        where: { id: transfer.boxId, currentOwnerId: transfer.senderId },
        data: { currentOwnerId: req.userId },
      });
      if (moved.count !== 1) throw new Error('BOX_OWNER_CHANGED'); // Roll back the transfer update too.
      await tx.boxJourney.create({ data: {
        boxId: transfer.boxId, actorId: req.userId, eventType: 'TRANSFERRED',
        fromOwnerId: transfer.senderId, toOwnerId: req.userId,
        note: transfer.message || 'Box passed on through Soan Papdi Club',
      } });
      const box = await tx.box.findUnique({ where: { id: transfer.boxId }, select: { boxCode: true, imageUrl: true } });
      return { status: 200, body: { message: 'Box claimed successfully.', box } };
    }, { isolationLevel: 'Serializable' });
    res.status(result.status).json(result.body);
  } catch (err) {
    if (err.message === 'BOX_OWNER_CHANGED' || err.code === 'P2034') return res.status(409).json({ error: 'This box has already been claimed by someone else. No changes were made.' });
    next(err);
  }
});

router.get('/sent', requireAuth, async (req, res, next) => {
  try {
    const transfers = await prisma.transfer.findMany({
      where: { senderId: req.userId }, orderBy: { createdAt: 'desc' },
      include: { box: { select: { boxCode: true, imageUrl: true } }, recipient: { select: { name: true, email: true } } },
    });
    res.json({ transfers });
  } catch (err) { next(err); }
});

router.get('/received', requireAuth, async (req, res, next) => {
  try {
    const journeys = await prisma.boxJourney.findMany({
      where: { toOwnerId: req.userId, eventType: 'TRANSFERRED' }, orderBy: { createdAt: 'desc' },
      include: { box: { select: { boxCode: true, imageUrl: true, currentOwnerId: true } }, fromOwner: { select: { name: true } } },
    });
    res.json({ received: journeys.map((j) => ({ ...j, currentlyOwnedByMe: j.box.currentOwnerId === req.userId })) });
  } catch (err) { next(err); }
});

module.exports = router;
