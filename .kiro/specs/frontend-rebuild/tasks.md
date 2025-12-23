# Plan de Implementación - Frontend Cobblemon Los Pitufos

## Fase 1: Setup del Proyecto

- [x] 1. Crear proyecto Next.js 14


  - Crear carpeta `frontend/` en la raíz del repositorio
  - Ejecutar `npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir`
  - Configurar opciones: TypeScript ✓, ESLint ✓, Tailwind CSS ✓, App Router ✓
  - _Requisitos: 1.1, 1.2_

- [x] 2. Configurar estructura de carpetas


  - Crear carpeta `src/` con subcarpetas: `app/`, `components/`, `lib/`
  - Mover `app/` existente a `src/app/`
  - Crear `src/components/` y `src/lib/`
  - Crear `src/lib/types/` para interfaces TypeScript
  - _Requisitos: 1.1_

- [x] 3. Configurar variables de entorno


  - Crear `.env.example` con `NEXT_PUBLIC_API_URL=http://localhost:4000`
  - Crear `.env.local` con la URL del backend local
  - Agregar `.env.local` a `.gitignore`
  - _Requisitos: 1.4_

- [x] 4. Configurar Tailwind CSS


  - Actualizar `tailwind.config.ts` con colores personalizados (rojo, azul, amarillo, púrpura)
  - Agregar clases custom para glass morphism, glow effects
  - Agregar animaciones custom (shake, flash, shimmer)
  - _Requisitos: 13.2, 13.3, 13.4_



- [x] 5. Agregar fuentes y assets

  - Descargar fuente pixel para títulos retro
  - Crear carpeta `public/pokeballs/` y copiar sprites de pokéballs
  - Agregar `public/background-music.mp3` (Littleroot Town)
  - Configurar Font Awesome en layout

  - _Requisitos: 13.7_


- [x] 6. Configurar next.config.js


  - Agregar remote patterns para imágenes de PokeAPI y Discord CDN
  - Habilitar swcMinify y compress
  - NO agregar output: 'standalone' (no es necesario para Vercel)
  - _Requisitos: 18.3_



## Fase 2: API Client y Tipos




- [x] 7. Crear tipos TypeScript
  - Crear `src/lib/types/pokemon.ts` con interfaces: Pokemon, Starter, PlayerSummary
  - Crear `src/lib/types/shop.ts` con interface Ball
  - Crear `src/lib/types/tournament.ts` con interface Tournament
  - Crear `src/lib/types/user.ts` con interface LocalUser
  - _Requisitos: 1.1, 15.1_






- [x] 8. Implementar API Client base

  - Crear `src/lib/api-client.ts`
  - Implementar función `apiCall()` con manejo de errores

  - Configurar `API_BASE_URL` desde variable de entorno

  - Agregar headers apropiados (Content-Type: application/json)
  - _Requisitos: 15.1, 15.2, 15.3, 15.4_

- [x] 9. Implementar módulos del API Client

  - Implementar `authAPI`: getDiscordAuthUrl, handleCallback, verifyUsername
  - Implementar `gachaAPI`: getStatus, roll, soulDriven
  - Implementar `shopAPI`: getStock, getBalance, purchase, getPurchases, claimPurchase


  - Implementar `playersAPI`: getAll, getByUuid, getByDiscordId
  - Implementar `tournamentsAPI`: getAll, getById
  - Implementar `startersAPI`: getAll
  - Implementar `verificationAPI`: generate, verify



  - Implementar `serverAPI`: getStatus

  - _Requisitos: 15.6_

## Fase 3: Layout y Navegación

- [x] 10. Crear componente Providers

  - Crear `src/components/Providers.tsx`

  - Configurar context providers si es necesario



  - Envolver children
  - _Requisitos: 4.1_

- [x] 11. Implementar Navbar

  - Crear `src/components/Navbar.tsx`


  - Implementar logo y enlaces de navegación
  - Implementar estado de autenticación (leer de localStorage)

  - Implementar botón de login/logout

  - Implementar toggle de efectos de sonido
  - Implementar menú hamburguesa para móviles
  - Agregar ServerIndicator

  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 12. Crear componente ServerIndicator
  - Crear `src/components/ServerIndicator.tsx`
  - Mostrar estado online/offline con indicador visual
  - Mostrar cantidad de jugadores conectados
  - Actualizar cada 30 segundos
  - _Requisitos: 4.3_



- [x] 13. Configurar Layout principal

  - Actualizar `src/app/layout.tsx`
  - Agregar Navbar
  - Agregar Providers


  - Configurar metadata (título, descripción, favicon)
  - Agregar Font Awesome CDN
  - _Requisitos: 4.1_

- [x] 14. Crear estilos globales

  - Actualizar `src/app/globals.css`
  - Agregar clases custom: glass-dark, pixel-font, type-badge
  - Agregar animaciones: shake, flash, shimmer, fadeIn
  - Agregar estilos para botones y inputs


  - _Requisitos: 13.1, 13.2, 13.3, 13.4_

## Fase 4: Sistema de Sonidos

- [x] 15. Implementar librería de sonidos

  - Crear `src/lib/sounds.ts`
  - Implementar función `playSound(type)` con tipos: click, confirm, cancel, roll
  - Verificar preferencia de mute en localStorage
  - Agregar archivos de sonido en `public/sounds/`


  - _Requisitos: 12.1, 12.2, 12.4_

- [x] 16. Implementar MusicPlayer

  - Crear `src/components/MusicPlayer.tsx`
  - Implementar reproducción de música de fondo
  - Implementar visualizador de audio con Web Audio API y Canvas

  - Implementar controles de volumen y mute
  - Guardar preferencias en localStorage
  - Mostrar controles al hover
  - _Requisitos: 11.5, 12.3, 12.4_

## Fase 5: Página Principal - Gacha

- [x] 17. Crear componente StarterCard

  - Crear `src/components/StarterCard.tsx`
  - Mostrar sprite animado grande
  - Mostrar tipos con badges de colores
  - Mostrar stats en barras visuales
  - Mostrar habilidades y movimientos
  - Mostrar cadena evolutiva
  - Mostrar descripción
  - Indicar si es shiny con efectos visuales
  - _Requisitos: 11.1_

- [x] 18. Crear componente SoulDrivenQuestionnaire


  - Crear `src/components/SoulDrivenQuestionnaire.tsx`
  - Implementar 5 preguntas con opciones múltiples
  - Recopilar respuestas del usuario
  - Callback onSubmit con array de respuestas
  - Deshabilitar durante loading
  - _Requisitos: 11.2_

- [x] 19. Implementar página principal (Gacha)

  - Crear `src/app/page.tsx`
  - Implementar máquina gacha estilizada
  - Implementar sección de autenticación (Discord OAuth y username)
  - Implementar toggle entre modo clásico y Soul Driven
  - Implementar botón "INVOCAR" con estados

  - Implementar animación de tirada (shake, flash)

  - Implementar mostrar resultado con StarterCard
  - Implementar reproducir cry del Pokémon
  - Implementar contador de starters disponibles
  - Implementar sección de verificación de Minecraft
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_



- [x] 20. Implementar autenticación Discord OAuth



  - Implementar botón "Iniciar con Discord"
  - Redirigir a backend `/api/auth/discord`
  - Crear página `/auth/callback` para manejar callback
  - Guardar usuario en localStorage
  - Recargar página después de autenticación



  - _Requisitos: 2.1, 2.2_

- [x] 21. Implementar autenticación por username
  - Implementar formulario con inputs: discordUsername, nickname
  - Llamar a `authAPI.verifyUsername()`
  - Guardar usuario en localStorage
  - Mostrar errores de validación
  - _Requisitos: 2.5_

- [x] 22. Implementar verificación de Minecraft
  - Implementar input de código de 5 dígitos
  - Llamar a `verificationAPI.verify()`
  - Mostrar mensaje de éxito/error
  - Actualizar estado del usuario
  - _Requisitos: 3.10_

## Fase 6: Página de Tienda

- [x] 23. Implementar página de Tienda

  - Crear `src/app/tienda/page.tsx`


  - Cargar stock con `shopAPI.getStock()`
  - Cargar balance con `shopAPI.getBalance(uuid)`
  - Mostrar catálogo de Pokéballs en grid
  - Mostrar balance de CobbleDollars
  - Mostrar contador de tiempo hasta próxima actualización
  - _Requisitos: 5.1, 5.2, 5.9_




- [x] 24. Implementar tarjetas de Pokéball
  - Mostrar sprite, nombre, descripción
  - Mostrar precio dinámico y stock
  - Mostrar indicadores de stock con colores
  - Mostrar multiplicador de precio

  - Implementar controles de cantidad (+/-, input, MAX)
  - Implementar botón de compra con estados
  - _Requisitos: 5.5, 5.6, 5.7, 5.8_

- [x] 25. Implementar funcionalidad de compra
  - Validar balance suficiente
  - Validar stock disponible

  - Llamar a `shopAPI.purchase()`
  - Actualizar balance y stock después de compra
  - Mostrar mensaje de éxito/error
  - _Requisitos: 5.3, 5.4, 5.8_

- [x] 26. Implementar filtros y búsqueda
  - Implementar input de búsqueda por nombre

  - Implementar select de filtro por tipo
  - Filtrar Pokéballs en tiempo real
  - _Requisitos: 5.11_
  - _Nota: Ya implementado en Task 23_


## Fase 7: Páginas de Jugadores

- [x] 27. Implementar página de lista de jugadores


  - Crear `src/app/jugadores/page.tsx`

  - Cargar jugadores con `playersAPI.getAll()`
  - Mostrar tarjetas de jugadores en grid
  - Mostrar: nombre, total Pokémon, shinies, starter, preview equipo
  - Implementar estados de loading y error
  - _Requisitos: 6.1, 6.2_

- [x] 28. Implementar búsqueda y ordenamiento

  - Implementar input de búsqueda por nombre

  - Implementar botones de ordenamiento (nombre, Pokémon, shinies)
  - Filtrar y ordenar jugadores en tiempo real
  - _Requisitos: 6.3, 6.4_

- [x] 29. Implementar estadísticas globales

  - Mostrar footer con stats: total jugadores, total Pokémon, total shinies
  - Calcular stats desde la lista de jugadores
  - _Requisitos: 6.6_

- [x] 30. Implementar tarjetas de jugador

  - Mostrar avatar con inicial del nombre
  - Mostrar badge de starter del gacha
  - Mostrar preview del equipo (máximo 6 Pokémon)
  - Mostrar sprites animados
  - Indicar Pokémon shiny con estrella
  - Link a perfil del jugador
  - _Requisitos: 6.2, 6.7, 6.8_

- [x] 31. Implementar página de perfil de jugador

  - Crear `src/app/jugadores/[uuid]/page.tsx`
  - Cargar perfil con `playersAPI.getByUuid(uuid)`
  - Mostrar header con nombre y stats generales
  - Implementar tabs: Equipo, PC, Estadísticas
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_

- [x] 32. Implementar sección de Equipo

  - Mostrar 6 Pokémon del party
  - Mostrar cada Pokémon con: sprite, nombre, nivel, naturaleza, habilidad
  - Mostrar IVs y EVs en barras visuales
  - Mostrar movimientos y held item
  - Indicar Pokémon shiny
  - _Requisitos: 7.2, 7.6, 7.8_


- [] 33. Implementar sección de PC Storage
  - Mostrar primeras 2 cajas (60 Pokémon)
  - Mostrar grid de sprites
  - Mostrar nivel y shiny indicator
  - Tooltip con nombre al hover
  - _Requisitos: 7.3, 7.6, 7.8_


- [X] 34. Implementar sección de Estadísticas
  - Mostrar balance de CobbleDollars
  - Mostrar total de Pokémon
  - Mostrar cantidad de shinies
  - Mostrar starter del gacha
  - _Requisitos: 7.4, 7.5_


## Fase 8: Galería y Torneos


- [X] 35. Implementar página de Galería
  - Crear `src/app/galeria/page.tsx`
  - Cargar starters con `startersAPI.getAll()`
  - Filtrar solo starters reclamados
  - Mostrar tarjetas de starters en grid
  - Mostrar: sprite, nombre, tipos, dueño, fecha
  - Indicar shinies con efectos visuales
  - _Requisitos: 8.1, 8.2, 8.3_


- [X] 36. Implementar estadísticas de galería
  - Mostrar total reclamados vs disponibles
  - Mostrar barra de progreso visual
  - Calcular porcentaje de progreso


  - _Requisitos: 8.5_

- [x] 37. Implementar modal de detalle de starter


  - Mostrar StarterCard completa al hacer clic
  - Mostrar badge con nombre del dueño
  - Botón para cerrar modal
  - _Requisitos: 8.6, 8.7_



- [x] 38. Implementar página de Torneos


  - Crear `src/app/torneos/page.tsx`
  - Cargar torneos con `tournamentsAPI.getAll()`
  - Organizar en 3 secciones: En Curso, Próximamente, Historial

  - Mostrar tarjetas de torneos
  - _Requisitos: 9.1, 9.2, 9.3_

- [x] 39. Implementar tarjetas de torneo

  - Mostrar: título, descripción, fecha, participantes, premios
  - Indicador pulsante para torneos activos

  - Efecto grayscale para torneos completados
  - Badges de estado con colores
  - _Requisitos: 9.3, 9.4, 9.5_

- [x] 40. Implementar estado vacío de torneos

  - Mostrar mensaje si no hay torneos


  - Diseño amigable con icono
  - _Requisitos: 9.6_

## Fase 9: Servidor y Componentes Adicionales

- [x] 41. Implementar componente ServerStatus

  - Crear `src/components/ServerStatus.tsx`
  - Cargar estado con `serverAPI.getStatus()`
  - Mostrar: estado, jugadores online/max, versión


  - Mostrar lista de jugadores conectados
  - Mostrar IP copiable al portapapeles
  - Actualizar cada 30 segundos
  - Efectos visuales de glow (verde/rojo)
  - Barra de progreso de capacidad
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_



- [x] 42. Implementar página de Servidor

  - Crear `src/app/servidor/page.tsx`
  - Incluir componente ServerStatus
  - Mostrar instrucciones de conexión
  - Mostrar información del modpack
  - Mostrar reglas del servidor
  - _Requisitos: 10.7_



- [x] 43. Implementar componente TournamentTicker

  - Crear `src/components/TournamentTicker.tsx`
  - Cargar torneos activos
  - Implementar scroll horizontal automático
  - Mostrar información resumida


  - Animación suave
  - _Requisitos: 11.3_

## Fase 10: Páginas Adicionales

- [x] 44. Implementar página de Pokédex


  - Crear `src/app/pokedex/page.tsx`
  - Mostrar lista de todos los Pokémon de Cobblemon
  - Implementar búsqueda y filtros por tipo/generación
  - Mostrar tarjetas con sprite, nombre, tipos, stats
  - Modal con información detallada
  - _Requisitos: 16.1_

- [x] 45. Implementar página de Comparador


  - Crear `src/app/comparador/page.tsx`
  - Implementar selección de 2 Pokémon
  - Mostrar stats lado a lado
  - Comparación visual con barras
  - Mostrar ventajas/desventajas de tipos
  - _Requisitos: 16.2_

- [x] 46. Implementar página de Verificación


  - Crear `src/app/verificar/page.tsx`
  - Mostrar instrucciones claras de verificación
  - Implementar input de código de 5 dígitos
  - Llamar a `verificationAPI.verify()`
  - Mostrar pasos numerados
  - _Requisitos: 16.3_

## Fase 11: Panel de Administración

- [ ] 47. Crear layout de admin
  - Crear `src/app/admin/layout.tsx`
  - Verificar rol de administrador
  - Redirigir si no es admin
  - Sidebar con enlaces a secciones
  - _Requisitos: 16.4_

- [ ] 48. Implementar página principal de admin
  - Crear `src/app/admin/page.tsx`
  - Mostrar dashboard con estadísticas
  - Enlaces rápidos a secciones
  - _Requisitos: 16.4_

- [ ] 49. Implementar gestión de jugadores
  - Crear `src/app/admin/players/page.tsx`
  - Listar todos los jugadores
  - Implementar búsqueda
  - Botones para banear/desbanear
  - Modal para ingresar razón de ban
  - _Requisitos: 16.4_




- [ ] 50. Implementar gestión de torneos
  - Crear `src/app/admin/tournaments/page.tsx`
  - Listar todos los torneos
  - Formulario para crear torneo
  - Botones para editar/eliminar
  - _Requisitos: 16.4_

- [ ] 51. Implementar gestión de level caps
  - Crear `src/app/admin/level-caps/page.tsx`
  - Mostrar configuración actual
  - Formulario para editar caps
  - Historial de cambios
  - _Requisitos: 16.4_

## Fase 12: Optimización y Pulido

- [x] 52. Implementar lazy loading de imágenes


  - Agregar loading="lazy" a todas las imágenes de Pokémon
  - Usar Next.js Image component donde sea apropiado
  - Implementar placeholders
  - _Requisitos: 17.1, 17.2, 17.5_

- [x] 53. Optimizar re-renders

  - Agregar React.memo a componentes pesados
  - Usar useMemo para cálculos costosos
  - Usar useCallback para funciones
  - _Requisitos: 17.4_

- [x] 54. Implementar caching

  - Cachear datos estáticos en localStorage
  - Implementar timestamps de última actualización
  - Revalidar datos cuando sea necesario
  - _Requisitos: 17.3_

- [x] 55. Agregar animaciones y transiciones

  - Implementar transiciones suaves entre páginas
  - Agregar animaciones de entrada para listas
  - Agregar efectos hover en elementos interactivos
  - Pulir animación de tirada gacha
  - _Requisitos: 13.4, 13.8_

- [x] 56. Mejorar manejo de errores

  - Implementar mensajes de error amigables
  - Agregar estados de error en todas las páginas
  - Implementar retry buttons
  - Agregar error boundaries
  - _Requisitos: 14.2, 14.3_

- [x] 57. Mejorar estados de carga

  - Implementar spinners consistentes
  - Agregar skeleton loaders
  - Deshabilitar botones durante operaciones
  - Agregar feedback visual
  - _Requisitos: 14.1, 14.4_

- [x] 58. Implementar mensajes de éxito

  - Agregar toasts o alerts para operaciones exitosas
  - Feedback visual después de compras
  - Feedback después de verificación
  - _Requisitos: 14.5_

## Fase 13: Testing y Deployment

- [ ] 59. Configurar testing
  - Instalar Vitest y React Testing Library
  - Configurar vitest.config.ts
  - Crear carpeta `__tests__/`
  - _Requisitos: Testing_

- [ ] 60. Escribir tests del API Client
  - Test: construye URLs correctamente
  - Test: maneja errores HTTP
  - Test: envía headers apropiados
  - Test: parsea respuestas JSON
  - _Requisitos: Testing_

- [ ] 61. Escribir tests de componentes
  - Test: StarterCard renderiza correctamente
  - Test: Navbar muestra/oculta elementos según auth
  - Test: SoulDrivenQuestionnaire recopila respuestas
  - Test: ServerIndicator muestra estado correcto
  - _Requisitos: Testing_

- [x] 62. Crear documentación


  - Crear README.md con instrucciones de instalación
  - Documentar variables de entorno
  - Documentar scripts de npm
  - Agregar guía de desarrollo
  - _Requisitos: 18.2_

- [x] 63. Preparar para deployment


  - Verificar que build funciona: `npm run build`
  - Verificar que no hay errores de TypeScript
  - Verificar que no hay warnings de ESLint
  - Optimizar bundle size
  - _Requisitos: 18.4, 18.5_

- [x] 64. Configurar Vercel

  - Instalar Vercel CLI: `npm i -g vercel`
  - Login: `vercel login`
  - Configurar proyecto: `vercel`
  - Configurar variables de entorno en dashboard
  - _Requisitos: 18.3_

- [x] 65. Deploy a producción

  - Deploy: `vercel --prod`
  - Verificar que funciona en producción
  - Probar todas las funcionalidades
  - Verificar que se conecta correctamente al backend
  - _Requisitos: 18.3_

## Checkpoint Final

- [x] 66. Verificación completa


  - Probar flujo completo de gacha (clásico y Soul Driven)
  - Probar flujo completo de compra en tienda
  - Probar navegación entre todas las páginas
  - Probar en móvil y desktop
  - Probar en diferentes navegadores
  - Verificar que todos los sonidos funcionan
  - Verificar que la música funciona
  - Verificar que todas las imágenes cargan
  - Verificar que no hay errores en consola
