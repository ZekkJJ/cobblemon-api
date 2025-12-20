# MongoDB Migration - CORRECTED Commands

## Run these 2 commands in PowerShell:

### Step 1: Export from Atlas (should already be done)
```powershell
mongodump --uri="mongodb+srv://Vercel-Admin-cobblemon22:NdDIdiFDHnD228kY@cobblemon22.seemexn.mongodb.net/" --db=cobblemon --out=./mongodb_backup
```

### Step 2: Import to Oracle Cloud (FIXED - added loadBalanced=true)
```powershell
mongorestore --uri="mongodb://ADMIN:9XMsZKF34EAVeSRW@G3CF75C71B99C87-OP9QWIYLW1WNEBAB.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=`$external&ssl=true&retryWrites=false&loadBalanced=true" --db=admin ./mongodb_backup/cobblemon --drop
```

The key change: Added `&retryWrites=false&loadBalanced=true` at the end!

---

## If that still fails, try this alternative:

Some versions of mongorestore don't support `loadBalanced=true`. In that case, use **MongoDB Compass** instead:

1. Download: https://www.mongodb.com/products/compass
2. Connect to Oracle Cloud with this string:
   ```
   mongodb://ADMIN:9XMsZKF34EAVeSRW@G3CF75C71B99C87-OP9QWIYLW1WNEBAB.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=$external&ssl=true&loadBalanced=true
   ```
3. Import your backup files from `./mongodb_backup/cobblemon/` folder
