# Instrucciones de Setup - Frontend Cobblemon Los Pitufos

## ✅ Tareas Completadas (1-25)

### Fase 1: Setup del Proyecto ✅
- [x] 1. Crear proyecto Next.js 14
- [x] 2. Configurar estructura de carpetas
- [x] 3. Configurar variables de entorno
- [x] 4. Configurar Tailwind CSS
- [x] 5. Agregar fuentes y assets
- [x] 6. Configurar next.config.js

### Fase 2: API Client y Tipos ✅
- [x] 7. Crear tipos TypeScript
- [x] 8. Implementar API Client base
- [x] 9. Implementar módulos del API Client

### Fase 3: Layout y Navegación ✅
- [x] 10. Crear componente Providers
- [x] 11. Implementar Navbar
- [x] 12. Crear componente ServerIndicator
- [x] 13. Configurar Layout principal
- [x] 14. Crear estilos globales

### Fase 4: Sistema de Sonidos ✅
- [x] 15. Implementar librería de sonidos
- [x] 16. Implementar MusicPlayer

### Fase 5: Página Principal - Gacha ✅
- [x] 17. Crear componente StarterCard
- [x] 18. Crear componente SoulDrivenQuestionnaire
- [x] 19. Implementar página principal (Gacha)
- [x] 20. Implementar autenticación Discord OAuth
- [x] 21. Implementar autenticación por username
- [x] 22. Implementar verificación de Minecraft

### Fase 6: Página de Tienda ✅
- [x] 23. Implementar página de Tienda
- [x] 24. Implementar tarjetas de Pokéball
- [x] 25. Implementar funcionalidad de compra

## 🚀 Cómo Ejecutar el Frontend

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 2. Verificar Variables de Entorno

El archivo `.env.local` ya está configurado con:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Si tu backend está en otro puerto, edita este archivo.

### 3. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:3000**

### 4. Asegúrate de que el Backend Esté Corriendo

El frontend necesita que el backend esté corriendo en `http://localhost:4000`

```bash
cd backend
npm run dev
```

## 📁 Estructura Creada

```
frontend/
├── public/
│   ├── pokeballs/          # ✅ Sprites copiados
│   ├── sounds/             # ⚠️ Agregar archivos de sonido
│   └── background-music.mp3 # ✅ Copiado
├── src/
│   ├── app/
│   │   ├── layout.tsx      # ✅ Layout con Navbar
│   │   ├── page.tsx        # ✅ Página Gacha completa
│   │   ├── globals.css     # ✅ Estilos globales
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── page.tsx # ✅ Callback OAuth
│   │   └── tienda/
│   │       └── page.tsx    # ✅ Página de tienda
│   ├── components/
│   │   ├── Navbar.tsx              # ✅ Navegación completa
│   │   ├── ServerIndicator.tsx     # ✅ Estado del servidor
│   │   ├── StarterCard.tsx         # ✅ Tarjeta de Pokémon
│   │   ├── SoulDrivenQuestionnaire.tsx # ✅ Cuestionario
│   │   ├── MusicPlayer.tsx         # ✅ Reproductor de música
│   │   └── Providers.tsx           # ✅ Context providers
│   └── lib/
│       ├── api-client.ts   # ✅ Cliente API completo
│       ├── sounds.ts       # ✅ Sistema de sonidos
│       └── types/          # ✅ Todos los tipos
│           ├── pokemon.ts
│           ├── shop.ts
│           ├── tournament.ts
│           └── user.ts
├── .env.local              # ✅ Variables de entorno
├── next.config.js          # ✅ Configurado
├── tailwind.config.ts      # ✅ Colores personalizados
└── package.json            # ✅ Dependencias
```

## ⚠️ Notas Importantes

### Archivos de Sonido Faltantes

Los archivos de sonido no están incluidos. Necesitas agregar estos archivos en `frontend/public/sounds/`:
- `click.mp3`
- `confirm.mp3`
- `cancel.mp3`
- `roll.mp3`
- `success.mp3`
- `error.mp3`

Puedes usar archivos de sonido temporales o descargar efectos de sonido gratuitos de sitios como:
- https://freesound.org/
- https://mixkit.co/free-sound-effects/

### Backend Debe Estar Corriendo

El frontend hace llamadas al backend en `http://localhost:4000`. Asegúrate de que:
1. El backend esté corriendo
2. MongoDB esté conectado
3. Las variables de entorno del backend estén configuradas

## 🎨 Características Implementadas

### Página Principal (Gacha)
- ✅ Autenticación con Discord OAuth
- ✅ Autenticación alternativa por username
- ✅ Modo de gacha clásico
- ✅ Modo Soul Driven con cuestionario
- ✅ Animación de tirada
- ✅ Mostrar resultado con StarterCard
- ✅ Verificación de Minecraft
- ✅ Contador de starters disponibles

### Página de Tienda
- ✅ Mostrar balance de CobbleDollars
- ✅ Catálogo de Pokéballs con precios dinámicos
- ✅ Indicadores de stock con colores
- ✅ Controles de cantidad (+/-, input, MAX)
- ✅ Validación de balance y stock
- ✅ Compra funcional
- ✅ Filtros de búsqueda
- ✅ Timer de próxima actualización

### Componentes Globales
- ✅ Navbar con navegación completa
- ✅ ServerIndicator con actualización automática
- ✅ MusicPlayer con visualizador de audio
- ✅ Sistema de sonidos con preferencias

## 🧪 Cómo Probar

### 1. Probar Autenticación
1. Visita http://localhost:3000
2. Haz clic en "Iniciar con Discord" (requiere backend configurado con Discord OAuth)
3. O usa "Ingresar con Nombre de Usuario" para auth rápida

### 2. Probar Gacha
1. Después de autenticarte, verás la máquina gacha
2. Selecciona modo "Clásico" o "Soul Driven"
3. Haz clic en "INVOCAR"
4. Verás la animación y el resultado

### 3. Probar Tienda
1. Navega a http://localhost:3000/tienda
2. Necesitas estar autenticado y verificado en Minecraft
3. Verás el catálogo de Pokéballs
4. Selecciona cantidad y compra

### 4. Probar Navegación
- Usa el navbar para navegar entre páginas
- El indicador de servidor muestra el estado en tiempo real
- El toggle de sonido controla los efectos de audio

## 🐛 Troubleshooting

### Error: Cannot connect to backend
- Verifica que el backend esté corriendo en puerto 4000
- Revisa la consola del backend para errores
- Verifica que `NEXT_PUBLIC_API_URL` esté correcta en `.env.local`

### Error: Module not found
- Ejecuta `npm install` en la carpeta frontend
- Verifica que todas las dependencias estén instaladas

### Estilos no se aplican
- Ejecuta `npm run dev` de nuevo
- Limpia el cache: elimina `.next` y vuelve a ejecutar

### Imágenes no cargan
- Verifica que los sprites de pokéballs estén en `public/pokeballs/`
- Verifica que `background-music.mp3` esté en `public/`

## 📝 Próximos Pasos

Las siguientes tareas del spec son:
- Tarea 26: Implementar filtros y búsqueda (ya incluido en tarea 23)
- Tarea 27-34: Páginas de Jugadores
- Tarea 35-40: Galería y Torneos
- Tarea 41-43: Servidor y componentes adicionales
- Tarea 44-46: Páginas adicionales (Pokédex, Comparador, Verificar)
- Tarea 47-51: Panel de administración
- Tarea 52-58: Optimización y pulido
- Tarea 59-66: Testing y deployment

## 💡 Tips

1. **Hot Reload**: Next.js recarga automáticamente cuando guardas cambios
2. **Console**: Abre las DevTools para ver logs y errores
3. **Network Tab**: Revisa las llamadas al backend en la pestaña Network
4. **localStorage**: Puedes ver los datos guardados en Application > Local Storage

## 🎉 ¡Listo!

El frontend está configurado y listo para desarrollo. Ejecuta `npm run dev` y comienza a probar las funcionalidades implementadas.

Para continuar con las siguientes tareas, consulta el archivo `tasks.md` en `.kiro/specs/frontend-rebuild/`.
