# Fixes Applied to API Errors

## Summary

I've analyzed the 404 and 500 errors and applied the following fixes:

### ✅ Fixes Completed

1. **Updated `src/lib/api-client.ts`**
   - Fixed `tournamentsAPI.getAll()` to return `Tournament[]` directly (not wrapped in `{ tournaments: [] }`)
   - Updated `tournamentsAPI.getById()` to return `Tournament` type
   - Changed HTTP method for `tournamentsAPI.update()` from `PATCH` to `PUT` (matches backend)
   - Added `tournamentsAPI.delete()` method
   - Added comprehensive `Tournament` interface with all fields

2. **Updated `src/app/admin/tournaments/[id]/page.tsx`**
   - Imported `tournamentsAPI` and `playersAPI` from `@/lib/api-client`
   - Replaced `fetch('/api/tournaments/${id}')` with `tournamentsAPI.getById(params.id)`
   - Replaced `fetch('/api/users')` with `playersAPI.getAll()`
   - Fixed response handling - `playersData.players` instead of `playersData.users`
   - Added proper type casting: `tournamentData as Tournament`

3. **Updated `src/app/torneos/page.tsx`**
   - Fixed `tournamentsAPI.getAll()` response handling
   - Changed from `data.tournaments` to direct array `tournaments`

## ⚠️ Issues Identified (Need Manual Fix)

### 1. Backend Server Not Accessible
**Error:** `GET https://api.playadoradarp.xyz/port/25617/api/gacha/roll 404 (Not Found)`

**Cause:** The backend server at `https://api.playadoradarp.xyz/port/25617` is either:
- Not running
- Not properly configured in the reverse proxy
- Not accessible from the internet

**Action Required:**
```bash
# Test if backend is running
curl https://api.playadoradarp.xyz/port/25617/health

# Expected response:
# {"success": true, "status": "ok", ...}
```

**If the backend is not running:**
1. SSH into the server hosting the backend
2. Navigate to the backend directory
3. Start the backend with: `npm run start` or `node dist/server.js`
4. Verify it's listening on port 25617

**If reverse proxy is misconfigured:**
- Check Nginx/Apache configuration
- Verify the `/port/25617` path is correctly proxied to `localhost:25617`

### 2. More Pages Need API Client Updates

The following pages are still using old Next.js API routes that don't exist:

**Critical (Will cause 500 errors):**
- `src/app/admin/tournaments/page.tsx` - lines 84, 94, 131, 162
  - Uses `/api/tournament` and `/api/users`
  - Should use `tournamentsAPI` and `playersAPI`

**Other pages with old fetch calls:**
- `src/app/verificar/page.tsx`
- `src/app/page.tsx`
- `src/app/jugadores/page.tsx`
- `src/app/admin/reset/page.tsx`
- `src/app/admin/players/page.tsx`
- `src/app/admin/players/[id]/page.tsx`
- `src/app/admin/level-caps/page.tsx`

## 📋 Next Steps

### Priority 1: Get Backend Running
1. Verify backend is accessible at `https://api.playadoradarp.xyz/port/25617`
2. Test all endpoints:
   ```bash
   curl https://api.playadoradarp.xyz/port/25617/health
   curl https://api.playadoradarp.xyz/port/25617/api/gacha/roll?discordId=478742167557505034
   curl https://api.playadoradarp.xyz/port/25617/api/tournaments
   ```

### Priority 2: Fix `src/app/admin/tournaments/page.tsx`
This page needs major updates to use the AP I client instead of direct fetch calls.

**Lines to fix:**
- Line 84: `fetch('/api/tournament')` → `tournamentsAPI.getAll()`
- Line 94: `fetch('/api/users')` → `playersAPI.getAll()`  
- Line 131: `fetch('/api/tournament', {method: 'POST'})` → `tournamentsAPI.create()`
- Line 162: `fetch('/api/tournament', {method: 'PATCH'})` → `tournamentsAPI.update()`

**Response format changes needed:**
- `data.tournaments` → direct array from `tournamentsAPI.getAll()`
- `data.users` → `data.players` from `playersAPI.getAll()`

### Priority 3: Audit All Other Pages
Search for remaining `fetch('/api/` calls and replace with API client methods.

## Environment Variables

Ensure these are set correctly:

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://api.playadoradarp.xyz/port/25617
```

**Backend (Server):**
```env
PORT=25617
FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app
MONGODB_URI=<your-connection-string>
CORS_ORIGINS=https://cobblemon-los-pitufos.vercel.app,https://*.vercel.app
```

## Testing Checklist

After deploying fixes:

- [ ] Backend health check responds
- [ ] Gacha roll endpoint returns data
- [ ] Tournaments page loads without errors
- [ ] Admin tournaments page loads
- [ ] Tournament bracket page loads
- [ ] All console errors are resolved
