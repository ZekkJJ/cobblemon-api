# 🚨 BACKEND DEPLOYMENT - CRITICAL FIX

## ❌ PROBLEMA ACTUAL

El plugin de Minecraft está obteniendo **404 errors** en TODOS los endpoints:
- `/api/admin/ban-status` → 404
- `/api/gacha/delivery/status` → 404  
- `/api/players/sync` → 404
- `/api/verification/generate` → 404

**CAUSA:** El backend NO está corriendo en el servidor o el plugin está apuntando a la URL incorrecta.

---

## ✅ SOLUCIÓN

### 1. Verificar que el Backend esté Corriendo

```bash
# En el servidor donde está el backend
cd /path/to/backend
pm2 status

# Debería mostrar:
# cobblemon-backend │ online │ 0 │ ...
```

Si NO está corriendo:

```bash
cd /path/to/backend
pm2 start ecosystem.config.js
pm2 save
```

### 2. Verificar la URL del Backend

El backend debe estar accesible en: `http://localhost:25617` o `http://IP_DEL_SERVIDOR:25617`

Prueba desde el servidor de Minecraft:

```bash
curl http://localhost:25617/health
```

Debería responder:

```json
{
  "status": "healthy",
  "timestamp": "...",
  ...
}
```

### 3. Configurar el Plugin

El plugin necesita saber la URL del backend. Busca el archivo de configuración del plugin en el servidor de Minecraft:

```
/path/to/minecraft/config/lospitufos.json
```

O verifica en los logs del plugin al iniciar para ver qué URL está usando.

La configuración debe ser:

```json
{
  "webApiUrl": "http://localhost:25617",
  "syncIntervalSeconds": 300,
  "syncOnCapture": true,
  "syncOnEvolution": true
}
```

### 4. Verificar IP Whitelist

El backend tiene un middleware de IP whitelist. Asegúrate de que la IP del servidor de Minecraft esté en la lista:

**Archivo:** `backend/.env`

```env
ALLOWED_IPS=127.0.0.1,::1,IP_DEL_SERVIDOR_MINECRAFT
```

Si el backend y Minecraft están en el MISMO servidor, usa:

```env
ALLOWED_IPS=127.0.0.1,::1
```

Después de cambiar `.env`, reinicia el backend:

```bash
pm2 restart cobblemon-backend
```

---

## 🧪 TESTING DE ENDPOINTS

Desde el servidor de Minecraft, prueba cada endpoint:

### Test 1: Health Check
```bash
curl http://localhost:25617/health
```

### Test 2: Ban Status
```bash
curl "http://localhost:25617/api/admin/ban-status?uuid=4fa07a77-3772-3168-a557-a863734f1744"
```

### Test 3: Gacha Delivery Status
```bash
curl "http://localhost:25617/api/gacha/delivery/status?uuid=4fa07a77-3772-3168-a557-a863734f1744"
```

### Test 4: Verification Generate
```bash
curl -X POST "http://localhost:25617/api/verification/generate" \
  -H "Content-Type: application/json" \
  -d '{"minecraftUuid":"4fa07a77-3772-3168-a557-a863734f1744","minecraftUsername":"ZekkJJ"}'
```

### Test 5: Player Sync
```bash
curl -X POST "http://localhost:25617/api/players/sync" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"4fa07a77-3772-3168-a557-a863734f1744","username":"ZekkJJ","online":true}'
```

---

## 📝 ENDPOINTS QUE EL PLUGIN USA

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/ban-status?uuid={uuid}` | GET | Verifica si un jugador está baneado |
| `/api/gacha/delivery/status?uuid={uuid}` | GET | Verifica si hay starter pendiente |
| `/api/gacha/delivery/success` | POST | Marca starter como entregado |
| `/api/gacha/delivery/failed` | POST | Marca starter como fallido |
| `/api/players/sync` | POST | Sincroniza datos del jugador |
| `/api/verification/generate` | POST | Genera código de verificación |
| `/api/verification/verify` | POST | Verifica código |
| `/api/level-caps/effective?uuid={uuid}` | GET | Obtiene level caps del jugador |

---

## 🔧 TROUBLESHOOTING

### Error: "Connection refused"
- El backend NO está corriendo
- Solución: `pm2 start ecosystem.config.js`

### Error: "404 Not Found"
- El backend está corriendo pero en un puerto diferente
- Verifica: `pm2 logs cobblemon-backend`
- Busca la línea: `🚀 Server running on port XXXX`

### Error: "IP not whitelisted"
- La IP del plugin no está en ALLOWED_IPS
- Solución: Agregar IP a `backend/.env` y reiniciar

### Error: "Timeout"
- Firewall bloqueando el puerto 25617
- Solución: Abrir puerto en firewall

```bash
# Ubuntu/Debian
sudo ufw allow 25617

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=25617/tcp
sudo firewall-cmd --reload
```

---

## 🚀 DEPLOYMENT COMPLETO (Paso a Paso)

### Paso 1: Deploy Backend

```bash
# 1. Ir al directorio del backend
cd /path/to/backend

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build

# 4. Configurar .env
cp .env.example .env
nano .env

# Configurar:
# PORT=25617
# MONGODB_URI=mongodb://localhost:27017/cobblemon
# ALLOWED_IPS=127.0.0.1,::1
# FRONTEND_URL=https://tu-frontend.vercel.app

# 5. Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Paso 2: Deploy Plugin

```bash
# 1. Compilar plugin
cd /path/to/minecraft-plugin-v2
./gradlew.bat clean build

# 2. Copiar JAR al servidor
scp build/libs/CobblemonLosPitufos-V2-2.0.0.jar user@server:/path/to/minecraft/mods/

# 3. Configurar plugin (si existe archivo de config)
# Editar config para apuntar a http://localhost:25617

# 4. Reiniciar servidor de Minecraft
```

### Paso 3: Verificar

```bash
# 1. Verificar backend
curl http://localhost:25617/health

# 2. Verificar logs del plugin
tail -f /path/to/minecraft/logs/latest.log | grep LosPitufos

# 3. Unirse al servidor y verificar que no haya 404 errors
```

---

## 📊 CHECKLIST DE DEPLOYMENT

- [ ] Backend compilado (`npm run build`)
- [ ] Backend corriendo (`pm2 status`)
- [ ] Puerto 25617 abierto
- [ ] `.env` configurado correctamente
- [ ] ALLOWED_IPS incluye IP del servidor Minecraft
- [ ] Plugin compilado
- [ ] Plugin copiado a `/mods/`
- [ ] Servidor Minecraft reiniciado
- [ ] Health check responde: `curl http://localhost:25617/health`
- [ ] No hay 404 errors en logs del plugin
- [ ] Jugadores pueden unirse sin errores

---

## 🆘 SI NADA FUNCIONA

1. **Verifica que ambos servicios estén en el MISMO servidor:**
   - Backend y Minecraft deben poder comunicarse por `localhost`
   - Si están en servidores diferentes, usa la IP pública

2. **Verifica los logs:**
   ```bash
   # Backend logs
   pm2 logs cobblemon-backend
   
   # Plugin logs
   tail -f /path/to/minecraft/logs/latest.log
   ```

3. **Prueba manualmente cada endpoint** con curl desde el servidor de Minecraft

4. **Verifica que MongoDB esté corriendo:**
   ```bash
   sudo systemctl status mongod
   ```

---

## 📞 CONTACTO

Si después de seguir todos estos pasos aún hay problemas, proporciona:
1. Output de `pm2 status`
2. Output de `pm2 logs cobblemon-backend --lines 50`
3. Output de `curl http://localhost:25617/health`
4. Últimas 50 líneas de logs del plugin
5. Contenido de `backend/.env` (sin credenciales sensibles)
