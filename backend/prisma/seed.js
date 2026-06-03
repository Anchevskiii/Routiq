"use strict";
let __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    let desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
let __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
let __importStar = (this && this.__importStar) || (function () {
    let ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            let ar = [];
            for (let k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        let result = {};
        if (mod != null) for (let k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const process = __importStar(require("process"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
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
    const itinerary1 = await prisma.itinerary.create({
        data: {
            userId: user1.id,
            destination: 'Paris, France',
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-06-05'),
            travelType: client_1.TravelType.CULTURAL,
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
            travelType: client_1.TravelType.GASTRONOMIC,
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
    const group1 = await prisma.group.create({
        data: {
            name: 'Summer Europe Trip 2026',
            description: 'Planning our adventure through Paris, Barcelona, and Rome!',
            members: {
                create: [
                    { userId: user1.id, role: client_1.GroupRole.ADMIN },
                    { userId: user2.id, role: client_1.GroupRole.MEMBER },
                    { userId: user3.id, role: client_1.GroupRole.MEMBER },
                ],
            },
        },
        include: {
            members: true,
        },
    });
    console.log('👥 Created group:', { groupId: group1.id, memberCount: group1.members.length });
    const groupItinerary = await prisma.groupItinerary.create({
        data: {
            groupId: group1.id,
            itineraryId: itinerary1.id,
        },
    });
    console.log('📝 Added itinerary to group:', { groupItineraryId: groupItinerary.id });
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
