# 🚀 DEPLOY URGENTE A PTERODACTYL

## 🐛 PROBLEMAS ACTUALES

1. **Gacha 404**: Frontend llama `/api/gacha/roll` pero el endpoint no existe en producción
2. **Sprites missing**: Los 15 starters en MongoDB no tienen el objeto `sprites`

## ✅ SOLUCIÓN: 3 COMANDOS

### En Pterodactyl, ejecuta estos comandos EN ORDEN:

```bash
# 1. Traer los cambios de GitHub
git pull origin main

# 2. Agregar sprites a todos los starters
node fix-sprites.js

# 3. Reiniciar el servidor
# (Usa el botón RESTART en Pterodactyl)
```

## 📋 QUÉ HACE CADA COMANDO

### 1. `git pull origin main`
Trae los cambios:
- ✅ Gacha endpoints en `server.js` (GET `/api/gacha/status/:discordId`, POST `/api/gacha/roll`)
- ✅ Script `fix-sprites.js` para agregar sprites

### 2. `node fix-sprites.js`
Agrega sprites a los 27 starters en MongoDB:
```javascript
sprites: {
  sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
  spriteAnimated: "...",
  shiny: "...",
  shinyAnimated: "...",
  artwork: "...",
  cry: "..."
}
```

**Output esperado**:
```
✅ Conectado a MongoDB
📊 Total starters: 27
✅ Updated Bulbasaur (1)
✅ Updated Charmander (4)
...
📊 Resumen:
   ✅ Actualizados: 27
   ⏭️  Skipped: 0
```

### 3. Reiniciar servidor
Aplica los cambios del `server.js` con los gacha endpoints.

## 🎯 RESULTADO ESPERADO

Después de estos 3 pasos:

1. **Gacha funcionará**: 
   - Login con Discord → Gacha roll → Obtener starter
   - No más 404 en `/api/gacha/roll`

2. **Sprites aparecerán**:
   - Galería: 15 starters con sprites ✅
   - Pokédex: 27 starters con sprites ✅
   - Jugadores: Jugadores con sus starters ✅

## 🔍 VERIFICACIÓN

Después de reiniciar, verifica:

1. **Gacha**: https://cobblemon2.vercel.app → Login → Debería funcionar el gacha
2. **Galería**: https://cobblemon2.vercel.app/galeria → Debe mostrar 15 starters
3. **Pokédex**: https://cobblemon2.vercel.app/pokedex → Debe mostrar 27 starters

## ⚠️ IMPORTANTE

- El script `fix-sprites.js` es **idempotente**: puedes ejecutarlo varias veces sin problemas
- Los gacha endpoints ya están en el código, solo necesitan reinicio
- Todo el código ya está pusheado a GitHub

---

**Tiempo estimado**: 2 minutos  
**Riesgo**: Ninguno (solo agrega funcionalidad)
