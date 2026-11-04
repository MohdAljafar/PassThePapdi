
const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Aggregate statistics. Never expose user IDs publicly.
async function getGiftStats() {
  const [recipients, participants] = await Promise.all([
    // Distinct users who successfully received a gift.
    prisma.transfer.findMany({
      where: {
        status: 'CLAIMED',
        recipientId: { not: null },
      },
      distinct: ['recipientId'],
      select: {
        recipientId: true,
      },
    }),

    // Distinct users who voluntarily shared their location.
    prisma.giftLocation.findMany({
      distinct: ['userId'],
      select: {
        userId: true,
      },
    }),
  ]);

  return {
    peopleReached: recipients.length,
    litUpUsers: participants.length,
  };
}

// PUBLIC: Approximate locations and aggregate statistics.
// No authentication or personal information required.
router.get('/public-locations', async (req, res, next) => {
  try {
    const [locations, stats] = await Promise.all([
      prisma.giftLocation.findMany({
        orderBy: { acceptedAt: 'asc' },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          acceptedAt: true,
        },
      }),
      getGiftStats(),
    ]);

    const formattedLocations = locations.map((location) => ({
      id: location.id,
      latitude: Number(location.latitude.toFixed(2)),
      longitude: Number(location.longitude.toFixed(2)),
      radiusMeters: 5000,
      acceptedAt: location.acceptedAt,
    }));

    res.json({
      locations: formattedLocations,
      stats,
    });
  } catch (err) {
    next(err);
  }
});

// AUTHENTICATED: Detailed locations for dashboard.
router.get('/locations', requireAuth, async (req, res, next) => {
  try {
    const [locations, stats] = await Promise.all([
      prisma.giftLocation.findMany({
        orderBy: { acceptedAt: 'asc' },
        select: {
          id: true,
          boxId: true,
          latitude: true,
          longitude: true,
          acceptedAt: true,
          box: {
            select: {
              boxCode: true,
              imageUrl: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
      getGiftStats(),
    ]);

    const formattedLocations = locations.map((location) => ({
      id: location.id,
      boxId: location.boxId,
      latitude: Number(location.latitude.toFixed(3)),
      longitude: Number(location.longitude.toFixed(3)),
      radiusMeters: 5000,
      acceptedAt: location.acceptedAt,
      box: location.box,
      recipientName: location.user.name,
    }));

    res.json({
      locations: formattedLocations,
      stats,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
