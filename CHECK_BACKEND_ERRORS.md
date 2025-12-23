# 🔍 Verificar Errores del Backend

## Problema Actual

1. `POST /api/auth/verify-username` → 500 Internal Server Error
2. `GET /api/server-status` → 404 Not Found

## Pasos para Diagnosticar

### 1. Ver los logs del backend

En la terminal donde corre el backend (donde ejecutaste `npm run dev`), deberías ver el error completo. Busca líneas que digan:

```
Error: ...
    at ...
```

### 2. Verificar que el backend esté corriendo

Abre una nueva terminal y ejecuta:

```powershell
curl http://localhost:4000/api/health
```

Si devuelve algo como `{"status":"ok"}`, el backend está corriendo.

### 3. Probar el endpoint manualmente

```powershell
curl -X POST http://localhost:4000/api/auth/verify-username `
  -H "Content-Type: application/json" `
  -d '{"discordUsername":"test","nickname":"Test User"}'
```

Copia el error completo que aparezca.

## Posibles Causas

### Error 500 en verify-username

Probablemente es un error de base de datos. Posibles causas:

1. **MongoDB no está conectado** - Verifica la conexión en los logs
2. **Error en el código** - Puede haber un typo o error de sintaxis
3. **Colección no existe** - La colección `users` no está creada

### Error 404 en server-status

Este endpoint simplemente no existe en el backend. Necesitamos crearlo o el frontend no debería llamarlo.

## Solución Rápida

Por ahora, puedes comentar el ServerIndicator en el Navbar para evitar el error 404.

En `frontend/src/components/Navbar.tsx`, busca donde se usa `<ServerIndicator />` y coméntalo temporalmente.
