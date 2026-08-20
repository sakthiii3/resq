const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Demo Data...');
  
  // 1. Create Default Organization
  const org = await prisma.organization.create({
    data: { name: 'Kerala Disaster Management' }
  });

  // 2. Create Event
  const event = await prisma.event.create({
    data: {
      organizationId: org.id,
      name: 'Kerala Tech Fest 2026',
      description: 'Annual tech festival',
      venue: 'Main Campus',
      latitude: 10.8505,
      longitude: 76.2711,
      status: 'ACTIVE'
    }
  });

  // 3. Create Users
  const organizer = await prisma.user.create({
    data: { name: 'Admin User', role: 'ORGANIZER', email: 'admin@resq.com' }
  });

  const volunteer = await prisma.user.create({
    data: { name: 'Demo Responder', role: 'VOLUNTEER', email: 'volunteer@resq.com' }
  });

  // 4. Create Memberships
  await prisma.eventMember.create({
    data: { eventId: event.id, userId: volunteer.id, role: 'VOLUNTEER', availabilityStatus: 'AVAILABLE' }
  });

  // 5. Create Simulated Incidents
  const incidents = [
    { type: 'Medical', description: 'Participant fainted', priority: 'HIGH', latOff: 0.01, lngOff: 0.01 },
    { type: 'Fire', description: 'Small fire near food court', priority: 'HIGH', latOff: -0.01, lngOff: 0.02 },
    { type: 'Crowd', description: 'Overcrowding at main stage', priority: 'MEDIUM', latOff: 0.02, lngOff: -0.01 },
    { type: 'Security', description: 'Lost child found', priority: 'MEDIUM', latOff: -0.015, lngOff: -0.015 },
    { type: 'Infrastructure', description: 'Broken lights', priority: 'LOW', latOff: 0.03, lngOff: 0 }
  ];

  for (const inc of incidents) {
    await prisma.incident.create({
      data: {
        eventId: event.id,
        reporterId: organizer.id,
        type: inc.type,
        description: inc.description,
        priority: inc.priority,
        latitude: 10.8505 + inc.latOff,
        longitude: 76.2711 + inc.lngOff,
        status: 'REPORTED',
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
