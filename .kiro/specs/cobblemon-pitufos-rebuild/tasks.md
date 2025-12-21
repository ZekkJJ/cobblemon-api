# Plan de Implementación - Cobblemon Los Pitufos (Reconstrucción)

## Estado Actual
El proyecto actualmente es una aplicación monolítica Next.js con API routes. El diseño requiere separar en:
- `/backend` - API Express.js con TypeScript
- `/frontend` - Aplicación Next.js 14 con App Router

---

- [x] 1. Configuración del Proyecto Backend


  - [x] 1.1 Crear estructura de carpetas del backend


    - Crear `/backend` con estructura: `src/config`, `src/modules`, `src/shared`, `tests`
    - Configurar `package.json` con Express, TypeScript, MongoDB driver
    - Configurar `tsconfig.json` para el backend
    - _Requisitos: 1.1, 1.2_
  - [x] 1.2 Implementar configuración de base de datos y entorno

    - Crear `src/config/database.ts` para conexión MongoDB
    - Crear `src/config/env.ts` para variables de entorno
    - Crear `.env.example` con todas las variables necesarias
    - _Requisitos: 1.4_
  - [x] 1.3 Implementar middleware compartido


    - Crear `src/shared/middleware/error-handler.ts`
    - Crear `src/shared/middleware/ip-whitelist.ts`
    - Crear `src/shared/utils/rate-limiter.ts`
    - _Requisitos: 12.2, 12.6, 14.3_
  - [x] 1.4 Escribir tests unitarios para middleware


    - Tests para error-handler
    - Tests para rate-limiter
    - _Requisitos: 14.3, 14.5_

- [x] 2. Tipos y Datos Compartidos



  - [x] 2.1 Migrar y extender tipos TypeScript


    - Crear `src/shared/types/user.types.ts` con interface User completa
    - Crear `src/shared/types/pokemon.types.ts` con Pokemon, PokemonStats, PokemonMove
    - Crear `src/shared/types/shop.types.ts` con ShopStock, ShopPurchase
    - Crear `src/shared/types/tournament.types.ts`
    - _Requisitos: 15.1, 15.2_


  - [x] 2.2 Implementar funciones de serialización/deserialización

    - Crear `src/shared/utils/serialization.ts` con serializePokemon, deserializePokemon


    - Implementar validación de esquemas con Zod


    - _Requisitos: 15.1, 15.2, 15.3_

  - [x] 2.3 Escribir property test para serialización round-trip


    - **Propiedad 37: Round-Trip de Serialización de Pokémon**
    - **Valida: Requisitos 15.1, 15.3**
  - [x] 2.4 Migrar datos estáticos

    - Crear `src/shared/data/starters.data.ts` con STARTERS_DATA
    - Crear `src/shared/data/pokeballs.data.ts` con POKEBALLS
    - _Requisitos: 14.4_

- [x] 3. Módulo de Autenticación
  - [x] 3.1 Implementar servicio de autenticación Discord OAuth
    - Crear `src/modules/auth/auth.service.ts`
    - Crear `src/modules/auth/auth.controller.ts`
    - Crear `src/modules/auth/auth.routes.ts`
    - Implementar endpoints: GET /api/auth/discord, GET /api/auth/discord/callback, POST /api/auth/logout, GET /api/auth/me
    - _Requisitos: 2.1, 2.3, 2.4, 2.5_
  - [x] 3.2 Implementar middleware de autenticación
    - Crear `src/modules/auth/auth.middleware.ts` para proteger rutas
    - Implementar validación de JWT
    - _Requisitos: 2.2_
  - [x] 3.3 Escribir property test para protección de rutas
    - **Propiedad 4: Protección de Rutas Autenticadas**
    - **Valida: Requisitos 2.2**
  - [x] 3.4 Escribir property test para creación/actualización de usuario
    - **Propiedad 3: Creación/Actualización de Usuario en Login**
    - **Valida: Requisitos 2.1**

- [x] 4. Checkpoint - Verificar tests de autenticación

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Módulo de Jugadores

  - [x] 5.1 Implementar servicio de jugadores


    - Crear `src/modules/players/players.service.ts`
    - Crear `src/modules/players/players.controller.ts`
    - Crear `src/modules/players/players.schema.ts` con validación Zod
    - Crear `src/modules/players/players.routes.ts`
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 5.2 Implementar endpoints de sincronización con plugin


    - POST /api/players/sync - Sincronizar datos desde plugin
    - GET /api/players/starter?uuid=X - Verificar starter pendiente
    - POST /api/players/starter-given - Marcar starter como entregado
    - GET /api/players/verification-status?uuid=X - Estado de verificación
    - GET /api/players/ban-status?uuid=X - Estado de ban
    - _Requisitos: 12.1, 12.3, 12.4, 12.5_
  - [ ] 5.3 Escribir property test para sincronización
    - **Propiedad 25: Actualización por Sincronización**
    - **Valida: Requisitos 6.5, 12.1**
  - [ ] 5.4 Escribir property test para validación de entrada
    - **Propiedad 35: Validación de Entrada**
    - **Valida: Requisitos 14.1**
  - [ ] 5.5 Escribir property test para rechazo de datos malformados
    - **Propiedad 39: Rechazo de Datos Malformados**
    - **Valida: Requisitos 15.4**




- [x] 6. Módulo Gacha
  - [x] 6.1 Implementar servicio gacha

    - Crear `src/modules/gacha/gacha.service.ts`

    - Crear `src/modules/gacha/gacha.controller.ts`
    - Crear `src/modules/gacha/gacha.routes.ts`
    - Implementar lógica de selección aleatoria con rollback

    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Implementar endpoint Soul Driven
    - POST /api/gacha/soul-driven con cuestionario de personalidad
    - Integración con Groq API para análisis

    - _Requisitos: 3.7_
  - [x] 6.3 Implementar endpoint de starters
    - GET /api/starters - Obtener todos los starters con estado
    - _Requisitos: 3.6, 8.1, 8.2, 8.3_
  - [x] 6.4 Escribir property test para unicidad de starter


    - **Propiedad 5: Unicidad de Starter en Gacha**
    - **Valida: Requisitos 3.1, 3.4**
  - [x] 6.5 Escribir property test para prevención de tirada duplicada

    - **Propiedad 6: Prevención de Tirada Duplicada**
    - **Valida: Requisitos 3.2**
  - [x] 6.6 Escribir property test para consistencia de conteo


    - **Propiedad 9: Consistencia de Conteo de Starters**
    - **Valida: Requisitos 3.6, 8.3**
  - [-] 6.7 Escribir property test para atomicidad de transacción



    - **Propiedad 8: Atomicidad de Transacción Gacha**
    - **Valida: Requisitos 3.5**

- [x] 7. Checkpoint - Verificar tests de gacha

  - Ensure all tests pass, ask the user if questions arise.


- [x] 8. Módulo de Verificación
  - [x] 8.1 Implementar servicio de verificación
    - Crear `src/modules/verification/verification.service.ts`
    - Crear `src/modules/verification/verification.controller.ts`
    - Crear `src/modules/verification/verification.routes.ts`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [-] 8.2 Escribir property test para formato de código



    - **Propiedad 11: Formato de Código de Verificación**
    - **Valida: Requisitos 4.1**
  - [ ] 8.3 Escribir property test para verificación correcta
    - **Propiedad 12: Verificación con Código Correcto**
    - **Valida: Requisitos 4.2**
  - [ ] 8.4 Escribir property test para rechazo de código incorrecto
    - **Propiedad 13: Rechazo de Código Incorrecto**
    - **Valida: Requisitos 4.3**


- [x] 9. Módulo de Tienda
  - [x] 9.1 Implementar servicio de tienda
    - Crear `src/modules/shop/shop.service.ts`
    - Crear `src/modules/shop/shop.controller.ts`
    - Crear `src/modules/shop/shop.routes.ts`
    - Implementar regeneración de stock cada hora

    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [ ] 9.2 Escribir property test para regeneración de stock
    - **Propiedad 16: Regeneración de Stock**
    - **Valida: Requisitos 5.1, 5.6**
  - [ ] 9.3 Escribir property test para validación de compra
    - **Propiedad 18: Validación de Compra**
    - **Valida: Requisitos 5.3**
  - [ ] 9.4 Escribir property test para precio dinámico
    - **Propiedad 20: Precio Dinámico por Stock**
    - **Valida: Requisitos 5.5**

- [x] 10. Módulo de Torneos


  - [x] 10.1 Implementar servicio de torneos
    - Crear `src/modules/tournaments/tournaments.service.ts`
    - Crear `src/modules/tournaments/tournaments.controller.ts`
    - Crear `src/modules/tournaments/tournaments.routes.ts`
    - _Requisitos: 7.1, 7.2, 7.3, 7.4_
  - [ ] 10.2 Escribir property test para validación de fecha
    - **Propiedad 27: Validación de Fecha de Torneo**
    - **Valida: Requisitos 7.2**
  - [ ] 10.3 Escribir property test para categorización
    - **Propiedad 26: Categorización de Torneos**
    - **Valida: Requisitos 7.1**

- [x] 11. Módulo de Level Caps

  - [x] 11.1 Implementar servicio de level caps
    - Crear `src/modules/level-caps/level-caps.service.ts`
    - Crear `src/modules/level-caps/level-caps.controller.ts`


    - Crear `src/modules/level-caps/level-caps.routes.ts`
    - Implementar cálculo de caps efectivos con fórmulas y reglas
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ] 11.2 Escribir property test para cálculo de caps
    - **Propiedad 28: Cálculo de Level Caps**
    - **Valida: Requisitos 9.2, 9.3, 9.4**
  - [ ] 11.3 Escribir property test para historial de cambios
    - **Propiedad 29: Historial de Cambios de Level Caps**
    - **Valida: Requisitos 9.5**

- [x] 12. Checkpoint - Verificar tests de módulos

  - Ensure all tests pass, ask the user if questions arise.


- [x] 13. Módulo de Administración

  - [x] 13.1 Implementar endpoints de administración

    - POST /api/admin/ban - Banear/desbanear jugador
    - Endpoints de gestión de level caps
    - Endpoints de gestión de torneos
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ] 13.2 Escribir property test para acceso de administrador
    - **Propiedad 30: Acceso de Administrador**
    - **Valida: Requisitos 11.1**
  - [ ] 13.3 Escribir property test para operación de ban
    - **Propiedad 31: Operación de Ban**
    - **Valida: Requisitos 11.2**

- [x] 14. Configuración del Servidor Express

  - [x] 14.1 Crear punto de entrada del servidor


    - Crear `src/app.ts` con configuración de Express
    - Crear `src/server.ts` como entry point
    - Registrar todas las rutas de módulos
    - Configurar CORS para frontend
    - _Requisitos: 1.2, 1.5_


  - [x] 14.2 Escribir property test para rate limiting



    - **Propiedad 32: Rate Limiting**
    - **Valida: Requisitos 12.2, 14.3**


  - [x] 14.3 Escribir property test para manejo de errores


    - **Propiedad 36: Manejo de Errores**
    - **Valida: Requisitos 14.5**

- [x] 15. Checkpoint - Backend completo
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Configuración del Proyecto Frontend
  - [x] 16.1 Crear estructura de carpetas del frontend
    - Crear `/frontend` con estructura Next.js 14 App Router
    - Configurar `package.json` con dependencias
    - Configurar `tailwind.config.ts`
    - _Requisitos: 1.1, 1.3_
  - [x] 16.2 Implementar cliente API
    - Crear `src/lib/api.ts` para comunicación con backend
    - Crear hooks: `useAuth.ts`, `useApi.ts`, `useSound.ts`
    - _Requisitos: 13.3_
  - [x] 16.3 Implementar componentes UI base
    - Crear `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Modal.tsx`
    - Crear `src/components/layout/Navbar.tsx`, `Footer.tsx`
    - _Requisitos: 13.1, 13.2_

- [x] 17. Páginas del Frontend
  - [x] 17.1 Implementar página principal (Gacha)
    - Crear `src/app/(main)/page.tsx`
    - Crear componentes: `GachaMachine.tsx`, `StarterCard.tsx`, `SoulDrivenQuiz.tsx`
    - _Requisitos: 3.1, 3.6, 3.7, 13.4_
  - [x] 17.2 Implementar página de tienda
    - Crear `src/app/(main)/tienda/page.tsx`
    - Crear componentes: `PokeballCard.tsx`, `PurchaseModal.tsx`
    - _Requisitos: 5.1, 5.2, 5.3_
  - [x] 17.3 Implementar páginas de jugadores
    - Crear `src/app/(main)/jugadores/page.tsx`
    - Crear `src/app/(main)/jugadores/[uuid]/page.tsx`
    - Crear componentes: `PlayerCard.tsx`, `PokemonCard.tsx`
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_
  - [x] 17.4 Implementar página de galería
    - Crear `src/app/(main)/galeria/page.tsx`
    - _Requisitos: 8.1, 8.2, 8.3, 8.4_
  - [x] 17.5 Implementar página de torneos
    - Crear `src/app/(main)/torneos/page.tsx`
    - _Requisitos: 7.1, 7.3, 7.4_
  - [x] 17.6 Implementar página de servidor
    - Crear `src/app/(main)/servidor/page.tsx`
    - Crear componente: `ServerStatus.tsx`
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_
  - [x] 17.7 Implementar página de verificación
    - Crear `src/app/(main)/verificar/page.tsx`
    - _Requisitos: 4.2, 4.3_

- [x] 18. Panel de Administración Frontend
  - [x] 18.1 Implementar layout y páginas de admin
    - Crear `src/app/admin/layout.tsx`
    - Crear `src/app/admin/page.tsx`
    - Crear `src/app/admin/jugadores/page.tsx`
    - Crear `src/app/admin/torneos/page.tsx`
    - Crear `src/app/admin/level-caps/page.tsx`
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 19. Internacionalización y Estilos
  - [x] 19.1 Configurar tema y estilos globales
    - Configurar tema oscuro con colores Pokémon
    - Implementar responsive design (320px+ móvil, 1024px+ escritorio)
    - _Requisitos: 13.1, 13.2_
  - [x] 19.2 Implementar efectos de sonido
    - Crear `src/lib/sounds.ts`
    - Implementar toggle de sonido en navbar
    - _Requisitos: 13.3_
  - [x] 19.3 Verificar textos en español
    - Revisar todos los textos, mensajes de error, fechas
    - _Requisitos: 13.6_

- [x] 20. Integración y Testing Final
  - [x] 20.1 Verificar compatibilidad de endpoints con plugin
    - Probar todos los endpoints que usa el plugin de Minecraft
    - Verificar estructura de respuestas
    - _Requisitos: 1.5, 12.1, 12.3, 12.4_
  - [x] 20.2 Escribir property test para compatibilidad de base de datos
    - **Propiedad 1: Compatibilidad de Base de Datos**
    - **Valida: Requisitos 1.4**
  - [x] 20.3 Escribir property test para compatibilidad de endpoints
    - **Propiedad 2: Compatibilidad de Endpoints**
    - **Valida: Requisitos 1.5**

- [x] 21. Checkpoint Final - Verificar todos los tests
  - Ensure all tests pass, ask the user if questions arise.
