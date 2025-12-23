# Minecraft Plugin v2 - Endpoint Fixes Complete ✅

## Summary
Fixed ALL incorrect endpoint calls in the Minecraft Plugin v2 (Fabric/Java) to match the backend API routes.

## Files Modified

### 1. VerificationManager.java
**Location:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/verification/VerificationManager.java`

**Changes:**
- ❌ Line 71: `/api/players/verification-status` (GET)
- ✅ Fixed to: `/api/players/sync` (POST with body)

- ❌ Line 107: `/api/players/ban-status` (GET)
- ✅ Fixed to: `/api/admin/ban-status` (GET)

- ❌ Line 127: `/api/players/verification-status` (GET)
- ✅ Fixed to: `/api/players/sync` (POST with body)

**Details:**
- Changed `checkPendingVerifications()` to use POST `/api/players/sync` with JSON body containing uuid, username, and online status
- Changed `onPlayerJoin()` to use GET `/api/admin/ban-status` for ban checks
- Changed `checkVerificationStatus()` to use POST `/api/players/sync` instead of non-existent verification-status endpoint

### 2. StarterManager.java
**Location:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/starter/StarterManager.java`

**Changes:**
- ❌ Line 62: `/api/players/starter` (GET)
- ✅ Fixed to: `/api/gacha/delivery/status` (GET)

- ❌ Line 95: `/api/players/starter-given` (POST)
- ✅ Fixed to: `/api/gacha/delivery/success` (POST) and `/api/gacha/delivery/failed` (POST)

**Details:**
- Changed `checkAndGiveStarter()` to use `/api/gacha/delivery/status` endpoint
- Updated response field checks: `pending` → `deliveryInProgress`, `pokemonId` → `starterId`
- Replaced `notifyStarterGiven()` with two new methods:
  - `notifyStarterSuccess()` - calls `/api/gacha/delivery/success`
  - `notifyStarterFailed()` - calls `/api/gacha/delivery/failed` with reason
- Added proper error handling for failed deliveries

### 3. LevelCapManager.java
**Location:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/levelcaps/LevelCapManager.java`

**Status:** ✅ NO CHANGES NEEDED
- Already using correct endpoint: `/api/level-caps/effective` (GET)

### 4. WebSyncManager.java
**Location:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/sync/WebSyncManager.java`

**Status:** ✅ NO CHANGES NEEDED
- Already using correct endpoint: `/api/players/sync` (POST)

## Endpoint Mapping Summary

| Old Endpoint (WRONG) | New Endpoint (CORRECT) | Method | File |
|---------------------|------------------------|--------|------|
| `/api/players/starter` | `/api/gacha/delivery/status` | GET | StarterManager.java |
| `/api/players/ban-status` | `/api/admin/ban-status` | GET | VerificationManager.java |
| `/api/players/verification-status` | `/api/players/sync` | POST | VerificationManager.java (2 places) |
| `/api/players/starter-given` | `/api/gacha/delivery/success` | POST | StarterManager.java |
| N/A | `/api/gacha/delivery/failed` | POST | StarterManager.java (new) |

## Response Field Changes

### StarterManager - Delivery Status Response
**Old fields:**
```json
{
  "pending": boolean,
  "pokemonId": number,
  "isShiny": boolean
}
```

**New fields:**
```json
{
  "deliveryInProgress": boolean,
  "starterId": number,
  "isShiny": boolean,
  "hasStarter": boolean,
  "starterGiven": boolean,
  "deliveryAttempts": number
}
```

## Testing Checklist

### 1. Player Join Flow
- [ ] Player joins server
- [ ] Ban status checked via `/api/admin/ban-status`
- [ ] Verification status checked via `/api/players/sync` (POST)
- [ ] If unverified, verification code generated via `/api/verification/generate`
- [ ] Player receives in-game message with code

### 2. Starter Delivery Flow
- [ ] Player joins with pending starter
- [ ] Plugin checks `/api/gacha/delivery/status`
- [ ] If `deliveryInProgress: true`, starter is given
- [ ] Success notification sent to `/api/gacha/delivery/success`
- [ ] If error occurs, failure notification sent to `/api/gacha/delivery/failed`

### 3. Verification Flow
- [ ] Player verifies on website
- [ ] Auto-verification checker polls `/api/players/sync` every 5 seconds
- [ ] Player receives in-game notification when verified
- [ ] Movement restrictions removed

### 4. Level Caps Flow
- [ ] Player captures Pokemon
- [ ] Plugin checks `/api/level-caps/effective`
- [ ] Capture cap enforced (removes Pokemon if level > cap)
- [ ] Ownership cap enforced (blocks exp gain at cap)

## Backend Compatibility

All endpoints now match the backend API routes defined in:
- `backend/src/modules/gacha/gacha.routes.ts` - Starter/gacha endpoints
- `backend/src/modules/admin/admin.routes.ts` - Ban status endpoint
- `backend/src/modules/players/players.routes.ts` - Player sync endpoint
- `backend/src/modules/verification/verification.routes.ts` - Verification endpoints
- `backend/src/modules/level-caps/level-caps.routes.ts` - Level caps endpoints

## Next Steps

1. **Rebuild Plugin:**
   ```bash
   cd minecraft-plugin-v2
   ./gradlew build
   ```

2. **Deploy to Server:**
   - Copy `build/libs/lospitufos-cobblemon-*.jar` to server's `mods/` folder
   - Restart Minecraft server

3. **Verify Configuration:**
   - Check `config/lospitufos-cobblemon.json` has correct `webApiUrl`
   - Verify backend `.env` has Minecraft server IP in `ALLOWED_IPS`

4. **Test All Flows:**
   - Test player join with unverified account
   - Test starter delivery
   - Test verification (both web and in-game)
   - Test level caps enforcement
   - Test ban status check

## Expected Results

After these fixes:
- ✅ No more 404 errors in server logs
- ✅ Ban status checks work correctly
- ✅ Verification status checks work correctly
- ✅ Starter delivery works correctly
- ✅ Level caps enforcement works correctly
- ✅ All API calls use correct endpoints

## Improvements Made

1. **Proper Error Handling:** Added separate success/failed endpoints for starter delivery
2. **Correct HTTP Methods:** Changed GET to POST where required (verification status)
3. **Proper Request Bodies:** Added JSON payloads for POST requests to `/api/players/sync`
4. **Response Field Mapping:** Updated code to use correct response field names
5. **Idempotency:** Starter delivery now properly handles already-delivered cases

---

**Status:** ✅ ALL ENDPOINT FIXES COMPLETE
**Date:** December 22, 2025
**Plugin Version:** v2 (Fabric/Java)
**Backend Compatibility:** 100%
