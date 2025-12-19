# 🚀 Cobblemon API - Pterodactyl Deployment

Auto-deployment desde GitHub para Pterodactyl.

## 📦 Setup Rápido

### En Pterodactyl Panel:

**Install Command:**
```bash
npm install
```

**Startup Command:**
```bash
node index.js
```

> 💡 **Auto-Build**: El `index.js` detecta si falta el build y lo ejecuta automáticamente la primera vez.

### Variables de Entorno (CRÍTICO):

```bash
MONGODB_URI=mongodb://localhost:27017/cobblemon
NEXTAUTH_URL=http://tu-ip:puerto
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
DISCORD_CLIENT_ID=tu-client-id
DISCORD_CLIENT_SECRET=tu-client-secret
```

## 🔄 ¿Cómo Funciona?

1. **Primera vez**: El script clona el repo `https://github.com/ZekkJJ/cobblemon-api`
2. **Actualizaciones**: Hace `git pull` automático
3. **Build**: Instala dependencias y construye la app
4. **Start**: Inicia el servidor de producción

## ✅ Uso

### Deployment Manual:
```bash
npm run deploy    # Descarga y prepara todo
npm start         # Inicia el servidor
```

### En Pterodactyl:
Solo reinicia el servidor - el Install Command ejecutará `npm run deploy` automáticamente.

## 🛠️ Comandos Útiles

```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# Verificar estado
ps aux | grep node

# Actualizar manualmente
git pull && npm install && npm run build

# Limpiar y reinstalar
rm -rf node_modules .next && npm run deploy
```

## ⚡ Performance

- **Sin Docker**: Más rápido, menos overhead
- **Auto-update**: Pull automático en cada reinicio
- **Production-ready**: Build optimizado con Next.js standalone

## 🐛 Troubleshooting

**Error: "El directorio no está vacío"**
- En consola: `rm -rf *` (cuidado!)

**Error: "Git no está instalado"**
- Usa un egg de Node.js que incluya Git

**Error: "Cannot connect to MongoDB"**
- Verifica `MONGODB_URI` en variables de entorno
- Asegúrate que MongoDB esté corriendo

**Build falla:**
```bash
rm -rf node_modules package-lock.json
npm run deploy
```

---

**Repo**: https://github.com/ZekkJJ/cobblemon-api  
**Autor**: ZekkJJ
