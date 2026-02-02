# Design Document: Pokemon Gacha System

## Overview

Sistema de gacha inspirado en Genshin Impact para el servidor Cobblemon Los Pitufos. Los jugadores gastan CobbleDollars para obtener Pokémon aleatorios con diferentes raridades, items valiosos como Master Balls, y tienen acceso a banners rotativos con Pokémon destacados. El sistema utiliza RNG criptográfico para verdadera aleatoriedad y incluye un sistema de pity para proteger la inversión del jugador.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ GachaPage   │  │ BannerCard  │  │ PullAnimation           │  │
│  │ /gacha      │  │             │  │ ResultsModal            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express + TypeScript)              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  pokemon-gacha module                    │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │ Controller   │  │ Service      │  │ RNG Service  │   │    │
│  │  │ (Routes)     │  │ (Logic)      │  │ (Crypto)     │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │ Banner Svc   │  │ Pool Builder │  │ Pity Manager │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB Collections                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ gacha_      │  │ gacha_      │  │ gacha_pending_          │  │
│  │ banners     │  │ history     │  │ rewards                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ gacha_      │  │ users       │                               │
│  │ pity        │  │ (balance)   │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Minecraft Plugin (Java)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   GachaManager                           │    │
│  │  - Poll pending rewards                                  │    │
│  │  - Deliver Pokémon to party/PC                          │    │
│  │  - Deliver items to inventory                           │    │
│  │  - /gacha claim command                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. CryptoRngService
Servicio de generación de números aleatorios criptográficamente seguros.

```typescript
interface CryptoRngService {
  // Genera un número aleatorio entre 0 y 1 usando crypto.randomBytes
  random(): number;
  
  // Genera un entero aleatorio en el rango [min, max]
  randomInt(min: number, max: number): number;
  
  // Selecciona un elemento de un array con pesos
  weightedSelect<T>(items: T[], weights: number[]): T;
}
```

#### 2. PokemonGachaService
Servicio principal que maneja la lógica de tiradas.

```typescript
interface PokemonGachaService {
  // Ejecuta una tirada simple
  pull(playerId: string, bannerId: string, idempotencyKey: string): Promise<GachaPullResult>;
  
  // Ejecuta 10 tiradas
  multiPull(playerId: string, bannerId: string, idempotencyKey: string): Promise<GachaMultiPullResult>;
  
  // Obtiene el estado de pity del jugador
  getPityStatus(playerId: string, bannerId: string): Promise<PityStatus>;
  
  // Obtiene el historial de tiradas
  getHistory(playerId: string, filters: HistoryFilters): Promise<GachaHistoryEntry[]>;
  
  // Obtiene estadísticas del jugador
  getStats(playerId: string): Promise<GachaStats>;
}
```

#### 3. BannerService
Servicio para gestión de banners.

```typescript
interface BannerService {
  // Obtiene todos los banners activos
  getActiveBanners(): Promise<GachaBanner[]>;
  
  // Obtiene un banner por ID
  getBanner(bannerId: string): Promise<GachaBanner | null>;
  
  // Crea un nuevo banner (admin)
  createBanner(data: CreateBannerData): Promise<GachaBanner>;
  
  // Actualiza un banner (admin)
  updateBanner(bannerId: string, data: UpdateBannerData): Promise<GachaBanner>;
  
  // Desactiva un banner (admin)
  deactivateBanner(bannerId: string): Promise<void>;
}
```

#### 4. PoolBuilderService
Servicio para construir el pool de recompensas de un banner.

```typescript
interface PoolBuilderService {
  // Construye el pool completo con probabilidades
  buildPool(banner: GachaBanner): RewardPool;
  
  // Calcula probabilidad ajustada por pity
  calculateAdjustedProbabilities(pool: RewardPool, pityCount: number): RewardPool;
  
  // Selecciona una recompensa del pool
  selectReward(pool: RewardPool, rng: CryptoRngService): GachaReward;
}
```

#### 5. PityManagerService
Servicio para gestión del sistema de pity.

```typescript
interface PityManagerService {
  // Obtiene el contador de pity actual
  getPityCount(playerId: string, bannerId: string): Promise<number>;
  
  // Incrementa el contador de pity
  incrementPity(playerId: string, bannerId: string): Promise<number>;
  
  // Resetea el contador de pity
  resetPity(playerId: string, bannerId: string): Promise<void>;
  
  // Verifica si el jugador perdió el 50/50
  getLost5050Status(playerId: string, bannerId: string): Promise<boolean>;
  
  // Actualiza el estado del 50/50
  setLost5050Status(playerId: string, bannerId: string, lost: boolean): Promise<void>;
}
```

### API Endpoints

```typescript
// Tiradas
POST /api/pokemon-gacha/pull
POST /api/pokemon-gacha/multi-pull

// Información
GET  /api/pokemon-gacha/banners
GET  /api/pokemon-gacha/banners/:id
GET  /api/pokemon-gacha/pity/:bannerId
GET  /api/pokemon-gacha/history
GET  /api/pokemon-gacha/stats

// Entrega (para plugin)
GET  /api/pokemon-gacha/pending/:uuid
POST /api/pokemon-gacha/claim/:rewardId

// Admin
POST /api/pokemon-gacha/admin/banners
PUT  /api/pokemon-gacha/admin/banners/:id
DELETE /api/pokemon-gacha/admin/banners/:id
```

## Data Models

### GachaBanner
```typescript
interface GachaBanner {
  _id: ObjectId;
  bannerId: string;           // Unique identifier
  name: string;               // Display name
  nameEs: string;             // Spanish name
  description: string;        // Banner description
  artwork: string;            // Banner image URL
  type: 'standard' | 'limited' | 'event';
  
  // Timing
  startDate: Date;
  endDate: Date | null;       // null = permanent
  isActive: boolean;
  
  // Featured content
  featuredPokemon: FeaturedItem[];
  featuredItems: FeaturedItem[];
  rateUpMultiplier: number;   // Default 5x
  
  // Pool configuration
  pokemonPool: PokemonPoolEntry[];
  itemPool: ItemPoolEntry[];
  
  // Costs
  singlePullCost: number;     // Default 500
  multiPullCost: number;      // Default 4500
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface FeaturedItem {
  type: 'pokemon' | 'item';
  id: number | string;        // Pokemon ID or item ID
  name: string;
  rarity: Rarity;
  sprite: string;
}

interface PokemonPoolEntry {
  pokemonId: number;
  name: string;
  rarity: Rarity;
  baseWeight: number;         // Base probability weight
}

interface ItemPoolEntry {
  itemId: string;             // e.g., "cobblemon:master_ball"
  name: string;
  rarity: Rarity;
  baseWeight: number;
  quantity: number;           // How many to give
}
```

### GachaReward
```typescript
interface GachaReward {
  _id: ObjectId;
  rewardId: string;           // Unique identifier
  playerId: string;           // Discord ID or UUID
  bannerId: string;
  
  type: 'pokemon' | 'item';
  
  // Pokemon data (if type === 'pokemon')
  pokemon?: {
    pokemonId: number;
    name: string;
    nameEs: string;
    level: number;
    isShiny: boolean;
    ivs: {
      hp: number;
      atk: number;
      def: number;
      spa: number;
      spd: number;
      spe: number;
    };
    nature: string;
    ability: string;
  };
  
  // Item data (if type === 'item')
  item?: {
    itemId: string;
    name: string;
    quantity: number;
  };
  
  rarity: Rarity;
  
  // Delivery status
  status: 'pending' | 'claimed' | 'expired';
  claimedAt?: Date;
  
  // Metadata
  pulledAt: Date;
  idempotencyKey: string;
}

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
```

### GachaPity
```typescript
interface GachaPity {
  _id: ObjectId;
  playerId: string;
  bannerId: string;
  
  // Pity counters
  pullsSinceEpic: number;     // Resets on Epic+
  pullsSinceLegendary: number; // Resets on Legendary+
  
  // 50/50 tracking
  lost5050: boolean;          // True if next featured-rarity is guaranteed
  
  // Statistics
  totalPulls: number;
  totalSpent: number;
  
  updatedAt: Date;
}
```

### GachaHistory
```typescript
interface GachaHistoryEntry {
  _id: ObjectId;
  playerId: string;
  bannerId: string;
  bannerName: string;
  
  reward: GachaReward;
  rarity: Rarity;
  isShiny: boolean;
  isFeatured: boolean;
  
  pityAtPull: number;
  cost: number;
  
  pulledAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Balance deduction consistency
*For any* valid pull request with sufficient balance, the player balance after the pull SHALL equal the balance before minus exactly the pull cost (500 for single, 4500 for multi).
**Validates: Requirements 1.1, 1.2**

### Property 2: Insufficient balance rejection
*For any* pull request where player balance is less than the pull cost, the request SHALL be rejected and the balance SHALL remain unchanged.
**Validates: Requirements 1.3**

### Property 3: Multi-pull reward count
*For any* successful multi-pull, the result SHALL contain exactly 10 rewards.
**Validates: Requirements 1.2**

### Property 4: History recording
*For any* successful pull, the player history SHALL contain a new entry with all required fields (timestamp, reward, banner ID).
**Validates: Requirements 1.5**

### Property 5: IV range by rarity
*For any* Pokemon reward, the IVs SHALL fall within the defined range for its rarity tier.
**Validates: Requirements 2.3**

### Property 6: Shiny flag consistency
*For any* Pokemon marked as shiny, the isShiny flag SHALL be true and shiny sprites SHALL be used.
**Validates: Requirements 3.2**

### Property 7: Pity counter increment
*For any* pull that does not result in Epic-or-better, the pity counter SHALL increment by exactly 1.
**Validates: Requirements 4.1**

### Property 8: Hard pity guarantee
*For any* pull where pity counter equals 89 (90th pull), the result SHALL be Epic rarity or better.
**Validates: Requirements 4.3**

### Property 9: Pity reset on Epic
*For any* pull that results in Epic-or-better, the pity counter SHALL be reset to 0.
**Validates: Requirements 4.4**

### Property 10: Banner pity independence
*For any* two different banners, pulling on one SHALL NOT affect the pity counter of the other.
**Validates: Requirements 4.5, 5.1**

### Property 11: Expired banner rejection
*For any* pull request on an expired banner, the request SHALL be rejected.
**Validates: Requirements 5.3**

### Property 12: 50/50 guarantee after loss
*For any* player who lost the 50/50, the next featured-rarity reward SHALL be the featured item.
**Validates: Requirements 6.3**

### Property 13: Item reward delivery
*For any* item reward, a pending delivery entry SHALL be created with correct item ID and quantity.
**Validates: Requirements 7.2**

### Property 14: History limit
*For any* history query, the result SHALL contain at most 100 entries.
**Validates: Requirements 8.1**

### Property 15: Transaction atomicity
*For any* failed pull operation, no partial state changes SHALL persist (balance unchanged, no history entry, no reward).
**Validates: Requirements 12.1**

### Property 16: Idempotency
*For any* two pull requests with the same idempotency key, only one pull SHALL be executed and both requests SHALL return the same result.
**Validates: Requirements 12.3**

### Property 17: RNG bounds validation
*For any* RNG output used in the gacha, the value SHALL be within the expected bounds [0, 1) for random() and [min, max] for randomInt().
**Validates: Requirements 12.5**

## Error Handling

### Error Types
```typescript
enum GachaErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  BANNER_NOT_FOUND = 'BANNER_NOT_FOUND',
  BANNER_EXPIRED = 'BANNER_EXPIRED',
  BANNER_NOT_STARTED = 'BANNER_NOT_STARTED',
  INVALID_PULL_COUNT = 'INVALID_PULL_COUNT',
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',
  REWARD_NOT_FOUND = 'REWARD_NOT_FOUND',
  REWARD_ALREADY_CLAIMED = 'REWARD_ALREADY_CLAIMED',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

### Error Responses
```typescript
interface GachaError {
  success: false;
  error: {
    code: GachaErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

## Testing Strategy

### Dual Testing Approach

#### Unit Tests
- Test individual service methods in isolation
- Mock database and external dependencies
- Cover edge cases and error conditions
- Test IV generation ranges
- Test probability calculations

#### Property-Based Tests
- Use fast-check library for property-based testing
- Minimum 100 iterations per property
- Test invariants across random inputs
- Verify statistical properties of RNG
- Test transaction atomicity

### Test Categories

1. **RNG Tests**
   - Verify crypto.randomBytes usage
   - Test distribution uniformity
   - Test weighted selection accuracy

2. **Pull Logic Tests**
   - Balance deduction
   - Reward generation
   - History recording
   - Pity system

3. **Banner Tests**
   - Active/expired status
   - Featured rate-up
   - Pool building

4. **Integration Tests**
   - Full pull flow
   - Multi-pull flow
   - Claim flow

### Property Test Format
Each property-based test MUST be tagged with:
```typescript
// **Feature: pokemon-gacha-system, Property {number}: {property_text}**
// **Validates: Requirements X.Y**
```
