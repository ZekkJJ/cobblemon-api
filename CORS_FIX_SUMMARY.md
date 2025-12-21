# 🎯 CORS Fix - Quick Action Summary

## The Problem (In Simple Terms)

Your website (`https://cobblemon-los-pitufos.vercel.app`) can't talk to your API (`https://api.playadoradarp.xyz/port/25617`) because of a security error called CORS.

**Why?** The API is saying "anyone can access me" (`*`) but your website is trying to send cookies. Browsers don't allow this combination for security reasons.

## The Solution (What We Did)

✅ **Fixed the code** - Updated `backend/src/app.ts` to return the specific website URL instead of `*`  
✅ **Pushed to GitHub** - All changes are committed and pushed  
❌ **NOT DEPLOYED YET** - The code is updated but not running on your server

## What You Need to Do NOW

### Quick Start (5 minutes)

1. **Open your Pterodactyl panel** (where your backend server runs)

2. **Stop the server**

3. **Set this environment variable:**
   ```
   FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app
   ```

4. **Choose ONE deployment method:**

   **Option A: Manual Update (Easiest)**
   - Go to File Manager
   - Edit `backend/src/app.ts`
   - Copy the new CORS code from GitHub
   - Save

   **Option B: Git Pull (If auto-update is enabled)**
   - Make sure `AUTO_UPDATE=1` in Startup settings
   - Just restart the server (it will pull from GitHub)

   **Option C: Use the helper script**
   ```powershell
   cd backend
   .\deploy-cors-fix.ps1
   ```

5. **Delete the `dist` folder** (forces rebuild)

6. **Start the server**

7. **Test it:**
   ```powershell
   cd backend
   .\test-cors.ps1
   ```

## How to Know It's Fixed

✅ **Good signs:**
- No CORS errors in browser console
- Gacha roll feature works
- Test script shows: `Access-Control-Allow-Origin: https://cobblemon-los-pitufos.vercel.app`

❌ **Still broken:**
- Browser shows CORS error
- Test script shows: `Access-Control-Allow-Origin: *`
- Means the old code is still running

## Files to Help You

| File | What It Does |
|------|--------------|
| `backend/URGENT_CORS_FIX_DEPLOYMENT.md` | **START HERE** - Step-by-step deployment guide |
| `backend/deploy-cors-fix.ps1` | Interactive script to help you deploy |
| `backend/test-cors.ps1` | Test if CORS is working |
| `CORS_ISSUE_ANALYSIS.md` | Deep technical explanation |
| `CORS_FIX_GUIDE.md` | General CORS fix documentation |

## Quick Commands

```powershell
# Test if CORS is fixed
cd backend
.\test-cors.ps1

# Deploy using helper script
cd backend
.\deploy-cors-fix.ps1

# Check what's committed
git log --oneline -3

# Rebuild locally (if needed)
cd backend
npm run build
```

## The Technical Details (If You Care)

**What changed in the code:**

```typescript
// OLD (Broken)
app.use(cors({
  origin: '*',  // ❌ Wildcard not allowed with credentials
  credentials: true
}));

// NEW (Fixed)
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);  // ✅ Returns specific origin
    }
    callback(new Error('Not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  maxAge: 86400
}));
```

**Environment variable needed:**
```env
FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app
```

## Troubleshooting

**"I deployed but still getting errors"**
- Clear browser cache (Ctrl+Shift+R)
- Check server logs for CORS messages
- Verify FRONTEND_URL is set correctly (no trailing slash!)
- Make sure server actually restarted

**"Test script shows wildcard (*)"**
- Old code is still running
- Server didn't restart properly
- Code wasn't updated on server
- Try deleting `dist` folder and restarting

**"Server won't start"**
- Check for syntax errors in app.ts
- Look at server logs
- Make sure all dependencies are installed

## Need Help?

1. Run the test script: `.\test-cors.ps1`
2. Check server logs in Pterodactyl
3. Read `backend/URGENT_CORS_FIX_DEPLOYMENT.md`
4. Make sure FRONTEND_URL is exactly: `https://cobblemon-los-pitufos.vercel.app`

## Success Checklist

- [ ] Pterodactyl panel accessed
- [ ] Server stopped
- [ ] FRONTEND_URL environment variable set
- [ ] Code updated on server (manual edit OR git pull)
- [ ] `dist` folder deleted
- [ ] Server restarted
- [ ] Test script passes
- [ ] Website works without CORS errors

---

**Bottom Line:** The code is fixed and ready. You just need to deploy it to your Pterodactyl server and set the FRONTEND_URL environment variable. Should take 5-10 minutes.

**Start here:** `backend/URGENT_CORS_FIX_DEPLOYMENT.md`
