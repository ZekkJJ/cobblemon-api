# 🔄 Migration Script: Replace API Calls

## Quick Reference: Old → New

### Before (Old Way)
```typescript
const res = await fetch('/api/players');
const data = await res.json();
```

### After (New Way)
```typescript
import api from '@/lib/api-client';
const data = await api.players.getAll();
```

## 📋 Component-by-Component Migration

### 1. `src/app/page.tsx` (Home/Gacha)

**Old:**
```typescript
const res = await fetch(`/api/gacha/roll?discordId=${discordId}`);
const data = await res.json();
```

**New:**
```typescript
import api from '@/lib/api-client';
const data = await api.gacha.getStatus(discordId);
```

**Old:**
```typescript
const res = await fetch('/api/gacha/roll', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ discordId, discordUsername, minecraftUsername })
});
```

**New:**
```typescript
const result = await api.gacha.roll({ discordId, discordUsername, minecraftUsername });
```

**Old:**
```typescript
const res = await fetch('/api/gacha/soul-driven', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ discordId, discordUsername, minecraftUsername, preferences })
});
```

**New:**
```typescript
const result = await api.gacha.soulDriven({ discordId, discordUsername, minecraftUsername, preferences });
```

---

### 2. `src/app/jugadores/page.tsx` (Players List)

**Old:**
```typescript
const res = await fetch('/api/players');
const data = await res.json();
setPlayers(data.players || []);
```

**New:**
```typescript
import api from '@/lib/api-client';
const { players } = await api.players.getAll();
setPlayers(players);
```

---

### 3. `src/app/jugadores/[uuid]/page.tsx` (Player Profile)

**Old:**
```typescript
const res = await fetch(`/api/players/${uuid}`);
const data = await res.json();
setProfile(data);
```

**New:**
```typescript
import api from '@/lib/api-client';
const profile = await api.players.getByUuid(uuid);
setProfile(profile);
```

---

### 4. `src/app/tienda/page.tsx` (Shop)

**Old:**
```typescript
const stockRes = await fetch('/api/shop/stock');
const stockData = await stockRes.json();

const balanceRes = await fetch(`/api/shop/balance?uuid=${uuid}`);
const balanceData = await balanceRes.json();

const res = await fetch('/api/shop/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ uuid, itemId, quantity })
});
```

**New:**
```typescript
import api from '@/lib/api-client';

const { stock } = await api.shop.getStock();
const { balance } = await api.shop.getBalance(uuid);
await api.shop.purchase({ uuid, itemId, quantity });
```

---

### 5. `src/app/torneos/page.tsx` (Tournaments)

**Old:**
```typescript
const res = await fetch('/api/tournaments');
const data = await res.json();
setTournaments(data.tournaments || []);
```

**New:**
```typescript
import api from '@/lib/api-client';
const { tournaments } = await api.tournaments.getAll();
setTournaments(tournaments);
```

---

### 6. `src/app/verificar/page.tsx` (Verification)

**Old:**
```typescript
const res = await fetch('/api/verify/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ discordId, minecraftUsername })
});
```

**New:**
```typescript
import api from '@/lib/api-client';
const result = await api.verification.verify({ discordId, code: minecraftUsername });
```

---

### 7. `src/app/pokedex/page.tsx` (Starters)

**Old:**
```typescript
const res = await fetch('/api/starters');
const data = await res.json();
setStarters(data.starters);
```

**New:**
```typescript
import api from '@/lib/api-client';
const { starters } = await api.starters.getAll();
setStarters(starters);
```

---

### 8. `src/components/ServerStatus.tsx`

**Old:**
```typescript
const res = await fetch('/api/server-status');
const data = await res.json();
setStatus(data);
```

**New:**
```typescript
// This endpoint doesn't exist in backend yet
// Keep using frontend API route OR add to backend
// For now, keep as is or create a new backend endpoint
```

---

### 9. Admin Pages

**`src/app/admin/players/page.tsx`:**

**Old:**
```typescript
const res = await fetch('/api/players/sync');
const data = await res.json();
```

**New:**
```typescript
import api from '@/lib/api-client';
const { players } = await api.players.getAll();
```

**`src/app/admin/tournaments/page.tsx`:**

**Old:**
```typescript
const res = await fetch('/api/tournament', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tournamentData)
});
```

**New:**
```typescript
import api from '@/lib/api-client';
await api.tournaments.create(tournamentData);
```

**`src/app/admin/level-caps/page.tsx`:**

**Old:**
```typescript
const configRes = await fetch('/api/admin/level-caps/config');
const configData = await configRes.json();

const res = await fetch('/api/admin/level-caps/config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(config)
});
```

**New:**
```typescript
import api from '@/lib/api-client';
const config = await api.levelCaps.getConfig();
await api.levelCaps.updateConfig(config);
```

---

## 🔍 Find All API Calls

Run this command to find all API calls in your frontend:

```bash
# Windows PowerShell
Select-String -Path "src/**/*.tsx" -Pattern "/api/" -CaseSensitive

# Or use VS Code search:
# Search: /api/
# Files to include: src/**/*.{ts,tsx}
```

## ✅ Verification Checklist

After migrating each component:

- [ ] Import `api` from `@/lib/api-client`
- [ ] Replace `fetch('/api/...')` with `api.module.method()`
- [ ] Remove manual JSON parsing (api-client handles it)
- [ ] Remove manual error handling (api-client throws errors)
- [ ] Test the component works
- [ ] Check browser console for errors
- [ ] Verify network tab shows calls to `localhost:4000`

## 🚨 Common Issues

### Issue: CORS Error
**Solution:** Make sure backend is running and `FRONTEND_URL` is set in `backend/.env`

### Issue: 404 Not Found
**Solution:** Check that the backend endpoint exists and matches the API client method

### Issue: Undefined Response
**Solution:** Backend might return different structure - check backend response format

### Issue: Auth Not Working
**Solution:** Make sure cookies are being sent (`credentials: 'include'` in api-client)

## 📝 Example Full Migration

**Before (`src/app/jugadores/page.tsx`):**
```typescript
'use client';
import { useEffect, useState } from 'react';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayers() {
      try {
        setLoading(true);
        const res = await fetch('/api/players');
        const data = await res.json();
        setPlayers(data.players || []);
      } catch (error) {
        console.error('Error loading players:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, []);

  // ... rest of component
}
```

**After:**
```typescript
'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api-client';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayers() {
      try {
        setLoading(true);
        const { players } = await api.players.getAll();
        setPlayers(players);
      } catch (error) {
        console.error('Error loading players:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, []);

  // ... rest of component
}
```

## 🎯 Priority Order

Migrate in this order for best results:

1. **High Priority** (Core features):
   - [ ] Players list & profiles
   - [ ] Gacha system
   - [ ] Shop
   - [ ] Tournaments

2. **Medium Priority**:
   - [ ] Verification
   - [ ] Starters/Pokedex
   - [ ] Level caps

3. **Low Priority**:
   - [ ] Admin pages
   - [ ] Server status (can stay in frontend)

## 🧹 Cleanup After Migration

Once all components are migrated:

1. **Delete old API routes:**
   ```bash
   # Backup first!
   # Then delete:
   rm -rf src/app/api/
   # Keep only: src/app/api/auth/[...nextauth]/ if using NextAuth
   ```

2. **Remove MongoDB from package.json:**
   ```bash
   npm uninstall mongodb
   ```

3. **Test everything:**
   - Run frontend: `npm run dev`
   - Run backend: `cd backend && npm run dev`
   - Test all features manually

4. **Update documentation:**
   - Update README with new architecture
   - Document environment variables
   - Add deployment instructions
