# Documento de Diseño - Cobblemon Los Pitufos (Reconstrucción)

## Visión General

Este documento describe el diseño técnico para la reconstrucción de la plataforma Cobblemon Los Pitufos. El sistema se divide en dos proyectos independientes:

1. **Backend API** (`/backend`): Servidor Express.js con TypeScript que expone una API REST
2. **Frontend Web** (`/frontend`): Aplicación Next.js 14 con App Router y TypeScript

Ambos proyectos comparten tipos TypeScript y se comunican mediante HTTP/JSON.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                  │
├─────────────────────┬───────────────────────────────────────────┤
│   Frontend Web      │        Plugin Minecraft                    │
│   (Next.js 14)      │        (Fabric/Java)                       │
│   Puerto: 3000      │                                            │
└─────────┬───────────┴───────────────────┬───────────────────────┘
          │                               │
          │ HTTP/JSON                     │ HTTP/JSON
          │                               │
          ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                 │
│                   (Express + TypeScript)                         │
│                      Puerto: 4000                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth       │  │   Players    │  │   Shop       │          │
│  │   Module     │  │   Module     │  │   Module     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Gacha      │  │   Tournaments│  │   LevelCaps  │          │
│  │   Module     │  │   Module     │  │   Module     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ MongoDB Driver
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Atlas                               │
│                   (Base de datos existente)                      │
├─────────────────────────────────────────────────────────────────┤
│  Collections: users, starters, tournaments, level_caps,          │
│               shop_stock, shop_purchases                         │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes e Interfaces

### Backend API - Estructura de Carpetas

```
/backend
├── src/
│   ├── config/
│   │   ├── database.ts      # Conexión MongoDB
│   │   ├── auth.ts          # Configuración Discord OAuth
│   │   └── env.ts           # Variables de entorno
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.middleware.ts
│   │   │   └── auth.routes.ts
│   │   ├── players/
│   │   │   ├── players.controller.ts
│   │   │   ├── players.service.ts
│   │   │   ├── players.schema.ts
│   │   │   └── players.routes.ts
│   │   ├── gacha/
│   │   │   ├── gacha.controller.ts
│   │   │   ├── gacha.service.ts
│   │   │   └── gacha.routes.ts
│   │   ├── shop/
│   │   │   ├── shop.controller.ts
│   │   │   ├── shop.service.ts
│   │   │   └── shop.routes.ts
│   │   ├── tournaments/
│   │   │   ├── tournaments.controller.ts
│   │   │   ├── tournaments.service.ts
│   │   │   └── tournaments.routes.ts
│   │   ├── level-caps/
│   │   │   ├── level-caps.controller.ts
│   │   │   ├── level-caps.service.ts
│   │   │   └── level-caps.routes.ts
│   │   └── verification/
│   │       ├── verification.controller.ts
│   │       ├── verification.service.ts
│   │       └── verification.routes.ts
│   ├── shared/
│   │   ├── types/
│   │   │   ├── user.types.ts
│   │   │   ├── pokemon.types.ts
│   │   │   ├── shop.types.ts
│   │   │   └── tournament.types.ts
│   │   ├── data/
│   │   │   ├── starters.data.ts
│   │   │   └── pokeballs.data.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── serialization.ts
│   │   │   └── rate-limiter.ts
│   │   └── middleware/
│   │       ├── error-handler.ts
│   │       └── ip-whitelist.ts
│   ├── app.ts               # Express app setup
│   └── server.ts            # Entry point
├── tests/
│   ├── unit/
│   └── property/
├── package.json
├── tsconfig.json
└── .env.example
```

### Frontend Web - Estructura de Carpetas

```
/frontend
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (main)/
│   │   │   ├── page.tsx              # Gacha principal
│   │   │   ├── tienda/page.tsx
│   │   │   ├── jugadores/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [uuid]/page.tsx
│   │   │   ├── galeria/page.tsx
│   │   │   ├── torneos/page.tsx
│   │   │   ├── servidor/page.tsx
│   │   │   └── verificar/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── jugadores/page.tsx
│   │   │   ├── torneos/page.tsx
│   │   │   └── level-caps/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── gacha/
│   │   │   ├── GachaMachine.tsx
│   │   │   ├── StarterCard.tsx
│   │   │   └── SoulDrivenQuiz.tsx
│   │   ├── players/
│   │   │   ├── PlayerCard.tsx
│   │   │   └── PokemonCard.tsx
│   │   ├── shop/
│   │   │   ├── PokeballCard.tsx
│   │   │   └── PurchaseModal.tsx
│   │   └── server/
│   │       └── ServerStatus.tsx
│   ├── lib/
│   │   ├── api.ts           # Cliente API
│   │   ├── auth.ts          # Helpers de autenticación
│   │   ├── sounds.ts        # Efectos de sonido
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSound.ts
│   │   └── useApi.ts
│   └── types/
│       └── index.ts         # Re-export de tipos compartidos
├── public/
│   ├── sounds/
│   └── images/
├── package.json
├── tailwind.config.ts
└── next.config.js
```

### API Endpoints

Los endpoints mantienen compatibilidad con el plugin de Minecraft existente:

#### Autenticación
- `GET /api/auth/discord` - Iniciar OAuth con Discord
- `GET /api/auth/discord/callback` - Callback de Discord
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

#### Jugadores
- `GET /api/players` - Listar todos los jugadores
- `GET /api/players/:uuid` - Obtener perfil de jugador
- `POST /api/players/sync` - Sincronizar datos desde plugin
- `GET /api/players/starter?uuid=X` - Verificar starter pendiente
- `POST /api/players/starter-given` - Marcar starter como entregado
- `GET /api/players/verification-status?uuid=X` - Estado de verificación
- `GET /api/players/ban-status?uuid=X` - Estado de ban

#### Gacha
- `GET /api/gacha/roll?discordId=X` - Verificar estado de tirada
- `POST /api/gacha/roll` - Realizar tirada clásica
- `POST /api/gacha/soul-driven` - Realizar tirada Soul Driven
- `GET /api/starters` - Obtener todos los starters con estado

#### Tienda
- `GET /api/shop/stock` - Obtener stock actual
- `GET /api/shop/balance?uuid=X` - Obtener balance del jugador
- `POST /api/shop/purchase` - Realizar compra
- `GET /api/shop/purchases?uuid=X` - Obtener compras pendientes
- `POST /api/shop/claim` - Marcar compra como reclamada

#### Verificación
- `POST /api/verification/generate` - Generar código (desde plugin)
- `POST /api/verification/verify` - Verificar código (desde plugin)
- `POST /api/verify/check` - Verificar código (desde web)

#### Torneos
- `GET /api/tournaments` - Listar torneos
- `GET /api/tournaments/:id` - Obtener torneo específico
- `POST /api/tournaments` - Crear torneo (admin)
- `PUT /api/tournaments/:id` - Actualizar torneo (admin)
- `DELETE /api/tournaments/:id` - Eliminar torneo (admin)

#### Level Caps
- `GET /api/level-caps/effective?uuid=X` - Obtener caps efectivos
- `GET /api/level-caps/version` - Obtener versión de configuración
- `GET /api/admin/level-caps/config` - Obtener configuración (admin)
- `PUT /api/admin/level-caps/config` - Actualizar configuración (admin)
- `GET /api/admin/level-caps/history` - Obtener historial (admin)

#### Admin
- `POST /api/admin/ban` - Banear/desbanear jugador
- `GET /api/server-status` - Estado del servidor Minecraft

## Modelos de Datos

### User (Colección: users)
```typescript
interface User {
  _id: ObjectId;
  // Discord
  discordId: string | null;
  discordUsername: string;
  discordAvatar?: string;
  nickname: string;
  
  // Minecraft
  minecraftUuid?: string;
  minecraftUsername?: string;
  minecraftOnline?: boolean;
  minecraftLastSeen?: string;
  
  // Verificación
  verified: boolean;
  verifiedAt?: string;
  verificationCode?: string;
  
  // Starter
  starterId: number | null;
  starterIsShiny: boolean;
  starterGiven: boolean;
  rolledAt: string | null;
  
  // Pokémon
  pokemonParty: Pokemon[];
  pcStorage: PCBox[];
  
  // Economía
  cobbleDollarsBalance: number;
  
  // Admin
  isAdmin: boolean;
  banned: boolean;
  banReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: string;
}
```

### Pokemon
```typescript
interface Pokemon {
  uuid: string;
  species: string;
  speciesId: number;
  nickname?: string;
  level: number;
  experience: number;
  shiny: boolean;
  gender: 'male' | 'female' | 'genderless';
  nature: string;
  ability: string;
  friendship: number;
  ball: string;
  
  ivs: PokemonStats;
  evs: PokemonStats;
  moves: PokemonMove[];
  
  heldItem?: string;
  heldItemCount?: number;
  currentHealth: number;
  maxHealth: number;
  status?: string;
  form?: string;
}

interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

interface PokemonMove {
  name: string;
}
```

### Starter (Colección: starters)
```typescript
interface Starter {
  _id: ObjectId;
  pokemonId: number;
  name: string;
  isClaimed: boolean;
  claimedBy: string | null;      // discordId
  claimedByNickname?: string;
  minecraftUsername?: string;
  claimedAt: string | null;
  starterIsShiny: boolean;
}
```

### Tournament (Colección: tournaments)
```typescript
interface Tournament {
  _id: ObjectId;
  title: string;
  description: string;
  startDate: string;
  maxParticipants: number;
  prizes: string;
  status: 'upcoming' | 'active' | 'completed';
  participants: TournamentParticipant[];
  winner?: string;
  createdBy: string;
  createdAt: Date;
}
```

### ShopStock (Colección: shop_stock)
```typescript
interface ShopStock {
  _id: ObjectId;
  id: 'current';
  stocks: Record<string, BallStock>;
  lastRefresh: number;
}

interface BallStock {
  ballId: string;
  stock: number;
  price: number;
  maxStock: number;
  lastRefresh: number;
}
```

### ShopPurchase (Colección: shop_purchases)
```typescript
interface ShopPurchase {
  _id: ObjectId;
  uuid: string;              // minecraftUuid
  username: string;
  pending: PurchaseItem[];
}

interface PurchaseItem {
  ballId: string;
  quantity: number;
  purchasedAt: string;
  claimed: boolean;
  claimedAt?: string;
}
```

### LevelCaps (Colección: level_caps)
```typescript
interface LevelCapsDocument {
  _id: ObjectId;
  globalConfig: GlobalLevelCapConfig;
  staticRules: StaticLevelCapRule[];
  timeBasedRules: TimeBasedLevelCapRule[];
  changeHistory: LevelCapChange[];
  createdAt: Date;
  updatedAt: Date;
}
```


## Propiedades de Correctitud

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de correctitud verificables por máquina.*

### Propiedad 1: Compatibilidad de Base de Datos
*Para cualquier* documento existente en la base de datos MongoDB, el sistema debe poder leerlo y escribirlo sin errores ni pérdida de datos.
**Valida: Requisitos 1.4**

### Propiedad 2: Compatibilidad de Endpoints
*Para cualquier* endpoint del sistema actual, el nuevo backend debe exponer el mismo path, método HTTP y estructura de respuesta.
**Valida: Requisitos 1.5**

### Propiedad 3: Creación/Actualización de Usuario en Login
*Para cualquier* datos válidos de usuario de Discord (discordId, username, avatar), al iniciar sesión el sistema debe crear un nuevo registro si no existe, o actualizar el existente si ya existe.
**Valida: Requisitos 2.1**

### Propiedad 4: Protección de Rutas Autenticadas
*Para cualquier* endpoint protegido y cualquier solicitud sin token de autenticación válido, el sistema debe retornar código 401 o redirigir al flujo de autenticación.
**Valida: Requisitos 2.2**

### Propiedad 5: Unicidad de Starter en Gacha
*Para cualquier* tirada de gacha exitosa, el starter seleccionado debe ser uno de los 27 disponibles que no haya sido reclamado, y después de la tirada debe quedar marcado como no disponible.
**Valida: Requisitos 3.1, 3.4**

### Propiedad 6: Prevención de Tirada Duplicada
*Para cualquier* usuario que ya tiene un starterId asignado, cualquier intento de hacer otra tirada debe ser rechazado con error.
**Valida: Requisitos 3.2**

### Propiedad 7: Distribución de Shinies
*Para cualquier* conjunto de N tiradas (N > 100), la proporción de shinies debe estar dentro del rango esperado para una probabilidad del 1% (aproximadamente 0.5% a 2% con margen estadístico).
**Valida: Requisitos 3.3**

### Propiedad 8: Atomicidad de Transacción Gacha
*Para cualquier* tirada de gacha donde ocurre un error después de seleccionar el starter pero antes de completar, el estado del sistema debe permanecer sin cambios (ni usuario actualizado, ni starter marcado como reclamado).
**Valida: Requisitos 3.5**

### Propiedad 9: Consistencia de Conteo de Starters
*Para cualquier* momento, la suma de starters reclamados más starters disponibles debe ser exactamente 27.
**Valida: Requisitos 3.6, 8.3**

### Propiedad 10: Mapeo Soul Driven
*Para cualquier* conjunto de respuestas al cuestionario Soul Driven, el starter seleccionado debe ser uno cuyo tipo coincida con el mapeo de respuestas y que esté disponible.
**Valida: Requisitos 3.7**

### Propiedad 11: Formato de Código de Verificación
*Para cualquier* solicitud de generación de código de verificación, el código generado debe ser exactamente 5 dígitos numéricos (00000-99999).
**Valida: Requisitos 4.1**

### Propiedad 12: Verificación con Código Correcto
*Para cualquier* código de verificación válido asociado a un UUID, al verificar con ese código el usuario debe quedar marcado como verified: true.
**Valida: Requisitos 4.2**

### Propiedad 13: Rechazo de Código Incorrecto
*Para cualquier* código de verificación que no coincida con el almacenado para un UUID, la verificación debe fallar con error descriptivo.
**Valida: Requisitos 4.3**

### Propiedad 14: Consistencia de Estado de Verificación
*Para cualquier* UUID, el endpoint de verificación-status debe retornar el valor correcto de verified almacenado en la base de datos.
**Valida: Requisitos 4.4**

### Propiedad 15: Entrega de Starter Pendiente
*Para cualquier* usuario verificado con starterId asignado y starterGiven: false, el endpoint de starter debe retornar pending: true con los datos correctos del Pokémon.
**Valida: Requisitos 4.5**

### Propiedad 16: Regeneración de Stock
*Para cualquier* intervalo de 1 hora desde el último refresh, el stock de la tienda debe regenerarse con las reglas definidas: 3 básicas siempre, 2 especiales aleatorias, 5% Master Ball.
**Valida: Requisitos 5.1, 5.6**

### Propiedad 17: Consistencia de Balance
*Para cualquier* usuario, el balance retornado por el endpoint debe coincidir con el valor cobbleDollarsBalance almacenado en la base de datos.
**Valida: Requisitos 5.2**

### Propiedad 18: Validación de Compra
*Para cualquier* intento de compra, el sistema debe verificar que: (1) el usuario tiene suficiente balance, (2) hay suficiente stock, (3) la cantidad es positiva.
**Valida: Requisitos 5.3**

### Propiedad 19: Atomicidad de Compra
*Para cualquier* compra exitosa, las tres operaciones deben completarse atómicamente: descontar balance, reducir stock, crear registro de compra pendiente.
**Valida: Requisitos 5.4**

### Propiedad 20: Precio Dinámico por Stock
*Para cualquier* Pokéball con stock menor al 25% del máximo, el precio debe ser mayor que el precio base según la fórmula de escalado.
**Valida: Requisitos 5.5**

### Propiedad 21: Marcado de Compra Reclamada
*Para cualquier* solicitud de claim válida, la compra debe quedar marcada con claimed: true y claimedAt con timestamp.
**Valida: Requisitos 5.7**

### Propiedad 22: Completitud de Lista de Jugadores
*Para cualquier* solicitud de lista de jugadores, todos los usuarios con minecraftUuid o starterId deben ser incluidos con los campos requeridos.
**Valida: Requisitos 6.1**

### Propiedad 23: Completitud de Perfil de Jugador
*Para cualquier* solicitud de perfil de jugador existente, la respuesta debe incluir todos los campos requeridos: uuid, username, party, stats.
**Valida: Requisitos 6.2**

### Propiedad 24: Inclusión de Starter en Perfil
*Para cualquier* jugador con starterId asignado, su perfil debe incluir la información del starter.
**Valida: Requisitos 6.3**

### Propiedad 25: Actualización por Sincronización
*Para cualquier* payload de sincronización válido del plugin, los datos del jugador deben actualizarse correctamente en la base de datos.
**Valida: Requisitos 6.5, 12.1**

### Propiedad 26: Categorización de Torneos
*Para cualquier* lista de torneos, cada torneo debe estar correctamente categorizado según su status y fecha.
**Valida: Requisitos 7.1**

### Propiedad 27: Validación de Fecha de Torneo
*Para cualquier* intento de crear torneo con fecha de inicio en el pasado, la solicitud debe ser rechazada.
**Valida: Requisitos 7.2**

### Propiedad 28: Cálculo de Level Caps
*Para cualquier* jugador, los caps efectivos deben calcularse correctamente aplicando: fórmula global, reglas estáticas que coincidan, reglas temporales activas, y el cap de captura nunca debe exceder el de posesión.
**Valida: Requisitos 9.2, 9.3, 9.4**

### Propiedad 29: Historial de Cambios de Level Caps
*Para cualquier* cambio en la configuración de level caps, debe crearse una entrada en el historial con timestamp, admin, valores antes y después.
**Valida: Requisitos 9.5**

### Propiedad 30: Acceso de Administrador
*Para cualquier* usuario con isAdmin: true, debe poder acceder a los endpoints de administración. Para usuarios sin isAdmin, debe retornar 403.
**Valida: Requisitos 11.1**

### Propiedad 31: Operación de Ban
*Para cualquier* operación de ban/unban, el campo banned del usuario debe actualizarse correctamente junto con banReason.
**Valida: Requisitos 11.2**

### Propiedad 32: Rate Limiting
*Para cualquier* IP que exceda 60 solicitudes por minuto a endpoints de sincronización, las solicitudes adicionales deben ser rechazadas con código 429.
**Valida: Requisitos 12.2, 14.3**

### Propiedad 33: Inclusión de Estado de Ban en Sync
*Para cualquier* respuesta de sincronización, debe incluirse el estado de ban del jugador.
**Valida: Requisitos 12.5**

### Propiedad 34: Validación de IP Autorizada
*Para cualquier* solicitud de sincronización desde IP no autorizada, debe ser rechazada con código 403.
**Valida: Requisitos 12.6**

### Propiedad 35: Validación de Entrada
*Para cualquier* entrada de usuario que no cumpla con el esquema de validación, la solicitud debe ser rechazada con código 400 y mensaje descriptivo.
**Valida: Requisitos 14.1**

### Propiedad 36: Manejo de Errores
*Para cualquier* error interno del servidor, la respuesta al usuario debe ser un mensaje amigable sin exponer detalles técnicos.
**Valida: Requisitos 14.5**

### Propiedad 37: Round-Trip de Serialización de Pokémon
*Para cualquier* objeto Pokemon válido, serialize(deserialize(serialize(pokemon))) debe producir un resultado idéntico a serialize(pokemon).
**Valida: Requisitos 15.1, 15.3**

### Propiedad 38: Validación de Deserialización
*Para cualquier* dato de Pokémon de la base de datos, la deserialización debe validar que todos los campos requeridos estén presentes y tengan los tipos correctos.
**Valida: Requisitos 15.2**

### Propiedad 39: Rechazo de Datos Malformados
*Para cualquier* payload de sincronización con datos malformados (campos faltantes, tipos incorrectos), la solicitud debe ser rechazada con código 400 y mensaje indicando el campo inválido.
**Valida: Requisitos 15.4**

## Manejo de Errores

### Códigos de Error HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Datos de entrada inválidos |
| 401 | Unauthorized | No autenticado |
| 403 | Forbidden | Sin permisos / IP no autorizada |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: starter ya reclamado) |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error del servidor |

### Formato de Respuesta de Error

```typescript
interface ErrorResponse {
  success: false;
  error: string;           // Mensaje amigable para el usuario
  code?: string;           // Código de error interno (ej: 'STARTER_ALREADY_CLAIMED')
  field?: string;          // Campo que causó el error (para validación)
}
```

### Logging

- Errores 5xx: Log completo con stack trace
- Errores 4xx: Log básico sin stack trace
- Operaciones sensibles: Log de auditoría (login, gacha, compras, admin)

## Estrategia de Testing

### Testing Unitario

Se usará **Vitest** para tests unitarios en ambos proyectos:

- Servicios de negocio (gacha, shop, level-caps)
- Funciones de utilidad (validación, serialización)
- Middleware (auth, rate-limiting)

### Property-Based Testing

Se usará **fast-check** para tests basados en propiedades:

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

// Ejemplo: Propiedad 37 - Round-trip de serialización
describe('Pokemon Serialization', () => {
  it('should preserve data through round-trip', () => {
    fc.assert(
      fc.property(pokemonArbitrary, (pokemon) => {
        const serialized = serializePokemon(pokemon);
        const deserialized = deserializePokemon(serialized);
        const reserialized = serializePokemon(deserialized);
        expect(reserialized).toEqual(serialized);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Generadores para Property Testing

```typescript
// Generador de Pokemon válido
const pokemonArbitrary = fc.record({
  uuid: fc.uuid(),
  species: fc.constantFrom('bulbasaur', 'charmander', 'squirtle', ...),
  speciesId: fc.integer({ min: 1, max: 1010 }),
  level: fc.integer({ min: 1, max: 100 }),
  experience: fc.integer({ min: 0, max: 1000000 }),
  shiny: fc.boolean(),
  gender: fc.constantFrom('male', 'female', 'genderless'),
  nature: fc.constantFrom('hardy', 'lonely', 'brave', ...),
  ability: fc.string({ minLength: 1, maxLength: 50 }),
  friendship: fc.integer({ min: 0, max: 255 }),
  ball: fc.constantFrom('poke_ball', 'great_ball', 'ultra_ball', ...),
  ivs: statsArbitrary,
  evs: statsArbitrary,
  moves: fc.array(moveArbitrary, { minLength: 0, maxLength: 4 }),
  currentHealth: fc.integer({ min: 0, max: 999 }),
  maxHealth: fc.integer({ min: 1, max: 999 }),
});

const statsArbitrary = fc.record({
  hp: fc.integer({ min: 0, max: 31 }),
  attack: fc.integer({ min: 0, max: 31 }),
  defense: fc.integer({ min: 0, max: 31 }),
  spAttack: fc.integer({ min: 0, max: 31 }),
  spDefense: fc.integer({ min: 0, max: 31 }),
  speed: fc.integer({ min: 0, max: 31 }),
});
```

### Tests de Integración

- Flujos completos de usuario (login -> gacha -> verificación)
- Interacción con MongoDB (usando contenedor de test)
- Endpoints de API con supertest

### Cobertura Mínima

- Servicios de negocio: 80%
- Utilidades: 90%
- Controladores: 70%
