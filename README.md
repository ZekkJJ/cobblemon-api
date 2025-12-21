# 🎮 Cobblemon Los Pitufos - Full Stack Application

A complete web application for managing a Cobblemon Minecraft server with gacha system, shop, tournaments, and player management.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                   │
│                     Port: 3000                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages: Home, Players, Shop, Tournaments, Admin      │  │
│  │  Components: UI, Forms, Tables, Cards                │  │
│  │  API Client: Centralized backend communication       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │ (api-client.ts)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express API)                    │
│                     Port: 4000                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Modules: Auth, Players, Gacha, Shop, Tournaments    │  │
│  │  Middleware: JWT, CORS, Rate Limiting, Error Handler │  │
│  │  Services: Business Logic, Data Access               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ MongoDB Driver
                            ▼
                    ┌───────────────┐
                    │   MongoDB     │
                    │   Database    │
                    └───────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo>
cd CobblemonLosPitufos

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Environment Variables

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

**Backend (`backend/.env`):**
```env
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database

# JWT
JWT_SECRET=your-super-secret-key-change-this

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/discord/callback

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Groq AI (optional)
GROQ_API_KEY=your-groq-api-key

# Admin IPs (optional, comma-separated)
ADMIN_IPS=127.0.0.1
```

### 3. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend running on http://localhost:4000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
✅ Frontend running on http://localhost:3000

## 📁 Project Structure

```
CobblemonLosPitufos/
├── backend/                    # Express API Backend
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication
│   │   │   ├── players/       # Player management
│   │   │   ├── gacha/         # Gacha system
│   │   │   ├── shop/          # Shop system
│   │   │   ├── tournaments/   # Tournament management
│   │   │   ├── verification/  # Player verification
│   │   │   ├── level-caps/    # Level cap system
│   │   │   └── admin/         # Admin operations
│   │   ├── shared/            # Shared utilities
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── utils/         # Helper functions
│   │   │   ├── types/         # TypeScript types
│   │   │   └── data/          # Static data
│   │   ├── config/            # Configuration
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # Server entry point
│   ├── tests/                 # Tests
│   │   ├── unit/              # Unit tests
│   │   └── property/          # Property-based tests
│   ├── Dockerfile             # Docker configuration
│   ├── package.json
│   └── tsconfig.json
│
├── src/                       # Next.js Frontend
│   ├── app/                   # App Router pages
│   │   ├── page.tsx           # Home (Gacha)
│   │   ├── jugadores/         # Players
│   │   ├── tienda/            # Shop
│   │   ├── torneos/           # Tournaments
│   │   ├── verificar/         # Verification
│   │   ├── pokedex/           # Pokédex
│   │   ├── admin/             # Admin panel
│   │   └── api/               # API routes (to be removed)
│   ├── components/            # React components
│   ├── lib/                   # Libraries & utilities
│   │   └── api-client.ts      # Backend API client ⭐
│   └── styles/                # CSS styles
│
├── public/                    # Static assets
├── .env.local                 # Frontend environment
├── .env.example               # Environment template
├── next.config.js             # Next.js configuration
├── package.json               # Frontend dependencies
└── README.md                  # This file
```

## 🔌 API Client Usage

The frontend uses a centralized API client to communicate with the backend:

```typescript
import api from '@/lib/api-client';

// Players
const { players } = await api.players.getAll();
const player = await api.players.getByUuid(uuid);

// Gacha
const result = await api.gacha.roll({ discordId, discordUsername, minecraftUsername });

// Shop
const { stock } = await api.shop.getStock();
await api.shop.purchase({ uuid, itemId, quantity });

// Tournaments
const { tournaments } = await api.tournaments.getAll();

// And more...
```

See `src/lib/api-client.ts` for all available methods.

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

**Test Coverage:**
- ✅ 97 tests passing
- ✅ Unit tests for all modules
- ✅ Property-based tests for critical logic
- ✅ Integration tests for API endpoints

### Frontend Tests
```bash
# Run frontend tests (if configured)
npm test
```

## 🏗️ Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
npm run build
npm start
```

## 🐳 Docker Deployment

### Backend Only
```bash
cd backend
docker build -t cobblemon-api .
docker run -p 4000:4000 --env-file .env cobblemon-api
```

### Full Stack with Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=http://localhost:3000
    restart: unless-stopped

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:4000
    depends_on:
      - backend
    restart: unless-stopped
```

## ☁️ Deployment Options

### Backend
- **Render.com** (recommended, free tier) - See `backend/DEPLOYMENT.md`
- **Railway.app** ($5/month free)
- **Fly.io**
- **DigitalOcean/Linode VPS**
- **Any Docker host**

### Frontend
- **Vercel** (recommended, free tier)
- **Netlify**
- **Cloudflare Pages**
- **Any static host**

## 📚 Documentation

- **[Frontend-Backend Separation Guide](./FRONTEND_BACKEND_SEPARATION.md)** - Architecture overview
- **[Backend Deployment Guide](./backend/DEPLOYMENT.md)** - Deploy backend anywhere
- **[Migration Guide](./migrate-to-api-client.md)** - Migrate frontend to use API client
- **[Spec Documents](./.kiro/specs/cobblemon-pitufos-rebuild/)** - Requirements & design

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Discord OAuth integration
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation with Zod
- ✅ IP whitelisting for admin endpoints
- ✅ SQL injection prevention (MongoDB)
- ✅ XSS protection

## 🎯 Features

### Player Features
- 🎲 **Gacha System** - Roll for starter Pokémon
- 🤖 **Soul-Driven Gacha** - AI-powered personalized rolls
- 🛒 **Shop** - Buy items with in-game currency
- 🏆 **Tournaments** - View and participate in tournaments
- 👥 **Player Profiles** - View stats and Pokémon
- ✅ **Verification** - Link Discord to Minecraft account
- 📊 **Pokédex** - Browse all available starters

### Admin Features
- 👨‍💼 **Player Management** - View, ban, manage players
- 🏆 **Tournament Management** - Create and manage tournaments
- 📈 **Level Caps** - Configure level cap system
- 🔧 **Shop Management** - Manage shop stock and prices
- 📊 **Analytics** - View server statistics

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: NextAuth.js (optional)
- **State**: React Hooks

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Auth**: JWT + Discord OAuth
- **Validation**: Zod
- **Testing**: Vitest + fast-check
- **AI**: Groq SDK

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - See LICENSE file for details

## 🆘 Support

- **Issues**: Open an issue on GitHub
- **Discord**: Join our Discord server
- **Docs**: Check the documentation files

## 🎉 Acknowledgments

- Cobblemon mod team
- Los Pitufos community
- All contributors

---

Made with ❤️ by Los Pitufos Team
