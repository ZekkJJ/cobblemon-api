# CRITICAL: Pterodactyl Environment Variable Fix

## Problem
Discord OAuth redirects users to `localhost` instead of the Vercel frontend after authentication.

## Root Cause
The `FRONTEND_URL` environment variable in Pterodactyl is either:
- Not set (defaults to `http://localhost:3000`)
- Set to the wrong URL

## Solution

### Step 1: Add Environment Variable in Pterodactyl

Go to your Pterodactyl panel and add this environment variable:

```
FRONTEND_URL=https://cobblemon2-ahh9u9uzi-zekkjjs-projects.vercel.app
```

### Step 2: Verify All Required Environment Variables

Make sure these are ALL set in Pterodactyl:

```env
FRONTEND_URL=https://cobblemon2-ahh9u9uzi-zekkjjs-projects.vercel.app
DISCORD_CLIENT_ID=808344864260358167
DISCORD_CLIENT_SECRET=uNnjceg7mLNF9kJl-VasHMSQCYQaSJbb
DISCORD_REDIRECT_URI=https://api.playadoradarp.xyz/port/25617/api/auth/discord/callback
MONGODB_URI=mongodb://ADMIN:9XMsZKF34EAVeSRW@G3CF75C71B99C87-OP9QWIYLW1WNEBAB.adb.us-ashburn-1.oraclecloudapps.com:27017/brave?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true
NODE_ENV=production
PORT=25617
```

### Step 3: Restart the Server

After adding the environment variable, restart the Pterodactyl server to apply changes.

### Step 4: Test Discord OAuth

1. Go to: https://cobblemon2-ahh9u9uzi-zekkjjs-projects.vercel.app
2. Click "Login with Discord"
3. Authorize the app
4. You should be redirected back to the Vercel frontend with `?auth=success` in the URL

## How It Works

The `backend/server.js` file uses `FRONTEND_URL` in two places:

1. **CORS Configuration** (line 32): Allows requests from the frontend
2. **OAuth Callback Redirect** (line 189): Redirects user after Discord auth

```javascript
// Line 32
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Line 189 (success redirect)
res.redirect(`${FRONTEND_URL}?auth=success&discordId=${userData.id}&username=${encodeURIComponent(userData.username)}`);

// Line 196 (error redirect)
res.redirect(`${FRONTEND_URL}?auth=error`);
```

Without this variable set correctly, users get redirected to `localhost` which doesn't exist in production.

## Frontend Changes Applied

Also fixed runtime errors in the frontend:

### 1. Fixed `.includes()` error in `pokedex/page.tsx`
Added safety check for `s.types` before calling `.includes()`:
```typescript
if (filterType && s.types && !s.types.includes(filterType)) return false;
```

### 2. Fixed `.includes()` error in `tienda/page.tsx`
Added safety check for `ball.name` before calling `.includes()`:
```typescript
const matchesSearch = ball.name && ball.name.toLowerCase().includes(searchTerm.toLowerCase());
```

### 3. Already Fixed: Sprite Display Issues
All pages now use correct sprite property names:
- `sprites.sprite` (normal static)
- `sprites.spriteAnimated` (normal animated)
- `sprites.shiny` (shiny static)
- `sprites.shinyAnimated` (shiny animated)

## Next Steps

1. **YOU** need to add `FRONTEND_URL` to Pterodactyl environment variables
2. **YOU** need to restart the Pterodactyl server
3. Test the Discord OAuth flow
4. Deploy the frontend fixes to Vercel (run `vercel --prod` from `frontend/` directory)
