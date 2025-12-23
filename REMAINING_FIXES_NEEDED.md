# Remaining Pages That Need API Client Migration

## Critical Errors (Causing 404s)

### 1. `/api/players` - Used by:
- `src/app/jugadores/page.tsx` - Line 23
- `src/app/admin/tournaments/page.tsx` - Line 94
- `src/app/admin/players/page.tsx` - Line 17
- `src/app/admin/players/[id]/page.tsx` - Line 29

### 2. `/api/server-status` - Used by:
- `src/app/servidor/page.tsx` (likely)
- `src/app/page.tsx` (likely)

### 3. `/api/verify/check` - Used by:
- `src/app/verificar/page.tsx` - Line 30
- `src/app/page.tsx` - Line 118

### 4. `/api/auth/verify-username` - Used by:
- `src/app/page.tsx` - Line 76

### 5. `/api/tournament` (singular) - Used by:
- `src/app/admin/tournaments/page.tsx` - Lines 84, 131, 162
- `src/app/admin/tournaments/[id]/page.tsx` - Line 102

### 6. `/api/admin/*` - Used by:
- `src/app/admin/reset/page.tsx` - Line 22
- `src/app/admin/players/[id]/page.tsx` - Line 52
- `src/app/admin/level-caps/page.tsx` - Lines 29, 49

## Strategy

ALL of these need to be updated to use the centralized `api-client.ts` which calls the backend at `https://api.playadoradarp.xyz/port/25617`.

The backend API is WORKING - we just need to point the frontend to it!
