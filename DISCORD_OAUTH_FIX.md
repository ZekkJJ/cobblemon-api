# 🔧 Solución: Error Discord OAuth

## Error Actual
```
Error en servicio externo: Discord OAuth
```

Este error ocurre cuando Discord rechaza el intercambio del código de autorización por tokens.

## Causa
La configuración de Discord OAuth en el Developer Portal no coincide con la del backend.

## Solución Paso a Paso

### 1. Verificar Discord Developer Portal

Ve a: https://discord.com/developers/applications/808344864260358167/oauth2

**IMPORTANTE:** Verifica que tengas estos valores EXACTOS:

#### Redirects
Debe tener EXACTAMENTE esta URL (sin espacios, sin mayúsculas diferentes):
```
http://localhost:4000/api/auth/discord/callback
```

#### Client ID
```
808344864260358167
```

#### Client Secret
Haz clic en "Reset Secret" para generar uno nuevo y cópialo.

### 2. Actualizar backend/.env

Abre `backend/.env` y verifica/actualiza estos valores:

```env
# Discord OAuth
DISCORD_CLIENT_ID=808344864260358167
DISCORD_CLIENT_SECRET=<TU_NUEVO_SECRET_AQUI>
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/discord/callback
```

**CRÍTICO:** 
- La `DISCORD_REDIRECT_URI` debe ser EXACTAMENTE igual a la del Developer Portal
- No debe tener espacios al inicio o final
- Debe usar `http://` (no `https://`) para localhost
- El puerto debe ser `4000`

### 3. Reiniciar el Backend

Después de actualizar el `.env`:

```powershell
# Detener el backend (Ctrl+C en la terminal donde corre)
# Luego reiniciar:
cd backend
npm run dev
```

### 4. Probar de Nuevo

1. Abre http://localhost:3000
2. Haz clic en "Iniciar con Discord"
3. Autoriza la aplicación en Discord
4. Deberías ser redirigido de vuelta con tu sesión iniciada

## Verificación Rápida

Para verificar que la configuración es correcta, ejecuta esto en PowerShell:

```powershell
# Ver las variables de entorno del backend
cd backend
type .env | findstr DISCORD
```

Deberías ver:
```
DISCORD_CLIENT_ID=808344864260358167
DISCORD_CLIENT_SECRET=<tu_secret>
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/discord/callback
```

## Alternativa: Usar Login por Username

Si Discord OAuth sigue sin funcionar, puedes usar el login alternativo:

1. En http://localhost:3000
2. Haz clic en "Ingresar con Nombre de Usuario"
3. Ingresa tu nombre de Discord
4. Listo!

## Notas Importantes

- El `DISCORD_CLIENT_SECRET` es sensible - no lo compartas
- Cada vez que reseteas el secret en Discord, debes actualizarlo en el `.env`
- Siempre reinicia el backend después de cambiar el `.env`
- Para producción, la redirect URI será diferente (con tu dominio real)

## ¿Aún no funciona?

Si después de seguir estos pasos sigue sin funcionar:

1. Verifica que el backend esté corriendo en el puerto 4000
2. Verifica que no haya errores en la consola del backend
3. Intenta resetear el Client Secret en Discord y actualizar el `.env`
4. Usa el login por username como alternativa temporal
