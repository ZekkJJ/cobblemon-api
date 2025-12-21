# LISTO PARA DEPLOYAR

## Estado: TODO LISTO EN GITHUB

Todo el codigo esta arreglado, testeado, y subido a GitHub. Solo falta deployar a Pterodactyl.

---

## Que Hacer AHORA

### Paso 1: Lee la Guia
Abre: `backend/DEPLOY_AHORA.md`

Tiene 3 opciones:
- **Opcion 1:** Auto-Update (2 minutos) - MAS FACIL
- **Opcion 2:** Manual (5 minutos)
- **Opcion 3:** SSH (avanzado)

### Paso 2: Verifica el Deploy
Despues de deployar, ejecuta:
```powershell
cd backend
.\verificar-deploy.ps1
```

---

## Archivos Importantes

| Archivo | Para Que |
|---------|----------|
| `backend/DEPLOY_AHORA.md` | **EMPIEZA AQUI** - Guia paso a paso |
| `backend/verificar-deploy.ps1` | Script para verificar |
| `ACCION_REQUERIDA.md` | Resumen del problema |
| `backend/HAZLO_TU.md` | Guia alternativa |

---

## El Problema (Resumen)

**Servidor actual devuelve:**
```
Access-Control-Allow-Origin: *
```

**Debe devolver:**
```
Access-Control-Allow-Origin: https://cobblemon-los-pitufos.vercel.app
```

**Por que:** El wildcard (*) no funciona con `credentials: 'include'`

---

## La Solucion

1. Agregar variable: `FRONTEND_URL=https://cobblemon-los-pitufos.vercel.app`
2. Actualizar codigo en Pterodactyl (pull de GitHub)
3. Reiniciar servidor
4. Verificar con el script

---

## Tiempo Estimado

- Con Auto-Update: **2 minutos**
- Manual: **5 minutos**
- Dificultad: **Facil**

---

## Despues del Deploy

Una vez que funcione:
1. Abre: https://cobblemon-los-pitufos.vercel.app
2. Intenta un gacha roll
3. NO deberia haber errores CORS

---

## Comandos Rapidos

### Verificar estado actual (antes de deployar):
```powershell
curl.exe -X OPTIONS -H "Origin: https://cobblemon-los-pitufos.vercel.app" -i https://api.playadoradarp.xyz/port/25617/api/gacha/roll
```

### Verificar despues de deployar:
```powershell
cd backend
.\verificar-deploy.ps1
```

---

## Checklist

- [x] Codigo arreglado
- [x] Codigo en GitHub
- [x] Guias creadas
- [x] Scripts de verificacion listos
- [ ] **Deploy a Pterodactyl** <- TU ESTAS AQUI
- [ ] Verificar que funciona
- [ ] Probar en el frontend

---

## Resumen Ultra Corto

1. Lee `backend/DEPLOY_AHORA.md`
2. Sigue Opcion 1 (Auto-Update)
3. Ejecuta `.\verificar-deploy.ps1`
4. Listo!

**Tiempo total: 2-5 minutos**

---

Tu puedes hacerlo! El codigo esta listo, solo falta el deploy.
