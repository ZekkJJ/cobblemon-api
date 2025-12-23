# Documento de Requisitos - Frontend Cobblemon Los Pitufos (Reconstrucción)

## Introducción

Este documento define los requisitos para la reconstrucción completa del frontend de la plataforma web "Cobblemon Los Pitufos". El nuevo frontend será una aplicación Next.js 14 limpia que consumirá exclusivamente el backend API ubicado en `backend/`. 

**IMPORTANTE:** 
- El frontend será un proyecto COMPLETAMENTE NUEVO en una carpeta separada llamada `frontend/`
- NO usará funciones serverless de Next.js (no habrá carpeta `src/app/api/`)
- TODAS las llamadas irán al backend Express ubicado en `backend/`
- Será un deployment separado en Vercel usando Vercel CLI
- El backend maneja TODA la lógica: autenticación, gacha, tienda, sincronización con plugin de Minecraft, etc.

El objetivo es replicar EXACTAMENTE la funcionalidad y diseño del frontend actual, pero con código limpio, bien estructurado y usando el nuevo backend.

## Glosario

- **Frontend**: Aplicación Next.js 14 con App Router y TypeScript ubicada en carpeta `frontend/` (proyecto nuevo y separado)
- **Backend**: API REST en Node.js/Express ubicada en `backend/` que maneja TODA la lógica de negocio
- **API Client**: Módulo centralizado en el frontend para todas las llamadas HTTP al backend
- **Plugin de Minecraft**: Mod de Fabric/Forge que se comunica con el backend para sincronizar datos del juego
- **Jugador**: Usuario que juega en el servidor de Minecraft
- **Starter/Inicial**: Pokémon inicial único que cada jugador puede obtener una sola vez
- **Gacha**: Sistema de sorteo aleatorio para obtener el Pokémon inicial (lógica en backend)
- **Shiny**: Variante rara de un Pokémon con coloración especial (1% probabilidad)
- **Soul Driven**: Modo de gacha que usa IA para mapear personalidad a tipos de Pokémon (lógica en backend)
- **CobbleDollars**: Moneda virtual del servidor de Minecraft sincronizada por el plugin
- **UUID**: Identificador único de jugador de Minecraft
- **Discord ID**: Identificador único de usuario de Discord
- **Sincronización**: El plugin de Minecraft envía datos al backend (equipo, PC, balance) mediante POST `/api/players/sync`

## Requisitos

### Requisito 1: Arquitectura del Frontend

**Historia de Usuario:** Como desarrollador, quiero un frontend limpio y bien estructurado, para que sea fácil de mantener y extender.

#### Criterios de Aceptación

1. THE Frontend SHALL ser una aplicación Next.js 14 con App Router y TypeScript ubicada en carpeta `frontend/` (proyecto completamente nuevo)
2. THE Frontend SHALL usar Tailwind CSS para estilos, replicando exactamente el diseño actual
3. THE Frontend SHALL implementar un API client centralizado en `src/lib/api-client.ts` para todas las llamadas al backend
4. THE Frontend SHALL usar variables de entorno para configurar la URL del backend (`NEXT_PUBLIC_API_URL`)
5. THE Frontend SHALL NO incluir lógica de negocio - toda la lógica debe estar en el backend
6. THE Frontend SHALL NO tener carpeta `src/app/api/` - no usará funciones serverless de Next.js
7. THE Frontend SHALL ser deployable en Vercel como proyecto separado usando Vercel CLI

### Requisito 2: Sistema de Autenticación

**Historia de Usuario:** Como jugador, quiero iniciar sesión con mi cuenta de Discord, para que mi progreso esté vinculado a mi identidad.

#### Criterios de Aceptación

1. WHEN un usuario hace clic en "Iniciar con Discord" THEN THE Frontend SHALL redirigir al endpoint `/api/auth/discord` del backend
2. WHEN el backend redirige de vuelta con el callback THEN THE Frontend SHALL manejar el callback en `/auth/callback` y guardar los datos del usuario en localStorage
3. THE Frontend SHALL mostrar el nombre de usuario y avatar del usuario autenticado en el navbar
4. WHEN un usuario cierra sesión THEN THE Frontend SHALL limpiar localStorage y recargar la página
5. THE Frontend SHALL soportar autenticación alternativa por nombre de usuario (sin OAuth) llamando a `/api/auth/verify-username`

### Requisito 3: Página Principal - Sistema Gacha

**Historia de Usuario:** Como jugador, quiero obtener mi Pokémon inicial mediante el sistema gacha, para que tenga un compañero exclusivo.

#### Criterios de Aceptación

1. THE Frontend SHALL mostrar una máquina gacha estilizada con diseño retro de Pokémon
2. WHEN un usuario no autenticado visita la página THEN THE Frontend SHALL mostrar opciones de inicio de sesión (Discord OAuth y nombre de usuario)
3. WHEN un usuario autenticado no ha hecho su tirada THEN THE Frontend SHALL mostrar el botón "INVOCAR" habilitado
4. WHEN un usuario hace clic en "INVOCAR" en modo clásico THEN THE Frontend SHALL llamar a POST `/api/gacha/roll` y mostrar animación de tirada
5. WHEN un usuario selecciona modo "Soul Driven" THEN THE Frontend SHALL mostrar un cuestionario de 5 preguntas
6. WHEN un usuario completa el cuestionario Soul Driven THEN THE Frontend SHALL llamar a POST `/api/gacha/soul-driven` con las respuestas
7. WHEN la tirada es exitosa THEN THE Frontend SHALL mostrar el starter obtenido con animación flash, reproducir el cry del Pokémon y mostrar la tarjeta completa del starter
8. WHEN un usuario ya ha hecho su tirada THEN THE Frontend SHALL mostrar su starter obtenido y deshabilitar el botón de tirada
9. THE Frontend SHALL mostrar un contador de starters reclamados vs disponibles
10. THE Frontend SHALL mostrar una sección de verificación de Minecraft donde el usuario puede ingresar un código de 5 dígitos

### Requisito 4: Componente de Navbar

**Historia de Usuario:** Como jugador, quiero navegar fácilmente entre las secciones de la plataforma, para que pueda acceder a todas las funcionalidades.

#### Criterios de Aceptación

1. THE Frontend SHALL mostrar un navbar sticky en la parte superior con logo, enlaces de navegación y acciones de usuario
2. THE Frontend SHALL incluir enlaces a: Gacha, Tienda, Servidor, Pokédex, Jugadores, Galería, Comparador, Torneos
3. THE Frontend SHALL mostrar el estado del servidor (online/offline) con indicador visual en el navbar
4. THE Frontend SHALL incluir un toggle para silenciar/activar efectos de sonido
5. WHEN un usuario está autenticado THEN THE Frontend SHALL mostrar su avatar y nombre con opción de cerrar sesión
6. WHEN un usuario no está autenticado THEN THE Frontend SHALL mostrar botón "Login con Discord"
7. THE Frontend SHALL ser responsive con menú hamburguesa en móviles

### Requisito 5: Página de Tienda

**Historia de Usuario:** Como jugador, quiero comprar Pokéballs con mis CobbleDollars, para que pueda capturar más Pokémon.

#### Criterios de Aceptación

1. THE Frontend SHALL mostrar el balance de CobbleDollars del usuario obtenido de GET `/api/shop/balance?uuid=X`
2. THE Frontend SHALL obtener el UUID del jugador desde los datos de usuario (el backend vincula Discord ID con Minecraft UUID cuando el jugador se verifica)
3. THE Frontend SHALL mostrar el catálogo de Pokéballs disponibles obtenido de GET `/api/shop/stock`
4. THE Frontend SHALL permitir seleccionar cantidad de cada Pokéball con controles +/- y input numérico
5. WHEN un usuario hace clic en "COMPRAR" THEN THE Frontend SHALL llamar a POST `/api/shop/purchase` con uuid, itemId y quantity
6. THE Frontend SHALL mostrar el precio dinámico de cada Pokéball basado en el stock (precios más altos cuando hay menos stock)
7. THE Frontend SHALL mostrar indicadores visuales de stock: verde (>50%), amarillo (25-50%), naranja (10-25%), rojo (<10%), gris (agotado)
8. THE Frontend SHALL deshabilitar el botón de compra si el usuario no tiene suficiente balance o si no hay stock
9. THE Frontend SHALL actualizar el balance y stock después de cada compra exitosa
10. THE Frontend SHALL mostrar un contador de tiempo hasta la próxima actualización de stock (cada hora)
11. THE Frontend SHALL incluir filtros de búsqueda por nombre y tipo de Pokéball
12. THE Frontend SHALL mostrar un mensaje si el usuario no tiene UUID de Minecraft vinculado (no se ha verificado en el juego)

### Requisito 6: Página de Jugadores

**Historia de Usuario:** Como jugador, quiero ver la lista de todos los jugadores del servidor, para que pueda comparar equipos y progreso.

#### Criterios de Aceptación

1. THE Frontend SHALL obtener la lista de jugadores de GET `/api/players`
2. THE Frontend SHALL mostrar cada jugador en una tarjeta con: nombre, cantidad de Pokémon, cantidad de shinies, starter del gacha y preview del equipo (máximo 6 Pokémon)
3. THE Frontend SHALL permitir buscar jugadores por nombre con un input de búsqueda
4. THE Frontend SHALL permitir ordenar jugadores por: nombre, cantidad de Pokémon o cantidad de shinies
5. WHEN un usuario hace clic en una tarjeta de jugador THEN THE Frontend SHALL navegar a `/jugadores/[uuid]`
6. THE Frontend SHALL mostrar estadísticas globales en el footer: total de jugadores, total de Pokémon y total de shinies
7. THE Frontend SHALL mostrar sprites animados de los Pokémon en el preview del equipo
8. THE Frontend SHALL indicar visualmente los Pokémon shiny con un icono de estrella ✨

### Requisito 7: Página de Perfil de Jugador

**Historia de Usuario:** Como jugador, quiero ver el perfil detallado de un jugador, para que pueda ver su equipo completo y estadísticas.

#### Criterios de Aceptación

1. THE Frontend SHALL obtener los datos del jugador de GET `/api/players/:uuid`
2. THE Frontend SHALL mostrar el equipo completo del jugador (party) con estadísticas detalladas de cada Pokémon
3. THE Frontend SHALL mostrar las primeras 2 cajas del PC storage del jugador
4. THE Frontend SHALL mostrar el starter del gacha del jugador si lo tiene, indicando si es shiny
5. THE Frontend SHALL mostrar estadísticas del jugador: balance de CobbleDollars, cantidad total de Pokémon, cantidad de shinies
6. THE Frontend SHALL mostrar cada Pokémon con: sprite, nombre, nivel, naturaleza, habilidad, IVs, EVs, movimientos, held item
7. THE Frontend SHALL usar tabs o secciones para organizar: Equipo, PC Storage, Estadísticas
8. THE Frontend SHALL mostrar sprites animados para Pokémon de Gen 1-5 y sprites estáticos de Showdown para Gen 6-9
9. THE Frontend SHALL explicar que los datos del equipo y PC son sincronizados automáticamente por el plugin de Minecraft cuando el jugador está en el servidor

### Requisito 8: Página de Galería de Starters

**Historia de Usuario:** Como jugador, quiero ver todos los starters que han sido reclamados, para que pueda ver qué Pokémon tienen otros jugadores.

#### Criterios de Aceptación

1. THE Frontend SHALL obtener todos los starters de GET `/api/gacha/starters`
2. THE Frontend SHALL filtrar y mostrar solo los starters que tienen `isClaimed: true`
3. THE Frontend SHALL mostrar cada starter reclamado con: sprite animado, nombre, tipos, nombre del dueño y fecha de reclamo
4. THE Frontend SHALL indicar visualmente los starters shiny con borde dorado y estrella ✨
5. THE Frontend SHALL mostrar estadísticas: total reclamados, disponibles y barra de progreso visual
6. WHEN un usuario hace clic en un starter THEN THE Frontend SHALL mostrar un modal con la tarjeta detallada del starter
7. THE Frontend SHALL mostrar el nombre del dueño como badge en el modal

### Requisito 9: Página de Torneos

**Historia de Usuario:** Como jugador, quiero ver los torneos disponibles, para que pueda participar en competencias.

#### Criterios de Aceptación

1. THE Frontend SHALL obtener los torneos de GET `/api/tournaments`
2. THE Frontend SHALL organizar los torneos en 3 secciones: "En Curso" (status: active), "Próximamente" (status: upcoming) y "Historial" (status: completed)
3. THE Frontend SHALL mostrar cada torneo con: título, descripción, fecha de inicio, participantes actuales vs máximos y premios
4. THE Frontend SHALL mostrar un indicador visual pulsante para torneos activos
5. THE Frontend SHALL aplicar efecto grayscale a torneos completados
6. THE Frontend SHALL mostrar un mensaje si no hay torneos programados

### Requisito 10: Página de Información del Servidor

**Historia de Usuario:** Como jugador, quiero ver el estado del servidor y cómo conectarme, para que pueda unirme a jugar.

#### Criterios de Aceptación

1. THE Frontend SHALL obtener el estado del servidor de GET `/api/server-status`
2. THE Frontend SHALL mostrar: estado (online/offline), jugadores conectados vs máximo, versión del servidor y lista de jugadores conectados
3. THE Frontend SHALL mostrar la IP del servidor con un botón para copiar al portapapeles
4. THE Frontend SHALL actualizar el estado del servidor cada 30 segundos automáticamente
5. THE Frontend SHALL mostrar una barra de progreso visual de la capacidad del servidor
6. THE Frontend SHALL mostrar efectos visuales de glow verde cuando el servidor está online y rojo cuando está offline
7. THE Frontend SHALL mostrar instrucciones de conexión, información del modpack y reglas del servidor

### Requisito 11: Componentes Reutilizables

**Historia de Usuario:** Como desarrollador, quiero componentes reutilizables bien diseñados, para que el código sea mantenible.

#### Criterios de Aceptación

1. THE Frontend SHALL implementar un componente `StarterCard` que muestre la información completa de un starter con diseño de tarjeta de Pokémon
2. THE Frontend SHALL implementar un componente `SoulDrivenQuestionnaire` que muestre el cuestionario de 5 preguntas con opciones múltiples
3. THE Frontend SHALL implementar un componente `TournamentTicker` que muestre un ticker animado con información de torneos activos
4. THE Frontend SHALL implementar un componente `ServerIndicator` que muestre el estado del servidor de forma compacta
5. THE Frontend SHALL implementar un componente `MusicPlayer` que reproduzca música de fondo con visualizador de audio y controles de volumen
6. THE Frontend SHALL implementar un componente `Navbar` centralizado usado en todas las páginas

### Requisito 12: Sistema de Sonidos

**Historia de Usuario:** Como jugador, quiero efectos de sonido opcionales, para que la experiencia sea más inmersiva.

#### Criterios de Aceptación

1. THE Frontend SHALL implementar una librería de sonidos en `src/lib/sounds.ts` con funciones para reproducir: click, confirm, cancel, roll
2. THE Frontend SHALL reproducir sonidos en interacciones clave: clicks en botones, confirmaciones, tiradas gacha
3. THE Frontend SHALL incluir un toggle en el navbar para silenciar/activar efectos de sonido
4. THE Frontend SHALL guardar la preferencia de sonido en localStorage
5. THE Frontend SHALL reproducir el cry del Pokémon cuando se obtiene un starter en el gacha

### Requisito 13: Diseño y Estilos

**Historia de Usuario:** Como jugador, quiero una interfaz atractiva y fácil de usar, para que disfrute usando la plataforma.

#### Criterios de Aceptación

1. THE Frontend SHALL usar un diseño responsive que funcione correctamente en móviles (320px+) y escritorio (1024px+)
2. THE Frontend SHALL usar tema oscuro con gradientes y efectos de glass morphism
3. THE Frontend SHALL usar colores Pokémon: rojo (#EF4444) para acciones principales, azul (#3B82F6) para información, amarillo (#EAB308) para shinies, púrpura (#A855F7) para Soul Driven
4. THE Frontend SHALL mostrar animaciones suaves en transiciones de página y acciones importantes (tirada gacha, compra exitosa)
5. THE Frontend SHALL mostrar sprites animados de Pokémon (GIF de PokeAPI para Gen 1-5, sprites de Showdown para Gen 6-9)
6. THE Frontend SHALL estar completamente en español: textos, mensajes de error, fechas formateadas
7. THE Frontend SHALL usar la fuente "pixel-font" para títulos y elementos retro
8. THE Frontend SHALL incluir efectos hover, scale y glow en elementos interactivos

### Requisito 14: Manejo de Errores y Estados de Carga

**Historia de Usuario:** Como jugador, quiero feedback claro cuando algo está cargando o falla, para que sepa qué está pasando.

#### Criterios de Aceptación

1. THE Frontend SHALL mostrar spinners de carga durante operaciones asíncronas (fetch de datos, compras, tiradas)
2. THE Frontend SHALL mostrar mensajes de error amigables cuando las llamadas al backend fallan
3. THE Frontend SHALL mostrar estados vacíos informativos cuando no hay datos (ej: "No hay jugadores", "No hay torneos")
4. THE Frontend SHALL deshabilitar botones durante operaciones en progreso para prevenir doble-submit
5. THE Frontend SHALL mostrar mensajes de éxito después de operaciones exitosas (compra, verificación)

### Requisito 15: Integración con Backend

**Historia de Usuario:** Como sistema, quiero que el frontend se comunique correctamente con el backend, para que todas las funcionalidades trabajen juntas.

#### Criterios de Aceptación

1. THE Frontend SHALL implementar un API client en `src/lib/api-client.ts` que centralice todas las llamadas HTTP
2. THE Frontend SHALL usar la variable de entorno `NEXT_PUBLIC_API_URL` para configurar la URL base del backend
3. THE Frontend SHALL incluir manejo de errores centralizado en el API client
4. THE Frontend SHALL enviar headers apropiados en todas las requests (Content-Type: application/json)
5. THE Frontend SHALL manejar respuestas del backend en formato JSON
6. THE Frontend SHALL implementar funciones específicas para cada endpoint del backend: gachaAPI, shopAPI, playersAPI, tournamentsAPI, startersAPI, authAPI

### Requisito 16: Páginas Adicionales

**Historia de Usuario:** Como jugador, quiero acceder a funcionalidades adicionales, para que pueda aprovechar todas las características de la plataforma.

#### Criterios de Aceptación

1. THE Frontend SHALL implementar una página `/pokedex` que muestre información de todos los Pokémon disponibles en Cobblemon
2. THE Frontend SHALL implementar una página `/comparador` que permita comparar estadísticas de dos Pokémon lado a lado
3. THE Frontend SHALL implementar una página `/verificar` dedicada a la verificación de Minecraft con instrucciones claras
4. THE Frontend SHALL implementar páginas de administración en `/admin/*` para usuarios con rol de administrador (gestión de jugadores, torneos, level caps)

### Requisito 17: Optimización y Performance

**Historia de Usuario:** Como jugador, quiero que la aplicación cargue rápido, para que pueda usarla sin esperas.

#### Criterios de Aceptación

1. THE Frontend SHALL usar Next.js Image component para optimizar imágenes
2. THE Frontend SHALL implementar lazy loading para sprites de Pokémon
3. THE Frontend SHALL cachear datos estáticos en el cliente cuando sea apropiado
4. THE Frontend SHALL minimizar re-renders innecesarios usando React.memo y useMemo donde sea apropiado
5. THE Frontend SHALL usar loading="lazy" en imágenes de Pokémon

### Requisito 18: Configuración y Deployment

**Historia de Usuario:** Como desarrollador, quiero que el frontend sea fácil de deployar, para que pueda ponerlo en producción rápidamente.

#### Criterios de Aceptación

1. THE Frontend SHALL incluir un archivo `.env.example` con todas las variables de entorno necesarias
2. THE Frontend SHALL incluir un `README.md` con instrucciones de instalación y desarrollo
3. THE Frontend SHALL ser deployable en Vercel con configuración mínima
4. THE Frontend SHALL soportar build para producción con `npm run build`
5. THE Frontend SHALL incluir scripts en `package.json` para: dev, build, start, lint
