# API Errors Analysis & Fixes

## Issues Identified

### 1. **404 Error on Gacha Endpoint** ❌
```
GET https://api.playadoradarp.xyz/port/25617/api/gacha/roll?discordId=478742167557505034 404 (Not Found)
POST https://api.playadoradarp.xyz/port/25617/api/gacha/roll 404 (Not Found)
```

**Root Cause:**
- Frontend is configured to call: `https://api.playadoradarp.xyz/port/25617`
- But the backend routes are defined as `/api/gacha/roll`
- The full URL becomes: `https://api.playadoradarp.xyz/port/25617/api/gacha/roll`
- **The backend is NOT responding on this URL** - likely the backend server is not running or not accessible at this address

### 2. **500 Error on Tournaments Endpoint** ❌
```
GET https://cobblemon-los-pitufos.vercel.app/api/tournaments 500 (Internal Server Error)
```

**Root Cause:**
- Frontend is calling `/api/tournaments` which goes to the Next.js API route
- But the Next.js API routes in `src/app/api/` have been moved to `src/app/api.old/`
- The API route handler no longer exists at `/api/tournaments`
- The `tournamentsAPI.getAll()` is configured to call the backend, BUT...
- One page (`src/app/admin/tournaments/[id]/page.tsx` line 56) is still using direct `fetch('/api/tournaments/${params.id}')` instead of using the API client

## Problems Summary

| Issue | Endpoint | Error | Reason |
|-------|----------|-------|--------|
| 1 | `api.playadoradarp.xyz/port/25617/api/gacha/roll` | 404 | Backend server not accessible/running |
| 2 | `cobblemon-los-pitufos.vercel.app/api/tournaments` | 500 | Mixed usage: some pages use API client (backend), one page uses old Next.js routes |
| 3 | `/api/users` (admin tournaments page) | Likely 500/404 | Direct fetch to non-existent Next.js route |

## Solutions Required

### Solution 1: Fix Backend Deployment/Accessibility
The backend at `https://api.playadoradarp.xyz/port/25617` needs to be:
1. Running and accessible
2. Properly configured with CORS to accept requests from Vercel domain
3. Connected to MongoDB correctly

### Solution 2: Fix Frontend API Calls
Two pages are NOT using the api-client properly:

#### File: `src/app/admin/tournaments/[id]/page.tsx`
**Lines 56-57:**
```typescript
const [tournamentRes, playersRes] = await Promise.all([
    fetch(`/api/tournaments/${params.id}`),  // ❌ Wrong - calls Next.js route
    fetch('/api/users')                      // ❌ Wrong - calls Next.js route
]);
```

**Should be:**
```typescript
const [tournamentData, playersData] = await Promise.all([
    tournamentsAPI.getById(params.id),  // ✅ Uses backend
    playersAPI.getAll()                  // ✅ Uses backend
]);
```

**Lines 110-123** (submitMatchResult):
```typescript
const res = await fetch('/api/tournament', {  // ❌ Wrong endpoint
    method: 'PATCH',
    // ...
});
```

**Should use:** The tournaments API doesn't have a match result endpoint - this functionality needs to be added to the backend!

### Solution 3: Environment Variables Check

**Vercel Frontend (.env.vercel):**
```env
NEXT_PUBLIC_API_URL=https://api.playadoradarp.xyz/port/25617
```

**Backend (.env - on server):**
Should have:
```env
PORT=25617
FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app
MONGODB_URI=<your-mongodb-uri>
# ... other vars
```

## Action Plan

### Immediate Fixes (Frontend)

1. **Update `src/app/admin/tournaments/[id]/page.tsx`**
   - Replace direct fetch calls with API client calls
   - Handle the tournament match endpoint properly

2. **Verify all pages use api-client**
   - Search for any remaining `fetch('/api/` calls
   - Replace with appropriate API client methods

### Backend Verification

1. **Check backend is running**
   - SSH into the server running the backend
   - Verify the process is running on port 25617
   - Check logs for errors

2. **Test backend accessibility**
   - Run: `curl https://api.playadoradarp.xyz/port/25617/health`
   - Should return `{"success": true, "status": "ok", ...}`

3. **Check reverse proxy configuration**
   - Ensure Nginx/Apache is properly configured to proxy `/port/25617` to the backend

### Database Verification

1. **Test MongoDB connection**
   - Verify the backend can connect to MongoDB
   - Check that `tournaments` collection exists and has data
   - Verify connection string is correct

## Quick Test Commands

```bash
# Test backend health
curl https://api.playadoradarp.xyz/port/25617/health

# Test gacha endpoint
curl "https://api.playadoradarp.xyz/port/25617/api/gacha/roll?discordId=478742167557505034"

# Test tournaments endpoint  
curl https://api.playadoradarp.xyz/port/25617/api/tournaments
```

## Expected Responses

**Health Check:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2025-12-21T...",
  "environment": "production"
}
```

**Gacha Status:**
```json
{
  "hasRolled": false,
  "canRoll": true
}
```

**Tournaments:**
```json
[
  {
    "_id": "...",
    "title": "...",
    "status": "...",
    ...
  }
]
```
