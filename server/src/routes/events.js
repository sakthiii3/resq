const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authenticateToken = require('../middleware/auth');

// Create Event
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { organizationId, name, description, venue, latitude, longitude } = req.body;
    
    let orgId = organizationId;
    if (!orgId) {
      // Create a default organization for MVP if none provided
      const org = await prisma.organization.create({ data: { name: 'Default Org' } });
      orgId = org.id;
    }

    const event = await prisma.event.create({
      data: {
        organizationId: orgId,
        name,
        description,
        venue,
        latitude,
        longitude
      }
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
