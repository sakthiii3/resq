const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authenticateToken = require('../middleware/auth');

// Update assignment status (e.g. ACCEPTED, STARTED, COMPLETED)
router.post('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, note } = req.body;
    const assignmentId = req.params.id;

    const assignment = await prisma.incidentAssignment.findUnique({
      where: { id: assignmentId },
      include: { incident: true }
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Ensure user owns assignment or is organizer
    if (assignment.responderId !== req.user.id && req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updatedAssignment = await prisma.incidentAssignment.update({
      where: { id: assignmentId },
      data: {
        assignmentStatus: status,
        ...(status === 'ACCEPTED' ? { acceptedAt: new Date() } : {}),
        ...(status === 'STARTED' ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
        ...(status === 'DECLINED' ? { declineReason: note } : {}),
      }
    });

    // Update main incident status based on assignment
    let incidentStatus = assignment.incident.status;
    if (status === 'ACCEPTED' || status === 'STARTED') incidentStatus = 'IN_PROGRESS';
    if (status === 'COMPLETED') incidentStatus = 'RESOLVED';

    if (incidentStatus !== assignment.incident.status) {
      await prisma.incident.update({
        where: { id: assignment.incidentId },
        data: { 
          status: incidentStatus,
          ...(incidentStatus === 'RESOLVED' ? { resolvedAt: new Date() } : {})
        }
      });
      
      // Notify dashboard
      req.io.to(`event_${assignment.incident.eventId}`).emit('incident:updated', { id: assignment.incidentId, status: incidentStatus });
    }

    res.json({ success: true, data: updatedAssignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
