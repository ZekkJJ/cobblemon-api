# Documento de Diseño - Frontend Cobblemon Los Pitufos

## Visión General

Este documento describe el diseño técnico del frontend de la plataforma Cobblemon Los Pitufos. El frontend es una aplicación Next.js 14 completamente nueva que consumirá exclusivamente el backend API ubicado en `backend/`.

**Características clave:**
- Proyecto nuevo en carpeta `frontend/` (separado del código actual)
- Next.js 14 con App Router y TypeScript
- Sin funciones serverless (no carpeta `src/app/api/`)
- Todas las llamadas van al backend Express
- Deploy separado en Vercel
- Replica EXACTAMENTE el diseño y funcionalidad del frontend actual

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      USUARIO (Navegador)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js 14)                          │
│                   Carpeta: frontend/                             │
│                   Deploy: Vercel                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Pages (App Router)                     │   │
│  │  - / (Gacha)                                             │   │
│  │  - /tienda                                               │   │
│  │  - /jugadores, /jugadores/[uuid]                         │   │
│  │  - /galeria                                              │   │
│  │  - /torneos                                              │   │
│  │  - /servidor                                             │   │
│  │  - /pokedex, /comparador, /verificar                     │   │
│  │  - /admin/* (protegidas)                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Components                             │   │
│  │  - Navbar, StarterCard, MusicPlayer                      │   │
│  │  - ServerIndicator, TournamentTicker                     │   │
│  │  - SoulDrivenQuestionnaire                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Client                             │   │
│  │  - Centraliza todas las llamadas HTTP al backend         │   │
│  │  - Manejo de errores unificado                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ HTTP/JSON (NEXT_PUBLIC_API_URL)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND API (Express)                          │
│                   Carpeta: backend/                              │
│                   Puerto: 4000                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes e Interfaces

### Estructura de Carpetas

```
/frontend
├── public/
│   ├── background-music.mp3
│   └── pokeballs/
│       └── *.png (sprites de pokéballs)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Gacha)
│   │   ├── globals.css
│   │   ├── tienda/
│   │   │   └── page.tsx
│   │   ├── jugadores/
│   │   │   ├── page.tsx
│   │   │   └── [uuid]/
│   │   │       └── page.tsx
│   │   ├── galeria/
│   │   │   └── page.tsx
│   │   ├── torneos/
│   │   │   └── page.tsx
│   │   ├── servidor/
│   │   │   └── page.tsx
│   │   ├── pokedex/
│   │   │   └── page.tsx
│   │   ├── comparador/
│   │   │   └── page.tsx
│   │   ├── verificar/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── players/
│   │       ├── tournaments/
│   │       └── level-caps/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── StarterCard.tsx
│   │   ├── MusicPlayer.tsx
│   │   ├── ServerIndicator.tsx
│   │   ├── ServerStatus.tsx
│   │   ├── TournamentTicker.tsx
│   │   ├── SoulDrivenQuestionnaire.tsx
│   │   └── Providers.tsx
│   └── lib/
│       ├── api-client.ts (CLAVE: todas las llamadas al backend)
│       ├── sounds.ts
│       ├── starters-data.ts
│       ├── pokeballs-data.ts
│       ├── type-chart.ts
│       └── types/
│           ├── pokemon.ts
│           └── level-caps.ts
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```


### API Client (`src/lib/api-client.ts`)

El API Client es el componente MÁS IMPORTANTE del frontend. Centraliza todas las llamadas HTTP al backend.

```typescript
// Configuración base
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Función helper para fetch con manejo de errores
async function apiCall(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la solicitud');
  }
  
  return response.json();
}

// Módulos del API Client
export const authAPI = {
  getDiscordAuthUrl: () => apiCall('/api/auth/discord'),
  handleCallback: (code: string) => apiCall(`/api/auth/callback?code=${code}`),
  verifyUsername: (data) => apiCall('/api/auth/verify-username', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const gachaAPI = {
  getStatus: (discordId: string) => apiCall(`/api/gacha/status?discordId=${discordId}`),
  roll: (data) => apiCall('/api/gacha/roll', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  soulDriven: (data) => apiCall('/api/gacha/soul-driven', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const shopAPI = {
  getStock: () => apiCall('/api/shop/stock'),
  getBalance: (uuid: string) => apiCall(`/api/shop/balance?uuid=${uuid}`),
  purchase: (data) => apiCall('/api/shop/purchase', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPurchases: (uuid: string) => apiCall(`/api/shop/purchases?uuid=${uuid}`),
  claimPurchase: (data) => apiCall('/api/shop/claim', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const playersAPI = {
  getAll: () => apiCall('/api/players'),
  getByUuid: (uuid: string) => apiCall(`/api/players/${uuid}`),
  getByDiscordId: (discordId: string) => apiCall(`/api/players?discordId=${discordId}`),
};

export const tournamentsAPI = {
  getAll: () => apiCall('/api/tournaments'),
  getById: (id: string) => apiCall(`/api/tournaments/${id}`),
};

export const startersAPI = {
  getAll: () => apiCall('/api/gacha/starters'),
};

export const verificationAPI = {
  generate: (uuid: string) => apiCall('/api/verification/generate', {
    method: 'POST',
    body: JSON.stringify({ uuid }),
  }),
  verify: (data) => apiCall('/api/verification/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const serverAPI = {
  getStatus: () => apiCall('/api/server-status'),
};
```

## Modelos de Datos

### User (almacenado en localStorage)

```typescript
interface LocalUser {
  discordId: string;
  discordUsername: string;
  nickname?: string;
  avatar?: string;
  minecraftUuid?: string;
  isMinecraftVerified?: boolean;
}
```

### Starter

```typescript
interface Starter {
  pokemonId: number;
  name: string;
  nameEs: string;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  abilities: Array<{
    name: string;
    description: string;
    isHidden: boolean;
  }>;
  signatureMoves: Array<{
    name: string;
    type: string;
    power: number;
    accuracy: number;
  }>;
  evolutions: Array<{
    name: string;
    level?: number;
    method: string;
  }>;
  description: string;
  height: number;
  weight: number;
  sprites: {
    normal: string;
    shiny: string;
    animated: string;
    animatedShiny: string;
    cry: string;
  };
  isClaimed: boolean;
  claimedBy?: string;
  claimedAt?: string;
  isShiny?: boolean;
}
```

### Pokemon (en equipo/PC)

```typescript
interface Pokemon {
  species: string;
  speciesId: number;
  level: number;
  experience: number;
  shiny: boolean;
  gender: string;
  nature: string;
  ability: string;
  friendship: number;
  ball: string;
  ivs: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  evs: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  moves: string[];
  heldItem?: string;
  currentHealth: number;
  maxHealth: number;
  status?: string;
}
```

### PlayerSummary

```typescript
interface PlayerSummary {
  uuid: string;
  username: string;
  totalPokemon: number;
  shinies: number;
  starter?: {
    id: number;
    name: string;
    isShiny: boolean;
  };
  partyPreview: Array<{
    species: string;
    speciesId: number;
    level: number;
    shiny: boolean;
  }>;
}
```

### Ball (Pokéball)

```typescript
interface Ball {
  id: string;
  name: string;
  type: string;
  catchRate: number;
  basePrice: number;
  currentPrice: number;
  description: string;
  sprite: string;
  currentStock: number;
  maxStock: number;
}
```

### Tournament

```typescript
interface Tournament {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  status: 'upcoming' | 'active' | 'completed';
  maxParticipants: number;
  participants: string[];
  prizes?: string;
}
```


## Páginas y Componentes Principales

### 1. Página Principal - Gacha (`src/app/page.tsx`)

**Responsabilidades:**
- Mostrar máquina gacha estilizada
- Manejar autenticación (Discord OAuth y username)
- Permitir tirada clásica o Soul Driven
- Mostrar resultado de tirada con animación
- Mostrar sección de verificación de Minecraft

**Estados:**
- `localUser`: Usuario autenticado (de localStorage)
- `rollResult`: Starter obtenido
- `userStatus`: Estado de tirada del usuario (canRoll, availableCount, etc.)
- `isRolling`: Animación de tirada en progreso
- `gachaMode`: 'classic' | 'soul-driven'
- `showQuestionnaire`: Mostrar cuestionario Soul Driven
- `verifyCode`: Código de verificación de Minecraft

**Flujo:**
1. Cargar usuario de localStorage
2. Si está autenticado, verificar estado con `gachaAPI.getStatus()`
3. Si puede hacer tirada, mostrar botón habilitado
4. Al hacer tirada, llamar a `gachaAPI.roll()` o `gachaAPI.soulDriven()`
5. Mostrar animación y resultado

### 2. Navbar (`src/components/Navbar.tsx`)

**Responsabilidades:**
- Navegación entre páginas
- Mostrar estado de autenticación
- Toggle de efectos de sonido
- Indicador de estado del servidor
- Responsive con menú hamburguesa

**Props:** Ninguna (usa localStorage para usuario)

**Estados:**
- `localUser`: Usuario autenticado
- `menuOpen`: Menú móvil abierto/cerrado
- `sfxMuted`: Sonidos silenciados

### 3. StarterCard (`src/components/StarterCard.tsx`)

**Responsabilidades:**
- Mostrar información completa de un starter
- Diseño de tarjeta de Pokémon
- Indicar si es shiny

**Props:**
```typescript
interface StarterCardProps {
  starter: Starter;
  isShiny: boolean;
  size?: 'normal' | 'full';
}
```

**Diseño:**
- Sprite animado grande
- Tipos con badges de colores
- Stats en barras visuales
- Habilidades y movimientos característicos
- Cadena evolutiva
- Descripción

### 4. SoulDrivenQuestionnaire (`src/components/SoulDrivenQuestionnaire.tsx`)

**Responsabilidades:**
- Mostrar cuestionario de 5 preguntas
- Recopilar respuestas del usuario
- Enviar respuestas al backend

**Props:**
```typescript
interface QuestionnaireProps {
  onSubmit: (answers: string[]) => void;
  isLoading: boolean;
}
```

**Preguntas:**
1. ¿Qué valoras más en un compañero?
2. ¿Cómo enfrentas los desafíos?
3. ¿Qué ambiente prefieres?
4. ¿Cuál es tu estilo de batalla?
5. ¿Qué te describe mejor?

### 5. MusicPlayer (`src/components/MusicPlayer.tsx`)

**Responsabilidades:**
- Reproducir música de fondo (Littleroot Town)
- Visualizador de audio con canvas
- Controles de volumen y mute
- Guardar preferencias en localStorage

**Estados:**
- `isPlaying`: Música reproduciéndose
- `isMuted`: Música silenciada
- `volume`: Nivel de volumen (0-1)
- `showControls`: Mostrar controles al hover

**Tecnologías:**
- Web Audio API para visualizador
- Canvas para barras de frecuencia
- localStorage para persistencia

### 6. ServerIndicator (`src/components/ServerIndicator.tsx`)

**Responsabilidades:**
- Mostrar estado del servidor de forma compacta
- Indicador visual (verde/rojo)
- Cantidad de jugadores online

**Actualización:** Cada 30 segundos

### 7. TournamentTicker (`src/components/TournamentTicker.tsx`)

**Responsabilidades:**
- Mostrar ticker animado con torneos activos
- Scroll horizontal automático
- Información resumida de torneos

### 8. Página de Tienda (`src/app/tienda/page.tsx`)

**Responsabilidades:**
- Mostrar catálogo de Pokéballs
- Mostrar balance del usuario
- Permitir compras
- Filtros y búsqueda

**Estados:**
- `balls`: Catálogo de Pokéballs
- `balance`: Balance de CobbleDollars
- `quantities`: Cantidades seleccionadas por ball
- `purchasing`: ID de ball siendo comprada
- `nextRefresh`: Timestamp de próxima actualización

**Flujo:**
1. Cargar stock con `shopAPI.getStock()`
2. Cargar balance con `shopAPI.getBalance(uuid)`
3. Usuario selecciona cantidad y hace clic en comprar
4. Llamar a `shopAPI.purchase()`
5. Actualizar balance y stock

### 9. Página de Jugadores (`src/app/jugadores/page.tsx`)

**Responsabilidades:**
- Listar todos los jugadores
- Búsqueda y ordenamiento
- Preview de equipos
- Estadísticas globales

**Estados:**
- `players`: Lista de jugadores
- `searchTerm`: Término de búsqueda
- `sortBy`: Criterio de ordenamiento

### 10. Página de Perfil (`src/app/jugadores/[uuid]/page.tsx`)

**Responsabilidades:**
- Mostrar perfil completo de un jugador
- Equipo actual (party)
- PC Storage (primeras 2 cajas)
- Estadísticas detalladas

**Parámetros:** `uuid` del jugador

**Secciones:**
- Header con nombre y stats generales
- Tabs: Equipo, PC, Estadísticas
- Cada Pokémon con stats completos

### 11. Página de Galería (`src/app/galeria/page.tsx`)

**Responsabilidades:**
- Mostrar starters reclamados
- Estadísticas de progreso
- Modal con detalle de starter

**Estados:**
- `claimed`: Starters reclamados
- `selectedStarter`: Starter seleccionado para modal

### 12. Página de Torneos (`src/app/torneos/page.tsx`)

**Responsabilidades:**
- Listar torneos por estado
- Información de cada torneo
- Indicadores visuales por estado

**Secciones:**
- En Curso (active)
- Próximamente (upcoming)
- Historial (completed)

### 13. Página de Servidor (`src/app/servidor/page.tsx`)

**Responsabilidades:**
- Estado detallado del servidor
- Lista de jugadores conectados
- IP copiable
- Instrucciones de conexión

**Componente principal:** `ServerStatus`

## Manejo de Errores

### Estrategia de Manejo de Errores

1. **API Client:** Captura errores HTTP y lanza excepciones con mensajes descriptivos
2. **Componentes:** Usan try-catch para capturar errores del API Client
3. **UI:** Muestra mensajes de error amigables al usuario
4. **Estados de carga:** Spinners y estados disabled durante operaciones

**Ejemplo:**
```typescript
try {
  const data = await gachaAPI.roll({ discordId, discordUsername });
  setRollResult(data.starter);
} catch (error) {
  setError(error.message || 'Error al hacer la tirada');
}
```

### Mensajes de Error Amigables

- "Error al conectar con el servidor" → Problema de red
- "No tienes suficiente balance" → Validación de negocio
- "Ya has hecho tu tirada" → Validación de estado
- "Código inválido" → Validación de input

## Estrategia de Testing

### Unit Tests

**Herramienta:** Vitest + React Testing Library

**Componentes a testear:**
- `api-client.ts`: Verificar que construye URLs correctamente y maneja errores
- `StarterCard`: Renderiza correctamente con diferentes props
- `SoulDrivenQuestionnaire`: Recopila respuestas correctamente
- `Navbar`: Muestra/oculta elementos según estado de autenticación

**Ejemplo:**
```typescript
describe('API Client', () => {
  it('should construct correct URL for gacha roll', () => {
    const url = constructUrl('/api/gacha/roll');
    expect(url).toBe('http://localhost:4000/api/gacha/roll');
  });
  
  it('should throw error on failed request', async () => {
    await expect(gachaAPI.roll({})).rejects.toThrow();
  });
});
```

### Integration Tests

**Escenarios:**
- Usuario completa flujo de gacha (login → roll → ver resultado)
- Usuario compra Pokéballs (ver catálogo → seleccionar → comprar)
- Usuario navega entre páginas

### E2E Tests (Opcional)

**Herramienta:** Playwright

**Escenarios críticos:**
- Flujo completo de gacha
- Flujo completo de compra en tienda


## Diseño Visual y Estilos

### Sistema de Colores

```css
/* Tema oscuro base */
--bg-primary: #0f172a;      /* slate-900 */
--bg-secondary: #1e293b;    /* slate-800 */
--bg-tertiary: #334155;     /* slate-700 */

/* Colores Pokémon */
--red-primary: #EF4444;     /* red-500 - Acciones principales */
--red-dark: #991B1B;        /* red-900 - Sombras */
--blue-primary: #3B82F6;    /* blue-500 - Información */
--yellow-primary: #EAB308;  /* yellow-500 - Shinies */
--purple-primary: #A855F7;  /* purple-500 - Soul Driven */
--green-primary: #10B981;   /* green-500 - Éxito */

/* Tipos de Pokémon */
--type-grass: #78C850;
--type-fire: #F08030;
--type-water: #6890F0;
--type-electric: #F8D030;
--type-psychic: #F85888;
--type-normal: #A8A878;
/* ... más tipos */
```

### Efectos Visuales

**Glass Morphism:**
```css
.glass-dark {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Glow Effects:**
```css
.glow-green {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
}

.glow-red {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
}
```

**Animaciones:**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px) rotate(-5deg); }
  75% { transform: translateX(5px) rotate(5deg); }
}

@keyframes flash {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.animate-shake {
  animation: shake 0.5s infinite;
}
```

### Responsive Design

**Breakpoints:**
- Mobile: 320px - 640px
- Tablet: 640px - 1024px
- Desktop: 1024px+

**Estrategia:**
- Mobile-first approach
- Grid layouts con Tailwind
- Menú hamburguesa en móviles
- Tarjetas apiladas en móviles, grid en desktop

### Tipografía

**Fuentes:**
- Principal: Inter (Next.js default)
- Títulos retro: "pixel-font" (custom font)

**Tamaños:**
```css
.text-xs: 0.75rem;    /* 12px */
.text-sm: 0.875rem;   /* 14px */
.text-base: 1rem;     /* 16px */
.text-lg: 1.125rem;   /* 18px */
.text-xl: 1.25rem;    /* 20px */
.text-2xl: 1.5rem;    /* 24px */
.text-4xl: 2.25rem;   /* 36px */
```

## Optimización y Performance

### Estrategias de Optimización

1. **Lazy Loading de Imágenes:**
```typescript
<img 
  src={pokemonSprite} 
  loading="lazy" 
  alt={pokemonName}
/>
```

2. **Next.js Image Optimization:**
```typescript
import Image from 'next/image';

<Image 
  src={sprite} 
  width={96} 
  height={96} 
  alt={name}
/>
```

3. **Memoización de Componentes:**
```typescript
const StarterCard = React.memo(({ starter, isShiny }) => {
  // ...
});
```

4. **useMemo para Cálculos Costosos:**
```typescript
const filteredPlayers = useMemo(() => {
  return players
    .filter(p => p.username.includes(searchTerm))
    .sort((a, b) => b.totalPokemon - a.totalPokemon);
}, [players, searchTerm]);
```

5. **Debounce en Búsquedas:**
```typescript
const debouncedSearch = useMemo(
  () => debounce((term) => setSearchTerm(term), 300),
  []
);
```

### Caching

**localStorage:**
- Usuario autenticado
- Preferencias de sonido/música
- Última actualización de stock

**React Query (Opcional):**
- Cache de datos del servidor
- Revalidación automática
- Optimistic updates

## Seguridad

### Consideraciones de Seguridad

1. **No almacenar tokens sensibles:** Solo datos públicos en localStorage
2. **HTTPS en producción:** Vercel lo maneja automáticamente
3. **Validación de inputs:** Antes de enviar al backend
4. **Sanitización de HTML:** Usar `dangerouslySetInnerHTML` solo cuando sea necesario
5. **CORS:** Configurado en el backend para permitir solo el dominio del frontend

### Variables de Entorno

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000

# .env.production
NEXT_PUBLIC_API_URL=https://api.cobblemon.com
```

**Importante:** Solo variables con prefijo `NEXT_PUBLIC_` son accesibles en el cliente.

## Deployment

### Configuración de Vercel

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  }
}
```

### Pasos de Deployment

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd frontend
vercel --prod
```

4. **Configurar variables de entorno en Vercel Dashboard:**
- `NEXT_PUBLIC_API_URL`: URL del backend en producción

### Build Optimization

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
    ],
  },
  // Optimizaciones
  swcMinify: true,
  compress: true,
};

module.exports = nextConfig;
```

## Flujos de Usuario Principales

### Flujo 1: Obtener Starter (Gacha Clásico)

```
1. Usuario visita /
2. Si no está autenticado:
   a. Hace clic en "Iniciar con Discord"
   b. Redirige a backend /api/auth/discord
   c. Backend redirige a Discord OAuth
   d. Discord redirige de vuelta a backend /api/auth/callback
   e. Backend redirige a frontend /auth/callback?user=...
   f. Frontend guarda usuario en localStorage
3. Frontend verifica estado con GET /api/gacha/status?discordId=X
4. Si puede hacer tirada:
   a. Usuario hace clic en "INVOCAR"
   b. Frontend muestra animación de tirada
   c. Frontend llama a POST /api/gacha/roll
   d. Backend selecciona starter aleatorio y actualiza DB
   e. Backend retorna starter
   f. Frontend muestra flash y reproduce cry
   g. Frontend muestra StarterCard con resultado
5. Usuario ve su starter y no puede hacer otra tirada
```

### Flujo 2: Obtener Starter (Soul Driven)

```
1-3. Igual que flujo 1
4. Usuario selecciona modo "Soul Driven"
5. Frontend muestra cuestionario de 5 preguntas
6. Usuario responde las 5 preguntas
7. Usuario hace clic en "COMENZAR"
8. Frontend muestra animación de tirada
9. Frontend llama a POST /api/gacha/soul-driven con respuestas
10. Backend usa IA para analizar personalidad
11. Backend selecciona starter compatible
12. Backend retorna starter
13. Frontend muestra resultado igual que flujo 1
```

### Flujo 3: Comprar Pokéballs

```
1. Usuario visita /tienda
2. Frontend carga stock con GET /api/shop/stock
3. Frontend carga balance con GET /api/shop/balance?uuid=X
   (Nota: UUID viene de los datos del usuario si está verificado)
4. Usuario ve catálogo de Pokéballs con precios dinámicos
5. Usuario selecciona cantidad con +/- o input
6. Usuario hace clic en "COMPRAR"
7. Frontend valida que tenga suficiente balance
8. Frontend llama a POST /api/shop/purchase
9. Backend valida stock y balance
10. Backend descuenta balance, reduce stock, crea registro de compra
11. Backend retorna nuevo balance
12. Frontend actualiza balance y stock en UI
13. Frontend muestra mensaje de éxito
```

### Flujo 4: Verificar Minecraft

```
1. Usuario entra al servidor de Minecraft
2. Plugin detecta que no está verificado
3. Plugin genera código de 5 dígitos
4. Plugin llama a POST /api/verification/generate
5. Backend guarda código asociado al UUID
6. Plugin muestra código en chat de Minecraft
7. Usuario ingresa código en la web (página principal o /verificar)
8. Frontend llama a POST /api/verification/verify
9. Backend valida código y vincula Discord ID con UUID
10. Backend marca usuario como verificado
11. Frontend muestra mensaje de éxito
12. Usuario puede moverse en el servidor
```

### Flujo 5: Ver Perfil de Jugador

```
1. Usuario visita /jugadores
2. Frontend carga lista con GET /api/players
3. Usuario hace clic en una tarjeta de jugador
4. Frontend navega a /jugadores/[uuid]
5. Frontend carga perfil con GET /api/players/:uuid
6. Backend retorna:
   - Datos del jugador
   - Equipo actual (party)
   - PC Storage (primeras 2 cajas)
   - Starter del gacha
   - Balance de CobbleDollars
7. Frontend muestra perfil con tabs:
   - Equipo: 6 Pokémon con stats completos
   - PC: Primeras 2 cajas (60 Pokémon)
   - Estadísticas: Balance, total Pokémon, shinies
```

## Notas de Implementación

### Prioridades de Desarrollo

**Fase 1 - Core (MVP):**
1. Setup del proyecto Next.js
2. API Client
3. Navbar y Layout
4. Página principal (Gacha)
5. StarterCard component
6. Autenticación básica

**Fase 2 - Funcionalidades Principales:**
7. Página de Tienda
8. Página de Jugadores
9. Página de Perfil de Jugador
10. Página de Galería

**Fase 3 - Funcionalidades Secundarias:**
11. Página de Torneos
12. Página de Servidor
13. Soul Driven Questionnaire
14. MusicPlayer y efectos de sonido

**Fase 4 - Pulido:**
15. Animaciones y transiciones
16. Optimizaciones de performance
17. Testing
18. Deployment

### Dependencias Principales

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

### Consideraciones Especiales

1. **Sprites de Pokémon:**
   - Gen 1-5: GIFs animados de PokeAPI
   - Gen 6-9: Sprites estáticos de Showdown
   - Fallback a sprite estático si GIF no carga

2. **Sonidos:**
   - Cries de Pokémon desde PokeAPI
   - Efectos de sonido locales (click, confirm, cancel)
   - Música de fondo local (Littleroot Town)

3. **Idioma:**
   - Todo en español
   - Fechas formateadas con `toLocaleDateString('es-ES')`
   - Números formateados con `toLocaleString()`

4. **Compatibilidad:**
   - Navegadores modernos (Chrome, Firefox, Safari, Edge)
   - No soporte para IE11
   - Progressive enhancement para funciones avanzadas (Web Audio API)
