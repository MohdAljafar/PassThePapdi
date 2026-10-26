const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [ownedBoxes, receivedCount, sentCount, pendingCount, recentJourneys] =
      await Promise.all([
        prisma.box.count({ where: { currentOwnerId: req.userId } }),
        prisma.boxJourney.count({
          where: { toOwnerId: req.userId, eventType: "TRANSFERRED" },
        }),
        prisma.transfer.count({
          where: { senderId: req.userId, status: "CLAIMED" },
        }),
        prisma.transfer.count({
          where: {
            senderId: req.userId,
            status: "PENDING",
            expiresAt: { gt: new Date() },
          },
        }),
        prisma.boxJourney.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            box: {
              select: { boxCode: true, imageUrl: true },
            },
            fromOwner: {
              select: { name: true },
            },
            toOwner: {
              select: { name: true },
            },
          },
        }),
      ]);
    res.json({
      stats: { ownedBoxes, receivedCount, sentCount, pendingCount },
      recentJourneys,
    });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
