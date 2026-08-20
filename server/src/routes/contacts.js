const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authenticateToken = require('../middleware/auth');

// Get all emergency contacts for an event (publicly accessible if needed, but authenticated here for safety)
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    const contacts = await prisma.emergencyContact.findMany({
      where: { 
        eventId,
        isActive: true
      },
      orderBy: { category: 'asc' }
    });

    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
