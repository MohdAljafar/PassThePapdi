const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { createBoxCode } = require('../lib/tokens');

const router = express.Router();
const imageUrlSchema = z.string().url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'Image URL must use HTTP or HTTPS.');
const createBoxSchema = z.object({ imageUrl: imageUrlSchema, note: z.string().trim().max(300).optional() });

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const boxes = await prisma.box.findMany({
      where: { currentOwnerId: req.userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { journeys: true } } },
    });
    res.json({ boxes });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = createBoxSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please provide a valid image URL.', details: parsed.error.flatten() });
    let box;
    // Unique constraint protects against rare generated-code collisions.
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        box = await prisma.$transaction(async (tx) => {
          const created = await tx.box.create({ data: {
            boxCode: createBoxCode(), imageUrl: parsed.data.imageUrl,
            note: parsed.data.note || null, currentOwnerId: req.userId, creatorId: req.userId,
          } });
          await tx.boxJourney.create({ data: {
            boxId: created.id, actorId: req.userId, eventType: 'CREATED',
            fromOwnerId: null, toOwnerId: req.userId, note: 'Box added to the club',
          } });
          return created;
        });
        break;
      } catch (err) {
        if (err.code !== 'P2002' || attempt === 3) throw err;
      }
    }
    res.status(201).json({ box });
  } catch (err) { next(err); }
});

router.get('/:boxCode/journey', async (req, res, next) => {
  try {
    const box = await prisma.box.findUnique({
      where: { boxCode: req.params.boxCode.toUpperCase() },
      select: {
        id: true, boxCode: true, imageUrl: true, createdAt: true,
        currentOwner: { select: { name: true } },
        journeys: { orderBy: { createdAt: 'desc' }, include: {
          fromOwner: { select: { name: true } }, toOwner: { select: { name: true } },
        } },
      },
    });
    if (!box) return res.status(404).json({ error: 'Box not found.' });
    res.json({ box });
  } catch (err) { next(err); }
});

module.exports = router;
