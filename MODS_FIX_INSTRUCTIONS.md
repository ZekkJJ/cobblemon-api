# Instrucciones para Arreglar el Sistema de Mods

## Problema Identificado
Los mods no suben porque:
1. **CORS bloqueaba las peticiones** - El preflight OPTIONS no estaba siendo manejado correctamente
2. **Los mods en la DB no tienen archivos reales** - Solo metadata con `originalSize: 0`
3. **El backend en producción no tenía el código actualizado**

## Cambios Realizados

### Backend - `server.js`:
1. **Preflight OPTIONS handler** - Maneja correctamente las peticiones OPTIONS antes del middleware CORS
2. **Headers CORS mejorados** - Incluye `Accept`, `Origin` y `Content-Disposition`
3. **Body parser limits aumentados** - De 100kb a 50mb para JSON/urlencoded
4. **Cache de preflight** - 24 horas para reducir peticiones

### Backend - `mods.routes.js`:
1. **CORS headers específicos** - Cada ruta de mods añade headers CORS
2. **Mejor logging** - Errores de multer se loguean con detalle
3. **Field size limit** - 10MB para campos de texto

### Frontend - `AdminModPanel.tsx`:
1. **Retry logic** - Reintenta hasta 3 veces con backoff exponencial
2. **Timeout de 2 minutos** - Por archivo para mods grandes
3. **Mejor manejo de errores** - Mensajes más claros

## Solución - Pasos a Seguir

### Paso 1: Actualizar Backend en Pterodactyl
```bash
cd /home/container
git pull origin main
npm install
```
Luego reiniciar el servidor desde el panel de Pterodactyl.

### Paso 2: Verificar que el Backend Responde
Visita: `https://api.playadoradarp.xyz/port/25617/health`

Deberías ver:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

### Paso 3: Limpiar Mods Sin Archivos
1. Ve a `https://cobblemon2.vercel.app/admin`
2. Click en la pestaña "Mods"
3. Click en el botón rojo "Limpiar" (icono de escoba)
4. Confirmar eliminación

### Paso 4: Subir Mods con Archivos Reales
1. Click en "Subir Varios"
2. Selecciona todos tus archivos .jar/.zip
3. Selecciona la categoría (Requerido, Opcional, etc.)
4. Click "Subir Todos"

El sistema ahora:
- Reintenta automáticamente si falla
- Muestra progreso detallado
- Indica cuáles se subieron, cuáles ya existían, y cuáles fallaron

## Endpoints de Debug

### Ver estado de mods:
```
GET https://api.playadoradarp.xyz/port/25617/api/mods/debug
```

### Probar subida de archivo:
```
POST https://api.playadoradarp.xyz/port/25617/api/mods/test-upload
Content-Type: multipart/form-data
file: [archivo.jar]
```

### Limpiar mods sin archivos:
```
DELETE https://api.playadoradarp.xyz/port/25617/api/mods/cleanup
```

## Verificación Final
Después de subir los mods, el botón "Descargar Todos" debería generar un ZIP de ~230MB con todos los mods reales.
