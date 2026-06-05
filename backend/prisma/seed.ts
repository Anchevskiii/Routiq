import { PrismaClient, TravelType, GroupRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Dev-only seed users — never run against production databases
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'demo@routiq.com' },
    update: {},
    create: {
      email: 'demo@routiq.com',
      name: 'Demo User',
      passwordHash: hashedPassword,
      avatarUrl: null,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'klemen@routiq.com' },
    update: {},
    create: {
      email: 'klemen@routiq.com',
      name: 'Klemen Novak',
      passwordHash: hashedPassword,
      avatarUrl: null,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'mojca@routiq.com' },
    update: {},
    create: {
      email: 'mojca@routiq.com',
      name: 'Mojca Marin',
      passwordHash: hashedPassword,
      avatarUrl: null,
    },
  });

  console.log('👥 Created test users:', { user1: user1.id, user2: user2.id, user3: user3.id });

  // Create sample itineraries
  const itinerary1 = await prisma.itinerary.create({
    data: {
      userId: user1.id,
      destination: 'Paris, France',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-05'),
      travelType: TravelType.CULTURAL,
      weatherData: {
        location: 'Paris',
        current: { temperature: 22, condition: 'sunny', humidity: 60, windSpeed: 10 },
        forecast: [
          { date: '2026-06-01', temperature: { min: 18, max: 24 }, condition: 'sunny', humidity: 60, windSpeed: 10, precipitation: 0 },
          { date: '2026-06-02', temperature: { min: 19, max: 25 }, condition: 'cloudy', humidity: 65, windSpeed: 12, precipitation: 10 },
        ],
      },
      days: [
        {
          day: 1,
          date: '2026-06-01',
          theme: 'Arrival & City Center',
          activities: [
            { time: '14:00', title: 'Check-in at Hotel', description: 'Arrive and settle in', location: 'Hotel de Paris', duration: 1, cost: '€0', tips: 'Early check-in available on request', coordinates: { lat: 48.8566, lng: 2.3522 } },
            { time: '16:00', title: 'Walk along Seine', description: 'Enjoy the beautiful river views', location: 'Seine River', duration: 2, cost: '€0', tips: 'Best photo spots near Pont Neuf', coordinates: { lat: 48.8589, lng: 2.3470 } },
          ],
          meals: [
            { type: 'dinner', recommendation: 'Le Petit Bistrot', location: 'Latin Quarter', priceRange: '€€' },
          ],
        },
        {
          day: 2,
          date: '2026-06-02',
          theme: 'Museums & Culture',
          activities: [
            { time: '09:00', title: 'Louvre Museum', description: 'World-famous art museum', location: 'Louvre', duration: 4, cost: '€17', tips: 'Book tickets in advance', coordinates: { lat: 48.8606, lng: 2.3376 } },
            { time: '14:00', title: 'Notre-Dame Cathedral', description: 'Iconic Gothic cathedral', location: 'Notre-Dame', duration: 1, cost: '€0', tips: 'Currently under restoration', coordinates: { lat: 48.8529, lng: 2.3499 } },
          ],
          meals: [
            { type: 'lunch', recommendation: 'Cafe de Flore', location: 'Saint-Germain', priceRange: '€€€' },
          ],
        },
      ],
    },
  });

  const itinerary2 = await prisma.itinerary.create({
    data: {
      userId: user2.id,
      destination: 'Barcelona, Spain',
      startDate: new Date('2026-07-10'),
      endDate: new Date('2026-07-14'),
      travelType: TravelType.GASTRONOMIC,
      weatherData: {
        location: 'Barcelona',
        current: { temperature: 28, condition: 'sunny', humidity: 70, windSpeed: 8 },
        forecast: [
          { date: '2026-07-10', temperature: { min: 22, max: 30 }, condition: 'sunny', humidity: 70, windSpeed: 8, precipitation: 0 },
        ],
      },
      days: [
        {
          day: 1,
          date: '2026-07-10',
          theme: 'Gastronomic Discovery',
          activities: [
            { time: '10:00', title: 'La Boqueria Market', description: 'Famous food market', location: 'La Boqueria', duration: 2, cost: '€0', tips: 'Try local fruits and tapas', coordinates: { lat: 41.3818, lng: 2.1714 } },
            { time: '19:00', title: 'Tapas Tour', description: 'Evening tapas crawl', location: 'El Born', duration: 3, cost: '€30', tips: 'Make reservations at popular spots', coordinates: { lat: 41.3843, lng: 2.1827 } },
          ],
          meals: [
            { type: 'breakfast', recommendation: 'Brunch & Cake', location: 'El Gotico', priceRange: '€' },
            { type: 'dinner', recommendation: 'Tickets Bar', location: 'Poble-sec', priceRange: '€€€' },
          ],
        },
      ],
    },
  });

  console.log('✈️ Created sample itineraries:', { itinerary1: itinerary1.id, itinerary2: itinerary2.id });

  // Create a sample group
  const group1 = await prisma.group.create({
    data: {
      name: 'Summer Europe Trip 2026',
      description: 'Planning our adventure through Paris, Barcelona, and Rome!',
      members: {
        create: [
          { userId: user1.id, role: GroupRole.ADMIN },
          { userId: user2.id, role: GroupRole.MEMBER },
          { userId: user3.id, role: GroupRole.MEMBER },
        ],
      },
    },
    include: {
      members: true,
    },
  });

  console.log('👥 Created group:', { groupId: group1.id, memberCount: group1.members.length });

  // Add itinerary to group
  const groupItinerary = await prisma.groupItinerary.create({
    data: {
      groupId: group1.id,
      itineraryId: itinerary1.id,
    },
  });

  console.log('📝 Added itinerary to group:', { groupItineraryId: groupItinerary.id });

  // Add some comments
  const comment = await prisma.comment.create({
    data: {
      groupItineraryId: groupItinerary.id,
      userId: user2.id,
      content: 'This looks amazing! I am so excited about the Louvre visit.',
    },
  });

  console.log('💬 Added comment:', { commentId: comment.id });

  console.log('✅ Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
