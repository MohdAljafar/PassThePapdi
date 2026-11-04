const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET all accepted gift locations
router.get('/locations', requireAuth, async (req, res, next) => {
  try {
    const locations = await prisma.giftLocation.findMany({
      orderBy: {
        acceptedAt: 'asc',
      },

      select: {
        id: true,
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
    });

    const formattedLocations = locations.map((location) => ({
      id: location.id,

      // Approximate coordinates for privacy.
      latitude: Number(location.latitude.toFixed(3)),
      longitude: Number(location.longitude.toFixed(3)),

      // Leaflet circle radius in metres.
      radiusMeters: 5000,

      acceptedAt: location.acceptedAt,

      box: location.box,
      recipientName: location.user.name,
    }));

    res.json({
      count: formattedLocations.length,
      locations: formattedLocations,
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;