# Complete Data Migration Guide

## Quick Start - Choose Your Method

### Method 1: Automated Script ⚡ (Recommended)

**Requirements**: MongoDB Database Tools installed

**Steps**:

1. **Install MongoDB Database Tools** (if not already installed):
   - Download: https://www.mongodb.com/try/download/database-tools
   - Or via Chocolatey: `choco install mongodb-database-tools`

2. **Run the migration script**:
   ```powershell
   cd C:\Users\ptmsh\Downloads\CobblemonLosPitufos
   .\migrate-mongodb.ps1
   ```

3. **Wait for completion** - The script will:
   - Export ALL data from Atlas
   - Import ALL data to Oracle Cloud
   - Show progress and summary

---

### Method 2: MongoDB Compass (GUI) 🖱️

**Requirements**: MongoDB Compass (free GUI tool)

**Steps**:

1. **Download & Install**: https://www.mongodb.com/products/compass

2. **Connect to OLD database (Atlas)**:
   ```
   mongodb+srv://Vercel-Admin-cobblemon22:NdDIdiFDHnD228kY@cobblemon22.seemexn.mongodb.net/
   ```
   - Select database: `cobblemon`

3. **Export each collection**:
   - Click collection name (e.g., `users`)
   - Click "Export Collection" button
   - Choose "Export Full Collection"
   - Format: JSON
   - Save file (e.g., `users.json`)
   
   **Repeat for all collections**:
   - `users`
   - `starters`
   - `tournaments`
   - `level_caps`
   - `shop_stock`
   - `shop_purchases`

4. **Connect to NEW database (Oracle Cloud)**:
   ```
   mongodb://ADMIN:9XMsZKF34EAVeSRW@G3CF75C71B99C87-OP9QWIYLW1WNEBAB.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=$external&ssl=true
   ```
   - Select database: `admin`

5. **Import each collection**:
   - Create collection (e.g., `users`)
   - Click "Add Data" → "Import JSON or CSV file"
   - Select your exported file
   - Click Import
   
   **Repeat for all collections**

---

## What Gets Migrated

✅ **All Collections**:
- `users` - All player accounts, Discord links, verification codes
- `starters` - Starter Pokémon definitions
- `tournaments` - Tournament data and history
- `level_caps` - Level cap configurations
- `shop_stock` - Shop inventory and items
- `shop_purchases` - Purchase history

✅ **All Documents**: Every single record in each collection

✅ **All Fields**: Complete data structure preserved

---

## Verification After Migration

1. **Update `.env.local`** (if you haven't already):
   ```env
   MONGODB_URI="mongodb://ADMIN:9XMsZKF34EAVeSRW@G3CF75C71B99C87-OP9QWIYLW1WNEBAB.adb.us-ashburn-1.oraclecloudapps.com:27017/brave?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true"
   MONGODB_DB="admin"
   ```

2. **Restart your app**:
   ```bash
   npm run dev
   ```

3. **Test key features**:
   - Login with Discord
   - Check user profiles
   - Test verification system
   - Check shop/gacha
   - Verify tournaments

4. **Check data counts**:
   - In MongoDB Compass, compare document counts between old and new databases
   - Should be identical!

---

## Troubleshooting

### "mongodump not found"
→ Install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools

### "Authentication failed"
→ Double-check Oracle Cloud credentials and connection string

### "Network timeout"
→ Check if your IP is whitelisted in Oracle Cloud firewall

### "Collection already exists"
→ The script uses `--drop` flag to replace existing data. This is safe.

---

## Need Help?

If migration fails, you can:
1. Check the backup folder: `./mongodb_backup/cobblemon/`
2. Manually inspect exported BSON files
3. Use MongoDB Compass for visual verification
4. Ask me for help with specific error messages!
