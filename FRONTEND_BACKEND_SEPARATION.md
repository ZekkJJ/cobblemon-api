# 🔄 Frontend-Backend Separation Guide

## ✅ What Was Done

The frontend and backend are now **completely separated**:

### Backend (Express API)
- **Location**: `./backend/`
- **Port**: 4000
- **Database**: MongoDB (handles all data)
- **Auth**: JWT + Discord OAuth
- **Independent**: Can be deployed anywhere

### Frontend (Next.js)
- **Location**: `./` (root)
- **Port**: 3000
- **Database**: None (removed MongoDB dependency)
- **Auth**: Calls backend API
- **Independent**: Can be deployed anywhere

## 🔧 Changes Made

### 1. Created API Client (`src/lib/api-client.ts`)
Centralized all backend API calls:
```typescript
import api from '@/lib/api-client';

// Example usage:
const players = await api.players.getAll();
const gacha = await api.gacha.roll({ discordId, discordUsername, minecraftUsername });
```

### 2. Updated Environment Variables

**Frontend (`.env.local`)**:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

**Backend (`backend/.env`)**:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:3000
```

### 3. Removed MongoDB from Frontend
- Removed `mongodb` from frontend dependencies
- Removed MongoDB experimental config from `next.config.js`
- Frontend no longer connects to database directly

### 4. Simplified Next.js Config
- Removed rewrites (no longer needed)
- Removed basePath (no longer needed)
- Clean, minimal configuration

## 🚀 How to Run

### Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:4000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend runs on http://localhost:3000

### Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
npm run build
npm start
```

## 📋 Migration Checklist

### ✅ Already Done
- [x] Created API client library
- [x] Updated environment variables
- [x] Removed MongoDB from frontend
- [x] Simplified Next.js config
- [x] Backend fully independent

### 🔄 To Do (Update Frontend Components)
- [ ] Replace `/api/*` calls with `api-client` calls
- [ ] Remove `src/app/api/` route handlers (no longer needed)
- [ ] Update auth flow to use backend
- [ ] Test all features end-to-end

## 🔌 API Client Usage Examples

### Players
```typescript
import api from '@/lib/api-client';

// Get all players
const { players } = await api.players.getAll();

// Get player by UUID
const player = await api.players.getByUuid(uuid);

// Sync player
await api.players.sync({ uuid, discordId, minecraftUsername });
```

### Gacha
```typescript
// Roll gacha
const result = await api.gacha.roll({
  discordId: '123',
  discordUsername: 'user#1234',
  minecraftUsername: 'player'
});

// Soul-driven roll
const result = await api.gacha.soulDriven({
  discordId: '123',
  discordUsername: 'user#1234',
  minecraftUsername: 'player',
  preferences: 'I like fire types'
});
```

### Shop
```typescript
// Get stock
const { stock } = await api.shop.getStock();

// Get balance
const { balance } = await api.shop.getBalance(uuid);

// Purchase
await api.shop.purchase({
  uuid,
  itemId: 'pokeball',
  quantity: 10
});
```

### Tournaments
```typescript
// Get all tournaments
const { tournaments } = await api.tournaments.getAll();

// Get specific tournament
const tournament = await api.tournaments.getById(id);

// Create (admin)
await api.tournaments.create({
  name: 'Summer Cup',
  startDate: '2024-06-01',
  // ...
});
```

### Verification
```typescript
// Generate code
const { code } = await api.verification.generate({
  discordId: '123',
  minecraftUsername: 'player'
});

// Verify
const { verified } = await api.verification.verify({
  discordId: '123',
  code: 'ABC123'
});
```

## 🌐 Deployment Options

### Backend
- **Render.com** (recommended, free tier)
- **Railway.app** ($5/month free)
- **Fly.io**
- **DigitalOcean/Linode VPS**
- **Docker anywhere**

See `backend/DEPLOYMENT.md` for detailed instructions.

### Frontend
- **Vercel** (recommended, free tier)
- **Netlify**
- **Cloudflare Pages**
- **Any static host**

## 🔒 CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (development)
- Your production frontend URL (set via `FRONTEND_URL` env var)

Update `backend/src/app.ts` if you need to add more origins.

## 🧪 Testing

Both can be tested independently:

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
npm test
```

## 📊 Architecture

```
┌─────────────────┐         HTTP/REST         ┌─────────────────┐
│                 │ ◄────────────────────────► │                 │
│  Next.js        │    api-client.ts calls     │  Express API    │
│  Frontend       │                            │  Backend        │
│  (Port 3000)    │                            │  (Port 4000)    │
│                 │                            │                 │
└─────────────────┘                            └────────┬────────┘
                                                        │
                                                        │
                                                        ▼
                                                ┌───────────────┐
                                                │   MongoDB     │
                                                │   Database    │
                                                └───────────────┘
```

## 🆘 Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` is set correctly in backend `.env`
- Check backend logs for CORS errors
- Verify `NEXT_PUBLIC_BACKEND_URL` in frontend `.env.local`

### Connection Refused
- Make sure backend is running on port 4000
- Check `NEXT_PUBLIC_BACKEND_URL` points to correct URL
- In production, use full URLs (https://api.example.com)

### Auth Not Working
- Backend handles all auth now
- Make sure JWT_SECRET is set in backend
- Cookies must be enabled (credentials: 'include')

## 📝 Next Steps

1. **Update Frontend Components**: Replace all `/api/*` fetch calls with `api-client` calls
2. **Remove Old API Routes**: Delete `src/app/api/` directory (except NextAuth if keeping it)
3. **Test Everything**: Verify all features work with separated architecture
4. **Deploy**: Deploy backend and frontend to separate services
5. **Update URLs**: Point frontend to production backend URL

## 🎯 Benefits

- ✅ **Independent Scaling**: Scale frontend and backend separately
- ✅ **Flexible Deployment**: Deploy to different platforms
- ✅ **Better Performance**: Frontend is pure static/SSR, backend handles data
- ✅ **Easier Testing**: Test each part independently
- ✅ **Clear Separation**: Frontend = UI, Backend = Logic + Data
- ✅ **Multiple Frontends**: Can build mobile app, CLI, etc. using same backend
