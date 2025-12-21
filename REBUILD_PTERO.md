# REBUILD PTERODACTYL AHORA

## El Problema
El reverse proxy añade `/port/25567` al path, pero Next.js no sabe qué hacer con eso.
Por eso necesitamos `basePath` en next.config.js.

## Solución - Haz esto AHORA en Pterodactyl

### 1. Detén el servidor
Botón STOP en Pterodactyl

### 2. En File Manager
Borra la carpeta `.next` completa

### 3. Opcional - Forzar git pull
Si quieres asegurar que tiene los últimos cambios:
- Settings → Startup → AUTO_UPDATE = 1
- O manualmente elimina `next.config.js` para forzar pull

### 4. START el servidor
- Presiona START
- Espera 2-3 minutos (va a reconstruir con basePath)
- Deberías ver: "🚀 Usando servidor standalone"

### 5. Prueba
Abre: https://api.playadoradarp.xyz/port/25567/api/server-status

Debería funcionar ahora! ✅

---

## Para Vercel

Vercel NO tiene basePath porque:
- La URL de Vercel NO tiene `/port/25567`
- El basePath solo se activa si `NEXT_PUBLIC_API_URL` contiene `/port/`
- Vercel usa rewrites para proxy, no basePath

¡Todo automático! 🎉
