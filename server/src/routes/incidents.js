const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authenticateToken = require('../middleware/auth');

// Haversine distance function (returns distance in meters)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

const jwt = require('jsonwebtoken');

// Report Incident / SOS
router.post('/', async (req, res) => {
  // Optional Authentication for public SOS
  let reporterId = null;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      reporterId = user.id;
    } catch (e) {
      // ignore invalid token for public endpoint
    }
  }

  try {
    let { eventId, type, description, latitude, longitude, locationAccuracy, affectedPeople, isSos, reporterName, reporterPhone } = req.body;
    
    // Fix MVP Foreign Key Issue: Auto-resolve active event
    if (!eventId || eventId === 'default-event-id') {
      const activeEvent = await prisma.event.findFirst({ where: { status: 'ACTIVE' } });
      if (activeEvent) {
        eventId = activeEvent.id;
      }
    }

    // Auto-Generate Guest User if not logged in
    if (!reporterId) {
      if (isSos) {
        const dummyNames = ["Arun (Kerala)", "Lakshmi (Kerala)", "Karthik (Tamil Nadu)", "Priya (Tamil Nadu)", "Vishnu (Kerala)", "Meera (Tamil Nadu)"];
        reporterName = dummyNames[Math.floor(Math.random() * dummyNames.length)];
        reporterPhone = "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
      }

      if (reporterName) {
        let guestUser;
        if (reporterPhone) {
          guestUser = await prisma.user.findFirst({ where: { phone: reporterPhone } });
        }
        if (!guestUser) {
          guestUser = await prisma.user.create({
            data: {
              name: reporterName,
              phone: reporterPhone,
              role: 'PARTICIPANT'
            }
          });
        }
        reporterId = guestUser.id;
      }
    }

    // 1. Priority Engine Logic
    let priority = 'LOW';
    const actualType = isSos ? 'SOS/Unknown' : type;
    
    if (isSos || type === 'Medical' || type === 'Fire') {
      priority = 'HIGH';
    } else if (affectedPeople > 5 || type === 'Security' || type === 'Crowd') {
      priority = 'MEDIUM';
    }

    // 2. Duplicate Detection
    let isPossibleDuplicate = false;
    let duplicateOfId = null;

    if (latitude && longitude) {
      const recentIncidents = await prisma.incident.findMany({
        where: {
          eventId,
          type: actualType,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // within 5 minutes
          }
        }
      });

      for (const inc of recentIncidents) {
        if (inc.latitude && inc.longitude) {
          const distance = getDistance(latitude, longitude, inc.latitude, inc.longitude);
          if (distance <= 30) { // within 30 meters
            isPossibleDuplicate = true;
            duplicateOfId = inc.id;
            break;
          }
        }
      }
    }

    // 3. Create Incident
    const incident = await prisma.incident.create({
      data: {
        eventId,
        reporterId,
        type: actualType,
        description,
        latitude,
        longitude,
        locationAccuracy,
        affectedPeople,
        priority,
        status: 'REPORTED',
        duplicateOfId
      }
    });

    // 4. Responder Matching (find all available responders for this event)
    const availableResponders = await prisma.eventMember.findMany({
      where: {
        eventId,
        role: 'VOLUNTEER',
        // availabilityStatus: 'AVAILABLE' // Removing this check temporarily for MVP demo reliability
      },
      include: { user: true }
    });
    
    // Create PENDING assignments for all responders
    const assignments = [];
    for (const responder of availableResponders) {
      const assignment = await prisma.incidentAssignment.create({
        data: {
          incidentId: incident.id,
          responderId: responder.user.id,
          assignmentStatus: 'PENDING'
        }
      });
      assignments.push(assignment);
    }

    // Broadcast to volunteers with the actual assignments attached
    req.io.emit('incident:assigned', { ...incident, assignments }); 

    // Fetch Incident completely with reporter included so Dashboard receives the full object
    const completeIncident = await prisma.incident.findUnique({
      where: { id: incident.id },
      include: { reporter: { select: { name: true, phone: true } } }
    });

    // Notify real-time dashboard globally for MVP
    req.io.emit('incident:created', { ...completeIncident, isPossibleDuplicate, assignments });

    res.status(201).json({ success: true, data: { ...completeIncident, isPossibleDuplicate } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Incidents for Event
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    let { eventId } = req.params;
    
    // MVP Auto-resolve active event
    if (eventId === 'default-event-id') {
      const activeEvent = await prisma.event.findFirst({ where: { status: 'ACTIVE' } });
      if (activeEvent) eventId = activeEvent.id;
    }

    const incidents = await prisma.incident.findMany({
      where: { eventId },
      include: { reporter: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Incident Status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body; // e.g., RESOLVED, IN_PROGRESS

    const incident = await prisma.incident.update({
      where: { id },
      data: { 
        status, 
        ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {})
      }
    });

    // Log to timeline
    await prisma.incidentTimeline.create({
      data: {
        incidentId: id,
        actorId: req.user.id,
        action: `STATUS_CHANGED_TO_${status}`,
        note
      }
    });

    req.io.to(`event_${incident.eventId}`).emit('incident:updated', incident);

    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
