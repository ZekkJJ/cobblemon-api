# 🚀 Guía de Inicio Rápido - Desarrollo Local

## ✅ Configuración Completada

Los archivos `.env` ya están configurados correctamente para desarrollo local:

- **Backend**: Puerto 4000 (`backend/.env`)
- **Frontend**: Puerto 3000 (`frontend/.env.local`)
- **Base de datos**: MongoDB Oracle Cloud conectada

## 📋 Pasos para Iniciar

### 1. Iniciar el Backend (Terminal 1)

```bash
cd backend
npm install
npm run dev
```

El backend estará disponible en: **http://localhost:4000**

### 2. Iniciar el Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en: **http://localhost:3000**

## 🔐 Discord OAuth - Configuración

El login de Discord está configurado para:
- **Redirect URI**: `http://localhost:4000/api/auth/discord/callback`
- **Frontend Callback**: `http://localhost:3000/auth/callback`

### ⚠️ IMPORTANTE: Configurar Discord Developer Portal

Debes agregar esta URL en tu aplicación de Discord:

1. Ve a: https://discord.com/developers/applications/808344864260358167/oauth2
2. En "Redirects", agrega: `http://localhost:4000/api/auth/discord/callback`
3. Guarda los cambios

## 🧪 Verificar que Todo Funciona

### Backend:
```bash
curl http://localhost:4000/api/health
```

Debería responder: `{"status":"ok","timestamp":"..."}`

### Frontend:
Abre: http://localhost:3000

## 🔄 Flujo de Autenticación Local

1. Usuario hace clic en "Iniciar con Discord" en http://localhost:3000
2. Frontend redirige a: `http://localhost:4000/api/auth/discord`
3. Backend redirige a Discord OAuth
4. Discord redirige de vuelta a: `http://localhost:4000/api/auth/discord/callback`
5. Backend procesa y redirige a: `http://localhost:3000/auth/callback?user=...`
6. Frontend guarda el usuario en localStorage

## 🐛 Solución de Problemas

### "Connection Refused" en localhost:4000
- ✅ Verifica que el backend esté corriendo: `npm run dev` en carpeta `backend/`
- ✅ Verifica el puerto en `backend/.env`: debe ser `PORT=4000`

### Discord OAuth no funciona
- ✅ Verifica que la Redirect URI esté configurada en Discord Developer Portal
- ✅ Verifica que `DISCORD_CLIENT_ID` y `DISCORD_CLIENT_SECRET` sean correctos en `backend/.env`

### Frontend no se conecta al backend
- ✅ Verifica `frontend/.env.local`: debe tener `NEXT_PUBLIC_API_URL=http://localhost:4000`
- ✅ Reinicia el servidor de Next.js después de cambiar `.env.local`

## 📦 Variables de Entorno Configuradas

### Backend (`backend/.env`)
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://admin:...@...
DISCORD_CLIENT_ID=808344864260358167
DISCORD_CLIENT_SECRET=uNnjceg7mLNF9kJl-VasHMSQCYQaSJbb
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/discord/callback
FRONTEND_URL=http://localhost:3000
GROQ_API_KEY=gsk_8jxb21Lr3qa9E4HUn0eSRW...
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🎯 Próximos Pasos

Una vez que ambos servidores estén corriendo:

1. Abre http://localhost:3000
2. Haz clic en "Iniciar con Discord"
3. Autoriza la aplicación en Discord
4. Serás redirigido de vuelta y autenticado

¡Listo para desarrollar! 🎉
