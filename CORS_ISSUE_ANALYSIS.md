# 🔍 Deep Analysis: CORS Issue

## Executive Summary

**Problem:** Frontend at `https://cobblemon-los-pitufos.vercel.app` cannot access backend API at `https://api.playadoradarp.xyz/port/25617` due to CORS policy violation.

**Root Cause:** Backend is returning `Access-Control-Allow-Origin: *` (wildcard) while frontend sends requests with `credentials: 'include'`. This combination is forbidden by browser security policy.

**Status:** ✅ Code fix completed and pushed to GitHub  
**Action Required:** 🚨 Deploy updated code to Pterodactyl server

---

## Technical Deep Dive

### The Error Message Decoded

```
Access to fetch at 'https://api.playadoradarp.xyz/port/25617/api/gacha/roll' 
from origin 'https://cobblemon-los-pitufos.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The value of the 'Access-Control-Allow-Origin' header in the response must not be 
the wildcard '*' when the request's credentials mode is 'include'.
```

**What this means:**
1. Browser sends OPTIONS preflight request to backend
2. Backend responds with `Access-Control-Allow-Origin: *`
3. Frontend request includes `credentials: 'include'` (sends cookies)
4. Browser blocks the request because wildcard + credentials = security violation

### Why This Happens

**CORS Security Rule:**
When a request includes credentials (cookies, authorization headers), the server MUST specify the exact origin, not a wildcard.

**Reason:** Prevents malicious sites from making authenticated requests to your API.

**Valid:**
```
Access-Control-Allow-Origin: https://cobblemon-los-pitufos.vercel.app
Access-Control-Allow-Credentials: true
```

**Invalid:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```

### Architecture Analysis

```
┌─────────────────────────────────────┐
│  Frontend (Vercel)                  │
│  https://cobblemon-los-pitufos      │
│  .vercel.app                        │
│                                     │
│  - Next.js app                      │
│  - Makes API calls with             │
│    credentials: 'include'           │
└──────────────┬──────────────────────┘
               │
               │ HTTPS Request
               │ Origin: https://cobblemon-los-pitufos.vercel.app
               │ Cookie: session=...
               │
               ▼
┌─────────────────────────────────────┐
│  Backend (Pterodactyl)              │
│  https://api.playadoradarp.xyz      │
│  /port/25617                        │
│                                     │
│  - Express.js API                   │
│  - CORS middleware                  │
│  - Currently returns: *             │ ❌ PROBLEM
│  - Should return: exact origin      │ ✅ SOLUTION
└─────────────────────────────────────┘
```

### Code Analysis

#### Current (Broken) Configuration

The backend is likely using a simple CORS setup:

```typescript
app.use(cors({
  origin: '*',  // ❌ This is the problem
  credentials: true
}));
```

Or an older version of our code that returns the origin string instead of `true`.

#### Fixed Configuration

```typescript
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);  // ✅ Returns true, not origin string
    }
    
    // Allow all .vercel.app domains
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);  // ✅ Handles preview deployments
    }
    
    // Reject others
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,  // Cache preflight for 24 hours
  optionsSuccessStatus: 204
}));
```

### Environment Variables

**Critical:** The backend MUST have this environment variable set:

```env
FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app
```

This is used to build the `allowedOrigins` array:

```typescript
const allowedOrigins = [
  env.FRONTEND_URL,  // From environment variable
  'https://cobblemon-los-pitufos.vercel.app',  // Hardcoded fallback
  'http://localhost:3000',  // Development
].filter(Boolean);
```

### Deployment Status

| Component | Status | Location |
|-----------|--------|----------|
| Frontend Code | ✅ Deployed | Vercel (auto-deploy from GitHub) |
| Backend Code | ✅ Updated | GitHub repository |
| Backend Deployment | ❌ **NOT DEPLOYED** | Pterodactyl server |
| Environment Vars | ❓ Unknown | Need to check Pterodactyl |

**The Gap:** Code is updated in GitHub but NOT running on the production server.

### Why It's Not Deployed

Pterodactyl doesn't automatically deploy from GitHub unless:
1. Auto-update is enabled (`AUTO_UPDATE=1`)
2. Server is restarted after code changes

**Most likely scenario:** The server is running old code from before the CORS fix.

### Verification Steps

#### 1. Check Current CORS Headers

```powershell
curl -X OPTIONS `
  -H "Origin: https://cobblemon-los-pitufos.vercel.app" `
  -H "Access-Control-Request-Method: POST" `
  -v `
  https://api.playadoradarp.xyz/port/25617/api/gacha/roll
```

**If you see:**
```
< Access-Control-Allow-Origin: *
```
❌ Old code is still running

**If you see:**
```
< Access-Control-Allow-Origin: https://cobblemon-los-pitufos.vercel.app
< Access-Control-Allow-Credentials: true
```
✅ New code is deployed

#### 2. Check Server Logs

Look for these log messages (added in the fix):
```
🌐 CORS - Allowed origins: [...]
🔍 CORS - Request from origin: https://cobblemon-los-pitufos.vercel.app
✅ CORS - Vercel domain allowed
```

If you don't see these, the new code isn't running.

#### 3. Test from Frontend

Open browser console on `https://cobblemon-los-pitufos.vercel.app`:

```javascript
fetch('https://api.playadoradarp.xyz/port/25617/api/gacha/roll', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://cobblemon-los-pitufos.vercel.app',
    'Access-Control-Request-Method': 'POST'
  }
}).then(r => {
  console.log('CORS Headers:', r.headers);
});
```

### Solution Steps

1. **Update Code on Server**
   - Option A: Manual file edit in Pterodactyl
   - Option B: Git pull (if auto-update enabled)
   - Option C: SFTP upload

2. **Set Environment Variable**
   ```
   FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app
   ```

3. **Rebuild & Restart**
   - Delete `dist` folder
   - Restart server
   - Wait for TypeScript compilation

4. **Verify**
   - Run `test-cors.ps1`
   - Check browser console
   - Test gacha roll feature

### Files Changed

| File | Change | Status |
|------|--------|--------|
| `backend/src/app.ts` | Updated CORS config | ✅ Committed |
| `backend/src/config/env.ts` | No change needed | ✅ OK |
| `src/lib/api-client.ts` | No change needed | ✅ OK |
| Pterodactyl env vars | Need to add FRONTEND_URL | ❌ TODO |

### Common Pitfalls

1. **Forgetting to restart server** after code changes
2. **Not setting FRONTEND_URL** environment variable
3. **Typo in FRONTEND_URL** (trailing slash, wrong protocol)
4. **Browser cache** showing old errors
5. **Multiple CORS middleware** conflicting
6. **Reverse proxy** stripping CORS headers

### Testing Checklist

- [ ] Backend code updated on server
- [ ] FRONTEND_URL environment variable set
- [ ] Server restarted
- [ ] `curl` test shows correct origin (not *)
- [ ] Browser console shows no CORS errors
- [ ] Gacha roll feature works
- [ ] Other API endpoints work
- [ ] Preview deployments work (.vercel.app)

### Monitoring

After deployment, monitor:
- Server logs for CORS debug messages
- Browser console for any CORS errors
- API response times (CORS adds minimal overhead)
- Error rates in production

### Rollback Plan

If something goes wrong:
1. Revert `backend/src/app.ts` to previous version
2. Restart server
3. Investigate issue
4. Re-apply fix with corrections

### Future Improvements

1. **Automated Deployment**
   - Set up GitHub Actions
   - Auto-deploy on push to main
   - Run tests before deploy

2. **Better Monitoring**
   - Log all CORS rejections
   - Alert on high rejection rate
   - Track which origins are being blocked

3. **Configuration Management**
   - Move allowed origins to database
   - Admin panel to manage CORS
   - Per-environment configuration

### Related Documentation

- `backend/URGENT_CORS_FIX_DEPLOYMENT.md` - Deployment instructions
- `backend/deploy-cors-fix.ps1` - Deployment helper script
- `backend/test-cors.ps1` - CORS testing script
- `CORS_FIX_GUIDE.md` - General CORS fix guide

---

## Summary

**What happened:** Backend is returning wildcard CORS header, which conflicts with credentialed requests from frontend.

**What we did:** Updated backend code to return specific origin instead of wildcard.

**What's needed:** Deploy the updated code to the Pterodactyl server and set the FRONTEND_URL environment variable.

**Expected result:** Frontend can make authenticated requests to backend without CORS errors.

**Time to fix:** 5-10 minutes once you have Pterodactyl access.
