# 🚨 URGENT: Backend Missing Auth Routes

## THE PROBLEM

El backend en producción (`https://api.playadoradarp.xyz/port/25617`) está corriendo código VIEJO que NO tiene las rutas de autenticación (`/api/auth/discord`).

**Error actual**: `{"error":{"message":"Endpoint not found","path":"/api/auth/discord"}}`

## SOLUTION: Update Backend on Pterodactyl

### Option 1: Upload via SFTP (RECOMMENDED)

1. **Build the backend locally**:
   ```powershell
   cd backend
   npm run build
   ```

2. **Connect to Pterodactyl via SFTP**:
   - Host: `api.playadoradarp.xyz`
   - Port: (SFTP port from Pterodactyl)
   - Username: (from Pterodactyl)
   - Password: (from Pterodactyl)

3. **Upload these folders**:
   - `backend/dist/` → Upload to server
   - `backend/package.json` → Upload to server
   - `backend/package-lock.json` → Upload to server

4. **Restart server in Pterodactyl panel**:
   - Stop server
   - Start server

### Option 2: Manual File Update (SLOWER)

1. **Go to Pterodactyl File Manager**

2. **Update `src/app.ts`**:
   - Navigate to `backend/src/app.ts`
   - Replace entire file with the version from your local `backend/src/app.ts`
   - Make sure it includes: `app.use('/api/auth', authRouter);`

3. **Update `src/modules/auth/` folder**:
   - Upload all files from `backend/src/modules/auth/`
   - Especially:
     - `auth.routes.ts`
     - `auth.controller.ts`
     - `auth.service.ts`
     - `auth.middleware.ts`

4. **Update `src/config/auth.ts`**:
   - Upload `backend/src/config/auth.ts`

5. **Restart server**

### Option 3: Git Pull (IF CONFIGURED)

If your Pterodactyl server has Git configured:

```bash
cd /path/to/backend
git pull origin main
npm install
npm run build
# Restart via Pterodactyl panel
```

## VERIFY IT WORKS

After updating, test the endpoint:

```powershell
curl -UseBasicParsing https://api.playadoradarp.xyz/port/25617/api/auth/discord
```

**Expected**: Should redirect to Discord OAuth (302 redirect)
**NOT**: `{"error":{"message":"Endpoint not found"}}`

## CRITICAL FILES TO UPDATE

These files MUST be on the server:

```
backend/
├── src/
│   ├── app.ts                          ← Registers auth routes
│   ├── config/
│   │   └── auth.ts                     ← Discord OAuth config
│   └── modules/
│       └── auth/
│           ├── auth.routes.ts          ← Auth endpoints
│           ├── auth.controller.ts      ← Auth logic
│           ├── auth.service.ts         ← Auth service
│           └── auth.middleware.ts      ← Auth middleware
├── package.json
└── package-lock.json
```

## ENVIRONMENT VARIABLES

Make sure these are set in Pterodactyl:

```env
# Discord OAuth
DISCORD_CLIENT_ID=808344864260358167
DISCORD_CLIENT_SECRET=uNnjceg7mLNF9kJl-VasHMSQCYQaSJbb
DISCORD_REDIRECT_URI=https://api.playadoradarp.xyz/port/25617/api/auth/discord/callback

# Frontend
FRONTEND_URL=https://cobblemon2-ahh9u9uzi-zekkjjs-projects.vercel.app

# Session
SESSION_SECRET=cobblemon-los-pitufos-secret-key-2024

# Database (already configured)
MONGODB_URI=mongodb://ADMIN:9XMsZKF34EAVeSRW@G3CF75C71B99C87-OP9QWIYLW1WNEBAB.adb.us-ashburn-1.oraclecloudapps.com:27017/brave?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true
```

## QUICK CHECKLIST

- [ ] Backend code updated on Pterodactyl
- [ ] `npm install` run (if package.json changed)
- [ ] `npm run build` run (to compile TypeScript)
- [ ] Environment variables set
- [ ] Server restarted
- [ ] Test endpoint: `/api/auth/discord` returns 302 redirect (not 404)
- [ ] Frontend can login with Discord

## AFTER UPDATE

Once backend is updated, redeploy frontend:

```powershell
cd frontend
vercel --prod
```

The frontend will then be able to connect to the auth endpoints.
