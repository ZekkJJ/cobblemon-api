# Instrucciones para Arreglar el Sistema de Mods

## Problema
Los mods en la base de datos fueron creados sin archivos reales (solo metadata). Por eso:
- El ZIP descargado pesa solo 3MB en lugar de 230MB
- Los mods muestran "Sin archivo" en el panel admin

## Cambios Realizados

### Backend - `mods.routes.js`:
1. **Mejor sanitizado de nombres**: Ahora maneja correctamente archivos con:
   - Espacios → se convierten en `_`
   - Paréntesis `()` → se eliminan
   - Signo `+` → se convierte en `_plus_`
   - Otros caracteres especiales → se convierten en `_`

2. **Límite de tamaño aumentado**: De 100MB a 200MB

3. **Mejor manejo de errores**: Mensajes más claros cuando falla la subida

4. **Nuevo endpoint de prueba**: `POST /api/mods/test-upload` para probar si un archivo se puede subir

### Frontend - `AdminModPanel.tsx`:
1. **Botón "Limpiar"**: Elimina mods sin archivos válidos
2. **Indicador visual**: Muestra "Archivo OK" (verde) o "Sin archivo" (rojo)

## Solución

### Paso 1: Desplegar el Backend Actualizado
```bash
cd backend
git add .
git commit -m "Fix mods upload: better filename sanitization, increased size limit"
git push origin main
```

En Pterodactyl:
```bash
git pull origin main
npm install
# Reiniciar el servidor
```

### Paso 2: Limpiar Mods Sin Archivos
1. Ve a `/admin` → Pestaña "Mods"
2. Click en botón "Limpiar" (rojo con icono de escoba)
3. Confirmar eliminación

### Paso 3: Subir Mods con Archivos Reales
1. Click en "Subir Varios"
2. Selecciona todos tus archivos .jar/.zip
3. Selecciona la categoría
4. Click "Subir Todos"

## Endpoints de Debug

### Ver estado de mods:
```
GET /api/mods/debug
```

### Probar subida de archivo:
```
POST /api/mods/test-upload
Content-Type: multipart/form-data
file: [archivo.jar]
```
Esto prueba si el archivo se puede subir sin guardarlo en la DB.

### Limpiar mods sin archivos:
```
DELETE /api/mods/cleanup
```

## Ejemplos de Nombres Sanitizados
- `Cobblemon AFP 1.9.2-1.21.1-Fabric-NoGEB.jar` → `Cobblemon_AFP_1.9.2-1.21.1-Fabric-NoGEB.jar`
- `CobbleFurnies-fabric-1.0 (1).jar` → `CobbleFurnies-fabric-1.0_1.jar`
- `fabric-language-kotlin-1.13.7+kotlin.2.2.21.jar` → `fabric-language-kotlin-1.13.7_plus_kotlin.2.2.21.jar`
