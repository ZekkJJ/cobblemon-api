# 🎮 PTERODACTYL - COMANDOS RÁPIDOS

## 🔄 DEPLOYAR CAMBIOS

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. Restart Server
Usa el botón "Restart" en el panel de Pterodactyl, o:
```bash
# El servidor se reiniciará automáticamente
```

---

## 🔍 VERIFICAR ESTADO

### Ver Logs del Servidor
Los logs se muestran automáticamente en la consola de Pterodactyl.

Busca estas líneas al iniciar:
```
✅ Conectado a MongoDB exitosamente
✅ Servidor escuchando en puerto 25617
🌐 URL: http://0.0.0.0:25617
🔗 Frontend: https://cobblemon2.vercel.app
```

### Verificar Database
```bash
node inspect-db.js
```

Esto mostrará:
- ✅ Conexión a MongoDB
- 📊 Cantidad de documentos en cada colección
- 📝 Ejemplos de datos

---

## 🐛 DEBUGGING

### Test API Endpoints
Desde tu navegador o Postman:

```
# Health Check
https://api.playadoradarp.xyz/port/25617/health

# Server Status
https://api.playadoradarp.xyz/port/25617/server-status

# Starters
https://api.playadoradarp.xyz/port/25617/api/starters

# Players
https://api.playadoradarp.xyz/port/25617/api/players

# Discord OAuth (abrirá Discord)
https://api.playadoradarp.xyz/port/25617/api/auth/discord
```

### Ver Variables de Entorno
En Pterodactyl, ve a:
1. Startup
2. Variables

Verifica que estén configuradas:
- `MONGODB_URI`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `FRONTEND_URL`
- `SESSION_SECRET`

---

## ⚠️ TROUBLESHOOTING

### Error: "MONGODB_URI environment variable is required"
**Solución**: Configura `MONGODB_URI` en las variables de entorno de Pterodactyl.

### Error: "Endpoint not found /api/auth/discord"
**Solución**: 
1. Verifica que hiciste `git pull`
2. Reinicia el servidor
3. Verifica que `server.js` tenga las rutas de auth

### Error: "Not allowed by CORS"
**Solución**: Verifica que `FRONTEND_URL` esté configurada correctamente:
```
FRONTEND_URL=https://cobblemon2.vercel.app
```

### Discord OAuth redirige a localhost
**Solución**: Configura `FRONTEND_URL` en Pterodactyl:
```
FRONTEND_URL=https://cobblemon2.vercel.app
```

### No se muestran datos en frontend
**Solución**:
1. Ejecuta `node inspect-db.js` para verificar datos en MongoDB
2. Verifica que las colecciones tengan datos
3. Test los API endpoints directamente

---

## 📋 CHECKLIST POST-DEPLOYMENT

Después de hacer `git pull` y restart:

- [ ] Servidor inicia sin errores
- [ ] MongoDB conecta exitosamente
- [ ] Health endpoint responde: `/health`
- [ ] Discord OAuth funciona: `/api/auth/discord`
- [ ] Frontend puede hacer login
- [ ] Datos se muestran en frontend

---

## 🆘 SI TODO FALLA

1. **Verifica logs** en la consola de Pterodactyl
2. **Copia el error exacto** que aparece
3. **Test endpoints** directamente en el navegador
4. **Verifica variables de entorno** están todas configuradas
5. **Ejecuta `inspect-db.js`** para verificar datos

---

## 📞 INFORMACIÓN DE CONTACTO

**Frontend URL**: https://cobblemon2.vercel.app  
**Backend URL**: https://api.playadoradarp.xyz/port/25617  
**GitHub Repo**: (tu repositorio)  
**Discord App ID**: 808344864260358167
