# DEPLOY TO PTERODACTYL - FINAL STEPS

## ✅ All Changes Pushed to GitHub!

Changes included:
- `next.config.js` - basePath: '/port/25567'
- `index.js` - Improved build detection
- 3 API routes - Added dynamic rendering
- `.env.production` - Updated NEXTAUTH_URL

---

## NOW DO THIS ON PTERODACTYL:

### 1. Pull Latest Changes
In Pterodactyl Console, run:
```bash
git pull
```

### 2. Set Environment Variables
Go to: **Pterodactyl Panel → Startup → Environment Variables**

Add/Update these:
```
NEXTAUTH_URL=https://api.playadoradarp.xyz/port/25567
MONGODB_URI=mongodb://ADMIN:9XMsZKF34EAVeSRW@G3CF75C71B99C87-OP9QWIYLW1WNEBAB.adb.us-ashburn-1.oraclecloudapps.com:27017/brave?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true
MONGODB_DB=admin
NODE_ENV=production
PORT=25567
```

Also add your Discord OAuth:
```
DISCORD_CLIENT_ID=your_id_here
DISCORD_CLIENT_SECRET=your_secret_here
NEXTAUTH_SECRET=your_generated_secret
```

### 3. Restart Server
Click the **Restart** button in Pterodactyl

**Wait 2-3 minutes** for the build to complete.

### 4. Check Console Output
You should see:
```
🏗️ Ejecutando build automáticamente...
✓ Compiled successfully
✅ Build completado!
Server started on port 25567
```

### 5. Access Your Site
Visit: **https://api.playadoradarp.xyz/port/25567**
(NO trailing slash!)

---

## Update Discord OAuth Settings

1. Go to: https://discord.com/developers/applications
2. Select your app → OAuth2 → Redirects
3. Add: `https://api.playadoradarp.xyz/port/25567/api/auth/callback/discord`
4. Save

---

## If It Still Doesn't Work:

Check Console for errors:
```bash
# In Pterodactyl console, check if there are build errors
tail -f /home/container/.next.log
```

Or manually rebuild:
```bash
rm -rf .next
npm run build
```

---

## Your URLs:
- **Website**: https://api.playadoradarp.xyz/port/25567
- **API**: https://api.playadoradarp.xyz/port/25567/api/*
- **Discord Callback**: https://api.playadoradarp.xyz/port/25567/api/auth/callback/discord
