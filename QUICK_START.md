# ⚡ QUICK START - 5 Minutos para Deployar

## 🎯 OBJETIVO
Hacer que Discord OAuth funcione y verificar que todo esté bien.

---

## 📝 PASO A PASO

### 1️⃣ EN PTERODACTYL (2 minutos)

#### A. Pull el código nuevo
```bash
git pull origin main
```

**Deberías ver**:
```
Updating d7456ce..d15dfa0
Fast-forward
 server.js | XX insertions(+), XX deletions(-)
```

#### B. Verifica estas 3 variables de entorno
Ve a **Startup → Variables** y verifica:

```
FRONTEND_URL = https://cobblemon2.vercel.app
DISCORD_REDIRECT_URI = https://api.playadoradarp.xyz/port/25617/api/auth/discord/callback
DISCORD_CLIENT_ID = 808344864260358167
```

**IMPORTANTE**: `FRONTEND_URL` NO debe tener `/` al final.

#### C. Restart el servidor
Click en el botón **Restart**.

#### D. Verifica los logs
Deberías ver:
```
✅ Conectado a MongoDB exitosamente
✅ Servidor escuchando en puerto 25617
🔗 Frontend: https://cobblemon2.vercel.app
```

---

### 2️⃣ TEST DISCORD LOGIN (1 minuto)

#### A. Abre el frontend
```
https://cobblemon2.vercel.app
```

#### B. Click en "Login with Discord"
Deberías ser redirigido a Discord.

#### C. Autoriza la aplicación
Click en "Autorizar".

#### D. Verifica que volviste al frontend
Deberías ver:
- Tu avatar/nombre en la navbar
- Botón "Salir" en lugar de "Login"

**✅ SI FUNCIONA**: Discord OAuth está listo!  
**❌ SI NO FUNCIONA**: Lee la sección de troubleshooting abajo.

---

### 3️⃣ VERIFICAR DATOS (2 minutos)

#### A. Test los endpoints directamente
Abre en tu navegador:

```
https://api.playadoradarp.xyz/port/25617/api/starters
```

**Si ves `{"starters": []}`**:
- MongoDB no tiene datos de starters
- Necesitas poblar la base de datos

**Si ves `{"starters": [...]}`**:
- ✅ Datos están bien
- Frontend debería mostrarlos

#### B. Ejecuta el script de inspección
En Pterodactyl:
```bash
node inspect-db.js
```

Esto te dirá exactamente qué hay en cada colección.

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Error: "Endpoint not found /api/auth/discord"
**Causa**: No hiciste `git pull` o no reiniciaste.  
**Solución**: 
```bash
git pull origin main
# Restart server
```

### Discord redirige a localhost
**Causa**: `FRONTEND_URL` no está configurada.  
**Solución**: Configura en Pterodactyl:
```
FRONTEND_URL=https://cobblemon2.vercel.app
```

### No se ven sprites
**Causa**: MongoDB no tiene datos o URLs incorrectas.  
**Solución**: 
1. Ejecuta `node inspect-db.js`
2. Verifica que `starters` tenga documentos
3. Verifica que cada starter tenga `sprites` object

### No se ven jugadores/galería/pokédex
**Causa**: MongoDB no tiene datos.  
**Solución**:
1. Ejecuta `node inspect-db.js`
2. Verifica colecciones: `starters`, `players`, `tournaments`
3. Si están vacías, necesitas poblar la base de datos

---

## ✅ CHECKLIST FINAL

```
Backend:
[ ] git pull ejecutado
[ ] Variables de entorno verificadas
[ ] Servidor reiniciado
[ ] Logs muestran "Conectado a MongoDB"

Discord OAuth:
[ ] Login redirige a Discord
[ ] Autorizar funciona
[ ] Redirect de vuelta funciona
[ ] Usuario aparece en navbar

Datos:
[ ] /api/starters retorna datos
[ ] /api/players retorna datos
[ ] Frontend muestra datos
[ ] Sprites se ven correctamente
```

---

## 🎉 SI TODO FUNCIONA

¡Felicidades! El sistema está completo:

✅ Frontend deployado en Vercel  
✅ Backend corriendo en Pterodactyl  
✅ Discord OAuth funcionando  
✅ Sprites arreglados  
✅ Datos mostrándose correctamente  

---

## 📞 SI NECESITAS AYUDA

1. **Copia el error exacto** de los logs
2. **Verifica las variables de entorno** están todas configuradas
3. **Test los endpoints** directamente en el navegador
4. **Ejecuta `inspect-db.js`** para ver el estado de MongoDB

---

## 🚀 PRÓXIMOS PASOS

Una vez que todo funcione:

1. **Poblar datos** si MongoDB está vacío
2. **Test completo** de todas las páginas
3. **Verificar gacha** funciona correctamente
4. **Test en móvil** para responsive design

---

**Tiempo Total**: ~5 minutos  
**Dificultad**: Fácil  
**Resultado**: Sistema funcionando al 100%
