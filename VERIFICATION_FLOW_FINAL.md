# New Verification Flow + Auto-Delivery + Economic Protection

## Overview

This update implements:
1. **New Verification Flow**: Code generated on WEB → Player uses `/verify <code>` in-game
2. **Real-time Shop Delivery**: Auto-delivers purchases to online players every 15 seconds
3. **Advanced Economic AI**: Comprehensive analysis to prevent exploits
4. **Gacha Bug Fix**: Users who already rolled cannot roll again

---

## CRITICAL BUG FIX: Gacha Re-Roll Prevention

### Problem
Users who had already claimed a starter could roll again.

### Solution
- Double-check in both `users` collection AND `starters` collection
- Check for `starterClaimed === true` OR `starterId` exists
- Also check if `claimedBy` exists in starters collection
- Logs all blocked attempts for monitoring

---

## Advanced Economic AI System

### Features:
1. **Wealth Distribution Analysis**
   - Calculates P10, P25, P50, P75, P90 percentiles
   - Measures wealth inequality (Gini-like indicator)
   
2. **Inflation/Deflation Detection**
   - Compares current median to previous
   - Adjusts prices accordingly
   
3. **Purchase Velocity Tracking**
   - Monitors transactions per hour
   - High-demand items get price increases
   
4. **Dynamic Base Price**
   - Uses P25 (lower-middle class) as base
   - Ensures accessibility for new players

### Anti-Exploit Protections:
1. **Quantity Limit**: Max 64 items per transaction
2. **Verification Required**: Must be verified to purchase
3. **Rate Limiting**: Max 10 purchases per minute
4. **Daily Spending Limit**: 500,000 CobbleDollars/day
5. **Optimistic Locking**: Prevents race conditions
6. **Atomic Transactions**: Rollback on failure
7. **Negative Balance Prevention**: Double-checked
8. **Stock Validation**: Fresh read before purchase

---

## New Verification Flow

### How it works:
1. User logs in with Discord on the web
2. User rolls the gacha and gets their starter Pokémon
3. A 5-digit verification code is displayed on the web
4. User enters the Minecraft server
5. User types `/verify <code>` in-game
6. Plugin sends code + minecraftUuid to backend
7. Backend links discordId (from code) with minecraftUuid
8. User is now verified!

### Backend Endpoints (server.js):
- `POST /api/verification/generate-web` - Generate code from web (after Discord auth)
- `POST /api/verification/link` - Link Minecraft to Discord via code (called from plugin)
- `GET /api/verification/status` - Check verification status (for web polling)

### Frontend Changes (page.tsx):
- After gacha roll, generates verification code via `verificationAPI.generateWebCode()`
- Displays code with copy button and instructions
- Polls every 5 seconds to check if user verified in-game
- Shows "Account Linked!" message when verified

### Plugin Changes (VerificationManager.java):
- `/verify <code>` command calls `POST /api/verification/link`
- `/codigo` command shows verification instructions
- On join, shows instructions if not verified
- Polls every 10 seconds to auto-detect web verification

---

## Real-time Shop Delivery

### How it works:
1. User buys pokéballs on the web shop
2. Purchase is saved with status "pending"
3. Plugin polls `/api/shop/purchases` every 15 seconds
4. When purchases found, auto-delivers to player's inventory
5. Shows notification: "§a§l✓ ¡COMPRA ENTREGADA!"
6. Marks purchase as "claimed" in backend

### Plugin Changes (ShopManager.java):
- `ScheduledExecutorService` polls every 15 seconds
- Checks all online players for pending purchases
- Auto-delivers pokéballs using Cobblemon registry
- Handles inventory full gracefully (retries next poll)
- `/claim` command still available as fallback

### Key Features:
- **Zero lag**: All HTTP calls are async
- **No ticks behind**: Uses `server.execute()` for main thread operations
- **Duplicate prevention**: Uses `processingPurchases` set
- **Graceful errors**: Silently handles connection issues

---

## Files Modified

### Backend:
- `backend/server.js` - Added new verification endpoints

### Frontend:
- `frontend/src/app/page.tsx` - Added verification code display and polling
- `frontend/src/lib/api-client.ts` - Added verificationAPI methods

### Plugin:
- `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/verification/VerificationManager.java` - Complete rewrite for new flow
- `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/shop/ShopManager.java` - Added auto-delivery polling
- `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/core/Config.java` - Added frontendUrl

---

## Deployment Steps

1. **Backend**: Push `server.js` to Pterodactyl
2. **Frontend**: Deploy to Vercel (auto-deploys on push)
3. **Plugin**: Rebuild JAR and upload to Minecraft server

---

## Testing

### Verification:
1. Login with Discord on web
2. Roll gacha
3. Copy the 5-digit code
4. Enter Minecraft server
5. Type `/verify <code>`
6. Should see "¡CUENTA VERIFICADA!" in-game
7. Web should show "¡Cuenta Vinculada!"

### Shop Auto-Delivery:
1. Verify account first
2. Buy pokéballs on web shop
3. Wait up to 15 seconds in-game
4. Should receive items with notification
5. Or use `/claim` for immediate delivery
