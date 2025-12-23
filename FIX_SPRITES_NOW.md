# 🔥 FIX CRÍTICO: Agregar Sprites a Starters

## 🐛 PROBLEMA REAL IDENTIFICADO

Los logs del frontend muestran:
```
[GALERIA] Claimed starters: 15
Starter missing sprites: Object
Starter missing sprites: Object
... (15 veces)
```

**El problema**: Los starters en MongoDB **NO tienen el objeto `sprites`**, por eso el frontend los filtra y no los muestra.

## ✅ SOLUCIÓN

Ejecutar el script `fix-sprites.js` que agregará los sprites a todos los starters.

### Paso 1: En Pterodactyl, ejecuta:

```bash
node fix-sprites.js
```

**Esto hará**:
- Conectar a MongoDB
- Buscar todos los starters
- Agregar el objeto `sprites` a cada uno con las URLs correctas:
  - `sprite` - Sprite normal estático
  - `spriteAnimated` - Sprite normal animado
  - `shiny` - Sprite shiny estático
  - `shinyAnimated` - Sprite shiny animado
  - `artwork` - Artwork oficial
  - `cry` - Sonido del Pokémon

### Paso 2: Verifica el resultado

El script mostrará:
```
✅ Conectado a MongoDB
📊 Total starters: 27
✅ Updated Bulbasaur (1)
✅ Updated Charmander (4)
...
📊 Resumen:
   ✅ Actualizados: 27
   ⏭️  Skipped: 0
   📦 Total: 27
```

### Paso 3: Recarga el frontend

Abre https://cobblemon2.vercel.app/galeria y deberías ver los 15 starters con sus sprites.

## 📊 ESTRUCTURA DE SPRITES

Cada starter ahora tendrá:
```javascript
{
  pokemonId: 1,
  name: "Bulbasaur",
  nameEs: "Bulbasaur",
  isClaimed: true,
  claimedBy: "Usuario#1234",
  sprites: {
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    spriteAnimated: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif",
    shiny: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png",
    shinyAnimated: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/1.gif",
    artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
    cry: "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/1.ogg"
  }
}
```

## 🎯 POR QUÉ ESTO ARREGLA TODO

1. **Galería**: Ahora mostrará los 15 starters con sprites
2. **Pokédex**: Mostrará todos los 27 starters con sprites
3. **Jugadores**: Mostrará los jugadores con sus starters
4. **Frontend**: Ya no filtrará los starters por falta de sprites

## ⚠️ IMPORTANTE

Este script es **IDEMPOTENTE**: Si lo ejecutas varias veces, no duplicará datos. Solo actualizará los starters que no tengan sprites.

## 🔍 VERIFICACIÓN

Después de ejecutar el script, verifica:

1. **En MongoDB** (si tienes acceso):
```javascript
db.starters.findOne({ pokemonId: 1 })
// Debe mostrar el objeto sprites
```

2. **En el frontend**:
- Abre DevTools (F12)
- Ve a Network
- Recarga la página
- Busca la request a `/api/starters`
- Verifica que cada starter tenga `sprites`

3. **Visualmente**:
- https://cobblemon2.vercel.app/galeria → Debe mostrar 15 starters
- https://cobblemon2.vercel.app/pokedex → Debe mostrar 27 starters
- https://cobblemon2.vercel.app/jugadores → Debe mostrar jugadores

---

**Script**: `backend/fix-sprites.js`  
**Tiempo estimado**: 30 segundos  
**Riesgo**: Ninguno (solo agrega datos, no borra nada)
