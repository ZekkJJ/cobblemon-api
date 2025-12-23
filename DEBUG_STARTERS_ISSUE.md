# 🐛 DEBUG: Starters Issue - Solo 1 de 26 Aparece

## 🔍 PROBLEMA

En producción, la galería/pokédex/jugadores muestra solo **1 starter reclamado de 26**, pero en la base de datos MongoDB hay **14 starters reclamados**.

## ✅ CAMBIOS APLICADOS

Agregué logging detallado y un endpoint de debugging para identificar el problema.

### Commit: `5bbffbc`
- ✅ Logging detallado en `/api/starters`
- ✅ Nuevo endpoint `/api/debug/starters` para inspección
- ✅ Logging de base de datos y colecciones al conectar

## 🔧 PASOS PARA DEBUGGEAR

### 1. Pull el Código Nuevo en Pterodactyl
```bash
git pull origin main
```

### 2. Restart el Servidor
Reinicia el servidor en Pterodactyl.

### 3. Verifica los Logs al Iniciar
Busca estas líneas en los logs:
```
✅ Conectado a MongoDB exitosamente
📊 Base de datos: admin
📋 Colecciones disponibles: starters, players, tournaments, ...
```

**VERIFICA**:
- ¿Qué base de datos está usando? (debe ser "admin")
- ¿Qué colecciones aparecen?

### 4. Test el Endpoint de Debug
Abre en tu navegador:
```
https://api.playadoradarp.xyz/port/25617/api/debug/starters
```

**Esto te mostrará**:
```json
{
  "database": "admin",
  "counts": {
    "total": 27,
    "claimed": 14,
    "available": 13
  },
  "starters": [
    {
      "_id": "...",
      "pokemonId": 1,
      "name": "Bulbasaur",
      "nameEs": "Bulbasaur",
      "isClaimed": true,
      "claimedBy": "Usuario#1234",
      "claimedAt": "2024-12-20T..."
    },
    ...
  ]
}
```

### 5. Test el Endpoint Normal
Abre en tu navegador:
```
https://api.playadoradarp.xyz/port/25617/api/starters
```

Verifica los logs en Pterodactyl:
```
[STARTERS API] Fetching starters from database...
[STARTERS API] Total starters found: 27
[STARTERS API] Claimed starters: 14
[STARTERS API] Available starters: 13
[STARTERS API] Sample starters: [...]
```

## 🎯 POSIBLES CAUSAS

### Causa 1: Base de Datos Incorrecta
**Síntoma**: El endpoint `/api/debug/starters` muestra `"database": "brave"` en lugar de `"admin"`

**Solución**: 
El `MONGODB_URI` en Pterodactyl debe terminar en `/admin`:
```
mongodb://ADMIN:9XMsZKF34EAVeSRW@G3CF75C71B99C87-OP9QWIYLW1WNEBAB.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true
```

Si termina en `/brave`, cámbialo a `/admin`.

### Causa 2: Colección Incorrecta
**Síntoma**: Los logs muestran que la colección "starters" no existe

**Solución**: Verifica que la colección se llame exactamente `starters` (minúsculas, plural).

### Causa 3: Datos Corruptos
**Síntoma**: El endpoint `/api/debug/starters` muestra 14 claimed, pero el frontend solo muestra 1

**Solución**: Verifica que todos los starters tengan la propiedad `isClaimed` correctamente:
```javascript
// En MongoDB, ejecuta:
db.starters.find({ isClaimed: true }).count()  // Debe ser 14
db.starters.find({ isClaimed: { $ne: false } }).count()  // Debe ser 14
```

### Causa 4: Cache del Frontend
**Síntoma**: El backend retorna 14 starters, pero el frontend muestra 1

**Solución**: 
1. Abre DevTools en el navegador (F12)
2. Ve a la pestaña "Network"
3. Recarga la página
4. Busca la request a `/api/starters`
5. Verifica cuántos starters retorna

Si retorna 14 pero solo muestra 1, el problema está en el frontend (filtrado incorrecto).

### Causa 5: Filtrado Incorrecto en Frontend
**Síntoma**: Backend retorna 14, pero frontend filtra mal

**Código a Verificar**:
```typescript
// frontend/src/app/galeria/page.tsx
const claimed = data.starters?.filter((s: Starter) => s.isClaimed) || [];
```

Verifica que `s.isClaimed` sea exactamente `true` (boolean), no string "true".

## 📊 CHECKLIST DE DEBUGGING

```
[ ] git pull ejecutado en Pterodactyl
[ ] Servidor reiniciado
[ ] Logs muestran "Base de datos: admin"
[ ] Logs muestran colección "starters" disponible
[ ] /api/debug/starters muestra 14 claimed
[ ] /api/starters retorna 27 starters
[ ] Logs de /api/starters muestran "Claimed starters: 14"
[ ] Frontend Network tab muestra 14 starters claimed
[ ] Frontend muestra 14 starters en galería
```

## 🔍 COMANDOS ÚTILES

### Ver Logs en Tiempo Real
Los logs aparecen automáticamente en la consola de Pterodactyl.

### Test Endpoints Directamente
```bash
# Debug endpoint
curl https://api.playadoradarp.xyz/port/25617/api/debug/starters

# Normal endpoint
curl https://api.playadoradarp.xyz/port/25617/api/starters
```

### Verificar MongoDB Directamente
Si tienes acceso a MongoDB Compass o CLI:
```javascript
use admin
db.starters.countDocuments()  // Total
db.starters.countDocuments({ isClaimed: true })  // Claimed
db.starters.find({ isClaimed: true }).limit(5)  // Ver ejemplos
```

## 📝 REPORTE DE RESULTADOS

Después de hacer los pasos, reporta:

1. **Base de datos conectada**: ¿Qué muestra en los logs?
2. **Endpoint /api/debug/starters**: ¿Qué JSON retorna?
3. **Logs de /api/starters**: ¿Cuántos claimed muestra?
4. **Frontend Network**: ¿Cuántos starters retorna la API?
5. **Frontend UI**: ¿Cuántos starters se muestran?

Con esta información podré identificar exactamente dónde está el problema.

---

**Commit**: `5bbffbc` - "Add detailed logging and debug endpoint for starters"  
**Branch**: `main`  
**Estado**: ✅ PUSHED TO GITHUB
