const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authenticateToken = require('../middleware/auth');

// Get timeline for a specific incident
router.get('/incident/:incidentId', authenticateToken, async (req, res) => {
  try {
    const { incidentId } = req.params;

    const timeline = await prisma.incidentTimeline.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { name: true, role: true } }
      }
    });

    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add manual timeline note
router.post('/incident/:incidentId', authenticateToken, async (req, res) => {
  try {
    const { action, note } = req.body;
    const { incidentId } = req.params;

    const entry = await prisma.incidentTimeline.create({
      data: {
        incidentId,
        actorId: req.user.id,
        action: action || 'NOTE_ADDED',
        note
      }
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
