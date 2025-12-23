# 🚀 DEPLOY FRONTEND A VERCEL - GUÍA RÁPIDA

## ✅ Estado Actual

- ✅ **Sprites arreglados**: Todos los sprites ahora usan las propiedades correctas del backend
- ✅ **Frontend nuevo listo**: En carpeta `frontend/` con todas las correcciones
- ✅ **Scripts de migración creados**: `migrate-frontend.ps1` y `deploy-frontend.ps1`
- ⏳ **Pendiente**: Migrar frontend a raíz y deployar a Vercel

## 🎯 Qué Hace la Migración

El script `migrate-frontend.ps1` hará:

1. **Respaldar frontend antiguo** → Mueve `src/`, `public/`, `package.json`, etc. a `old-frontend/`
2. **Mover frontend nuevo** → Mueve contenido de `frontend/` a la raíz
3. **Limpiar** → Elimina carpeta `frontend/` vacía
4. **Configurar** → Actualiza `.gitignore` y crea `.env.production`

**Resultado**: Frontend nuevo en la raíz, frontend antiguo respaldado en `old-frontend/`

## 📋 Pasos para Deployar

### Paso 1: Ejecutar Migración

```powershell
.\migrate-frontend.ps1
```

**Verifica que salió bien:**
```powershell
# Debe existir:
ls src/app              # ✓ Nuevo frontend
ls old-frontend/src     # ✓ Backup del antiguo

# NO debe existir:
ls frontend/src         # ✗ Debe estar vacío o eliminado
```

### Paso 2: Instalar y Probar

```powershell
# Instalar dependencias
npm install

# Probar build
npm run build

# Si todo está bien, probar localmente (opcional)
npm run dev
# Abre http://localhost:3000
```

### Paso 3: Deploy a Vercel

```powershell
# Opción A: Script automático (RECOMENDADO)
.\deploy-frontend.ps1

# Opción B: Manual
vercel login
vercel --prod
```

### Paso 4: Configurar Variables en Vercel

1. Ve a https://vercel.com
2. Selecciona tu proyecto
3. **Settings** → **Environment Variables**
4. Agrega:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://api.playadoradarp.xyz/port/25617
   Environment: Production
   ```
5. **Redeploy** el proyecto para que tome efecto

## ✅ Verificación Post-Deploy

Abre tu sitio en Vercel y verifica:

- [ ] Página principal carga
- [ ] Gacha funciona (tirada clásica y soul-driven)
- [ ] Galería muestra starters reclamados
- [ ] Pokédex muestra todos los starters
- [ ] **Sprites se ven correctamente** (esto estaba roto antes)
- [ ] Tienda carga productos
- [ ] Jugadores se muestran
- [ ] Torneos se listan
- [ ] Autenticación con Discord funciona

## 🔧 Si Algo Sale Mal

### Build falla
```powershell
# Reinstalar dependencias
Remove-Item node_modules -Recurse -Force
npm install
npm run build
```

### Sprites no se ven en producción
- Verifica que `NEXT_PUBLIC_API_URL` esté en Vercel Dashboard
- Haz un Redeploy después de agregar la variable

### Quieres volver al frontend antiguo
```powershell
# Eliminar nuevo frontend
Remove-Item src, public, package.json, next.config.js, tailwind.config.ts -Recurse -Force

# Restaurar antiguo
Move-Item old-frontend/* . -Force
Remove-Item old-frontend -Recurse -Force

# Reinstalar
npm install
```

## 📊 Diferencias Clave

### Frontend Antiguo (old-frontend/)
- ❌ Sprites rotos (usaba propiedades incorrectas)
- ❌ Estructura desactualizada
- ❌ Sin correcciones recientes

### Frontend Nuevo (frontend/ → raíz)
- ✅ Sprites arreglados (usa `sprite`, `spriteAnimated`, `shiny`, `shinyAnimated`)
- ✅ Validación y fallbacks para datos faltantes
- ✅ Debugging logs agregados
- ✅ Todas las páginas funcionando correctamente

## 🎯 Resumen de Comandos

```powershell
# 1. Migrar
.\migrate-frontend.ps1

# 2. Instalar y probar
npm install
npm run build

# 3. Deploy
.\deploy-frontend.ps1

# 4. Configurar variables en Vercel Dashboard
# NEXT_PUBLIC_API_URL = https://api.playadoradarp.xyz/port/25617
```

## 💡 Notas Importantes

1. **No elimines `old-frontend/`** hasta confirmar que todo funciona en producción
2. **Las variables de entorno** deben configurarse en Vercel Dashboard, no solo en `.env.production`
3. **Después de agregar variables** en Vercel, haz un Redeploy
4. **El backend** debe estar corriendo en https://api.playadoradarp.xyz/port/25617

## 🚀 ¡Listo para Deployar!

Todo está preparado. Solo ejecuta:

```powershell
.\migrate-frontend.ps1
```

Y sigue los pasos. Los scripts te guiarán en cada paso del proceso.

---

**¿Dudas?** Revisa `FRONTEND_DEPLOYMENT_GUIDE.md` para más detalles.
