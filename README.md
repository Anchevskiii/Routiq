# Routiq - Travel Planning Platform

> AI-powered travel planning with collaborative features

Routiq is a modern travel planning application that helps users create personalized itineraries using AI, real-time weather data, and collaborative group features.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL (Supabase)
- **AI**: Google Gemini 2.5 Flash for itinerary generation
- **Maps**: Google Maps JavaScript SDK + Places API
- **Weather**: OpenWeather API
- **Auth**: JWT + Google OAuth

## 📁 Project Structure

```
routiq/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── app/             # App bootstrap & providers
│   │   ├── api/             # API layer
│   │   ├── components/      # UI components
│   │   ├── features/        # Feature modules
│   │   ├── hooks/           # Shared hooks
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   └── constants/       # App constants
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── auth/            # Authentication
│   │   ├── users/           # User management
│   │   ├── itinerary/       # Core feature
│   │   ├── groups/          # Group travel
│   │   ├── attractions/     # Places API proxy
│   │   ├── weather/         # Weather API proxy
│   │   ├── export/          # PDF/ICS export
│   │   ├── gemini/          # AI integration
│   │   └── common/          # Shared utilities
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── BACKEND_ARCHITECTURE.md   # Backend documentation
├── FRONTEND_ARCHITECTURE.md  # Frontend documentation
├── DIRECTORY.md              # Complete file structure
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20 LTS
- PostgreSQL database (Supabase recommended)
- API keys for external services

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd routiq

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

#### Backend Environment

```bash
# Copy the example environment file
cd backend
cp .env.example .env

# Edit .env with your configuration
```

Required environment variables:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
GEMINI_API_KEY="your-gemini-api-key"
GOOGLE_PLACES_API_KEY="your-google-places-api-key"
GOOGLE_MAPS_DIRECTIONS_API_KEY="your-google-maps-directions-api-key"
OPENWEATHER_API_KEY="your-openweather-api-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
FRONTEND_URL="http://localhost:5173"
```

#### Frontend Environment

```bash
# Copy the example environment file
cd frontend
cp .env.example .env

# Edit .env with your configuration
```

Required environment variables:
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-javascript-api-key
```

### 3. Database Setup

```bash
# In the backend directory
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed with test data
npx prisma db seed
```

### 4. Start Development Servers

```bash
# Start backend (in backend directory)
cd backend
npm run start:dev

# Start frontend (in frontend directory)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs

## 📚 Development Scripts

### Backend

```bash
npm run start:dev    # Start in development mode
npm run build        # Build for production
npm run start:prod   # Start production build
npm run test         # Run tests
npm run lint         # Lint code
npm run format       # Format code

# Prisma commands
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database
```

### Frontend

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run test        # Run tests
npm run lint        # Lint code
npm run lint:fix    # Fix linting issues
npm run format      # Format code
npm run type-check  # Type checking
```

## 🔧 Configuration

### Database Setup with Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get the connection string from Settings → Database → URI
3. Add it to your `backend/.env` file
4. Run `npx prisma migrate deploy` to apply schema

### API Keys Setup

#### Google APIs
1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable:
   - Places API
   - Maps JavaScript API
   - Directions API
3. Create API keys with appropriate restrictions
4. Add keys to environment files

#### Gemini AI
1. Get API key from [Google AI Studio](https://aistudio.google.com)
2. Add to `backend/.env`

#### OpenWeather
1. Create account at [OpenWeather](https://openweathermap.org/api)
2. Get API key and add to `backend/.env`

## 🧪 Testing

### Backend Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
# Unit tests
npm run test

# E2E tests (when implemented)
npm run test:e2e
```

## 📖 Documentation

- [Backend Architecture](./BACKEND_ARCHITECTURE.md)
- [Frontend Architecture](./FRONTEND_ARCHITECTURE.md)
- [Directory Structure](./DIRECTORY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `style:` Style changes
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

## 📝 License

This project is private and confidential.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ by the Routiq Team**
