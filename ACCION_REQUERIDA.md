# 🚨 ACCIÓN REQUERIDA - Deploy del Fix CORS

## Estado Actual

✅ **Código:** Arreglado y en GitHub  
✅ **Documentación:** Completa  
❌ **Servidor:** Necesita actualización

---

## El Problema

Tu servidor en `https://api.playadoradarp.xyz/port/25617` todavía está devolviendo:
```
Access-Control-Allow-Origin: *
```

Esto causa el error CORS en el frontend porque usas `credentials: 'include'`.

---

## La Solución

El código ya está arreglado en GitHub. Solo necesitas **deployarlo a Pterodactyl**.

---

## 🎯 Qué Hacer AHORA

### Opción Más Fácil: Auto-Update

Si tienes `AUTO_UPDATE=1` en Pterodactyl:

1. **Abre Pterodactyl Panel**
2. **Startup → Environment Variables**
3. **Agrega:** `FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app`
4. **STOP** el servidor
5. **START** el servidor (descarga código de GitHub automáticamente)
6. **Espera 2-3 minutos**

### Verificar que Funcionó

Ejecuta en PowerShell:
```powershell
cd backend
.\verificar-deploy.ps1
```

O manualmente:
```powershell
curl.exe -X OPTIONS -H "Origin: https://cobblemon-los-pitufos.vercel.app" -i https://api.playadoradarp.xyz/port/25617/api/gacha/roll
```

**Debes ver:**
```
Access-Control-Allow-Origin: https://cobblemon-los-pitufos.vercel.app
```

---

## 📚 Guías Disponibles

| Archivo | Descripción |
|---------|-------------|
| `backend/DEPLOY_AHORA.md` | **EMPIEZA AQUÍ** - Guía paso a paso simple |
| `backend/verificar-deploy.ps1` | Script para verificar el deploy |
| `backend/HAZLO_TU.md` | Guía alternativa |
| `backend/URGENT_CORS_FIX_DEPLOYMENT.md` | Guía detallada técnica |

---

## ⏱️ Tiempo Estimado

- **Con Auto-Update:** 2 minutos
- **Manual:** 5 minutos
- **Dificultad:** Fácil

---

## 🎉 Después del Deploy

Una vez que el servidor devuelva el origin correcto:

1. Abre: https://cobblemon-los-pitufos.vercel.app
2. Intenta hacer un gacha roll
3. **¡Debería funcionar sin errores CORS!**

---

## 🆘 Si Necesitas Ayuda

1. Lee `backend/DEPLOY_AHORA.md` - tiene 3 opciones diferentes
2. Ejecuta `.\verificar-deploy.ps1` para diagnosticar
3. Revisa los logs en Pterodactyl Console
4. Verifica que `FRONTEND_URL` esté configurado

---

## Resumen

**Problema:** CORS error por wildcard (`*`)  
**Causa:** Código viejo en servidor  
**Solución:** Deploy código nuevo de GitHub  
**Acción:** Sigue `backend/DEPLOY_AHORA.md`  
**Tiempo:** 2-5 minutos  

**¡El código está listo, solo falta deployarlo! 🚀**
