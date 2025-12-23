# Guía de Deployment del Frontend

## 📋 Resumen

Esta guía te ayudará a migrar el nuevo frontend desde la carpeta `frontend/` a la raíz del proyecto, reemplazando el frontend antiguo, y deployarlo a Vercel.

## 🎯 Objetivo

- **Frontend Antiguo** (en raíz: `src/`, `public/`, etc.) → Mover a `old-frontend/` (backup)
- **Frontend Nuevo** (en `frontend/`) → Mover a la raíz
- **Resultado**: Frontend nuevo en la raíz, listo para Vercel

## 🚀 Pasos para el Deployment

### 1. Migrar el Frontend a la Raíz

Ejecuta el script de migración:

```powershell
.\migrate-frontend.ps1
```

**Este script hará:**
- ✅ Creará carpeta `old-frontend/` para backup
- ✅ Moverá el frontend antiguo (`src/`, `public/`, `package.json`, etc.) a `old-frontend/`
- ✅ Moverá el contenido de `frontend/` a la raíz
- ✅ Eliminará la carpeta `frontend/` vacía
- ✅ Actualizará `.gitignore`
- ✅ Creará `.env.production` con la URL del backend
- ✅ Verificará que la estructura sea correcta

### 2. Verificar la Migración

Después de ejecutar el script, verifica que:

```powershell
# Debe existir en la raíz:
ls src/app          # ✓ Nuevo frontend
ls src/components   # ✓ Componentes del nuevo frontend
ls src/lib          # ✓ Librerías del nuevo frontend
ls public           # ✓ Assets públicos
ls package.json     # ✓ Dependencias del nuevo frontend

# Debe existir el backup:
ls old-frontend/src # ✓ Frontend antiguo respaldado

# NO debe existir:
ls frontend/src     # ✗ Carpeta frontend debe estar vacía o eliminada
```

### 3. Instalar Dependencias y Probar Build

```powershell
# Instalar dependencias
npm install

# Probar build local
npm run build

# Si el build es exitoso, probar localmente
npm run dev
```

Abre http://localhost:3000 y verifica que:
- ✅ La página principal carga
- ✅ Los estilos se ven correctos
- ✅ No hay errores en la consola

### 4. Deploy a Vercel

**Opción A - Usar el script automático (RECOMENDADO):**
```powershell
.\deploy-frontend.ps1
```

**Opción B - Manual:**
```powershell
# Login a Vercel (si no lo has hecho)
vercel login

# Deploy a producción
vercel --prod
```

### 5. Configurar Variables de Entorno en Vercel

**IMPORTANTE**: Después del deployment, configura las variables de entorno:

1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega la siguiente variable:

```
Name: NEXT_PUBLIC_API_URL
Value: https://api.playadoradarp.xyz/port/25617
Environment: Production
```

5. Haz un **Redeploy** para que tome efecto:
   - Ve a **Deployments**
   - Click en los 3 puntos del último deployment
   - Click en **Redeploy**

## 📁 Estructura Después de la Migración

```
CobblemonLosPitufos/
├── src/                    # ✓ Nuevo frontend (Next.js 14)
│   ├── app/               # Páginas del nuevo frontend
│   ├── components/        # Componentes del nuevo frontend
│   └── lib/              # Utilidades del nuevo frontend
├── public/                # ✓ Assets públicos del nuevo frontend
├── old-frontend/          # ✓ Frontend antiguo (backup)
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/               # Backend API (sin cambios)
├── package.json           # ✓ Dependencias del nuevo frontend
├── next.config.js         # ✓ Config del nuevo frontend
├── tailwind.config.ts     # ✓ Config de Tailwind del nuevo frontend
├── .env.production        # ✓ Variables de entorno de producción
└── .env.local            # ✓ Variables de entorno locales
```

## ⚠️ Notas Importantes

### 1. Backup del Frontend Antiguo
El frontend antiguo se guarda en `old-frontend/` por si necesitas recuperar algo. **NO lo elimines** hasta estar seguro de que el nuevo frontend funciona correctamente en producción.

### 2. Variables de Entorno
- **Producción**: `.env.production` → `NEXT_PUBLIC_API_URL=https://api.playadoradarp.xyz/port/25617`
- **Local**: `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:4000`
- **Vercel**: Configura en Dashboard → Settings → Environment Variables

### 3. Build Errors
Si hay errores de build, revisa:
- ✅ Todas las dependencias están instaladas (`npm install`)
- ✅ No hay errores de TypeScript (`npm run build`)
- ✅ Las rutas de importación son correctas
- ✅ Las variables de entorno están configuradas

### 4. Vercel CLI
Si no tienes Vercel CLI instalado:
```powershell
npm install -g vercel
```

Para verificar que estás logueado:
```powershell
vercel whoami
```

## 🔄 Rollback (Si algo sale mal)

Si necesitas volver al frontend antiguo:

```powershell
# 1. Eliminar el nuevo frontend de la raíz
Remove-Item -Path "src" -Recurse -Force
Remove-Item -Path "public" -Recurse -Force
Remove-Item -Path "next.config.js" -Force
Remove-Item -Path "tailwind.config.ts" -Force
Remove-Item -Path "package.json" -Force
Remove-Item -Path "package-lock.json" -Force

# 2. Restaurar el frontend antiguo
Move-Item -Path "old-frontend/*" -Destination "." -Force
Remove-Item -Path "old-frontend" -Recurse -Force

# 3. Reinstalar dependencias
npm install

# 4. Redeploy
vercel --prod
```

## 📝 Checklist Pre-Deployment

- [ ] Backend está corriendo y accesible en https://api.playadoradarp.xyz/port/25617
- [ ] Script de migración ejecutado exitosamente
- [ ] Estructura verificada (src/app, src/components, src/lib existen)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Build local exitoso (`npm run build`)
- [ ] No hay errores de TypeScript
- [ ] Variables de entorno configuradas (.env.production)
- [ ] Vercel CLI instalado y logueado
- [ ] Backup del frontend antiguo en old-frontend/

## 🎯 Verificación Post-Deployment

Después del deployment, verifica en producción:

1. ✅ La página principal carga correctamente
2. ✅ El gacha funciona (tirada clásica y soul-driven)
3. ✅ La galería muestra los starters reclamados
4. ✅ La pokédex muestra todos los starters
5. ✅ La tienda carga los productos
6. ✅ Los jugadores se muestran correctamente
7. ✅ Los torneos se listan (o muestra mensaje si no hay)
8. ✅ El servidor de Minecraft muestra su estado
9. ✅ La autenticación con Discord funciona
10. ✅ Los sprites de Pokémon se ven correctamente

## 🆘 Troubleshooting

### Error: "Cannot find module"
```powershell
# Reinstalar dependencias
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path "package-lock.json" -Force
npm install
```

### Error: "Build failed"
```powershell
# Verificar errores de TypeScript
npm run build

# Ver logs detallados
npm run build -- --debug
```

### Error: "Vercel deployment failed"
- Verifica que estés logueado: `vercel whoami`
- Verifica las variables de entorno en Vercel Dashboard
- Revisa los logs en Vercel Dashboard → Deployments → View Function Logs

### Error: "Sprites no se ven"
- Verifica que `NEXT_PUBLIC_API_URL` esté configurado en Vercel
- Verifica que el backend esté respondiendo
- Abre la consola del navegador y busca errores de red

### Error: "Frontend antiguo aún en raíz"
Si el script de migración no funcionó correctamente:
```powershell
# Verificar qué frontend está en la raíz
ls src/app/page.tsx

# Si es el antiguo, ejecuta el script de nuevo
.\migrate-frontend.ps1
```

## 📞 Comandos Útiles

```powershell
# Ver versión de Node
node --version

# Ver versión de npm
npm --version

# Limpiar caché de npm
npm cache clean --force

# Ver logs de Vercel
vercel logs

# Ver información del proyecto en Vercel
vercel inspect

# Listar deployments
vercel ls

# Eliminar un deployment
vercel rm [deployment-url]
```

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu frontend estará en producción en Vercel, conectado al backend en Render, y listo para que los usuarios lo usen.

---

**¿Necesitas ayuda?** Revisa los logs de error y consulta la documentación de:
- [Next.js](https://nextjs.org/docs)
- [Vercel](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
