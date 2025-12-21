# CORS Fix Guide

## Problem
The frontend at `https://cobblemon-los-pitufos.vercel.app` is getting CORS errors when trying to access the backend API at `https://api.playadoradarp.xyz/port/25617`.

Error message:
```
The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' 
when the request's credentials mode is 'include'.
```

## Root Cause
When using `credentials: 'include'` in fetch requests (which sends cookies), the backend CORS configuration cannot use a wildcard `*` for `Access-Control-Allow-Origin`. It must specify the exact origin.

## Solution Applied

### 1. Backend CORS Configuration Updated
File: `backend/src/app.ts`

Changes made:
- ✅ Return `true` instead of `origin` string in CORS callback
- ✅ Added explicit OPTIONS method support
- ✅ Added Cookie and X-Requested-With to allowed headers
- ✅ Added maxAge for preflight caching
- ✅ Set optionsSuccessStatus to 204
- ✅ Added debug logging in development mode
- ✅ Allow all `.vercel.app` domains automatically
- ✅ Allow localhost with any port in development

### 2. Environment Variables Required

Make sure your backend has these environment variables set:

```bash
# In your backend .env file or deployment platform
FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app
NODE_ENV=production
```

### 3. Deployment Steps

#### For Railway/Render/Other Platform:

1. **Set Environment Variables:**
   ```
   FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app
   NODE_ENV=production
   ```

2. **Redeploy the backend** with the updated `backend/src/app.ts` file

3. **Verify CORS headers** using curl:
   ```bash
   curl -H "Origin: https://cobblemon-los-pitufos.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        -v \
        https://api.playadoradarp.xyz/port/25617/api/gacha/roll
   ```

   You should see:
   ```
   Access-Control-Allow-Origin: https://cobblemon-los-pitufos.vercel.app
   Access-Control-Allow-Credentials: true
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
   ```

### 4. Testing

After redeploying:

1. Open browser console on `https://cobblemon-los-pitufos.vercel.app`
2. Try the gacha roll feature
3. Check Network tab for:
   - OPTIONS preflight request (should return 204)
   - POST/GET request (should succeed)

### 5. Common Issues

**Issue:** Still getting CORS errors after deployment
**Solution:** 
- Clear browser cache
- Check that FRONTEND_URL environment variable is set correctly
- Verify the backend restarted with new code
- Check backend logs for CORS debug messages

**Issue:** Works in development but not production
**Solution:**
- Ensure NODE_ENV=production is set
- Verify FRONTEND_URL matches exactly (no trailing slash)
- Check that the backend is actually running the new code

**Issue:** Preflight OPTIONS request fails
**Solution:**
- Ensure your reverse proxy (if any) passes OPTIONS requests
- Check that no middleware is blocking OPTIONS requests
- Verify maxAge is set for preflight caching

## Quick Verification Checklist

- [ ] Backend code updated with new CORS configuration
- [ ] FRONTEND_URL environment variable set to `https://cobblemon-los-pitufos.vercel.app`
- [ ] NODE_ENV set to `production` (or `development` for testing)
- [ ] Backend redeployed with new code
- [ ] Browser cache cleared
- [ ] Test gacha roll feature
- [ ] Check browser console for errors
- [ ] Verify Network tab shows successful requests

## Additional Notes

The updated CORS configuration now:
- Automatically allows all `.vercel.app` preview deployments
- Provides detailed logging in development mode
- Properly handles preflight OPTIONS requests
- Sets appropriate cache headers for preflight requests
- Explicitly allows Cookie headers for authentication

## Need Help?

If issues persist:
1. Check backend logs for CORS debug messages
2. Use browser DevTools Network tab to inspect request/response headers
3. Verify the exact origin being sent in requests
4. Ensure no proxy or CDN is modifying headers
