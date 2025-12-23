# Design Document

## Overview

Este diseño aborda los problemas críticos de visualización de datos en el frontend de Cobblemon Los Pitufos. La solución se centra en hacer el código más robusto mediante validación defensiva, manejo seguro de propiedades opcionales, y generación de datos por defecto cuando sea necesario.

## Architecture

La arquitectura de la solución se basa en tres capas de defensa:

1. **Capa de API Client**: Validación y normalización de datos al recibirlos del backend
2. **Capa de Componentes**: Validación de props y uso de valores por defecto
3. **Capa de Renderizado**: Optional chaining y arrays vacíos como fallback

```
Backend API
    ↓
API Client (validación + normalización)
    ↓
React Components (validación de props)
    ↓
Render (optional chaining + fallbacks)
    ↓
User Interface
```

## Components and Interfaces

### 1. API Client Enhancement

El `api-client.ts` será mejorado para normalizar los datos de starters:

```typescript
interface StarterResponse {
  starters: Starter[];
  byGeneration?: Record<number, Starter[]>;
  stats?: {
    total: number;
    claimed: number;
    available: number;
  };
}

function normalizeStarter(starter: any): Starter {
  // Asegurar que todas las propiedades requeridas existen
  // Generar sprites por defecto si no existen
  // Proporcionar arrays vacíos para propiedades opcionales
}
```

### 2. StarterCard Component

El componente `StarterCard` será refactorizado para:
- Validar props al inicio
- Usar optional chaining para todas las propiedades anidadas
- Proporcionar arrays vacíos como fallback
- Mostrar mensajes de error amigables para datos inválidos

### 3. Page Components (Galería y Pokédex)

Las páginas serán actualizadas para:
- Validar la respuesta del API antes de usar los datos
- Manejar casos donde `data.starters` sea undefined
- Usar operadores de coalescencia nula (`??`) para valores por defecto
- Filtrar de forma segura usando optional chaining

## Data Models

### Starter Data Flow

```typescript
// Backend Response
{
  starters: Starter[],  // Puede ser undefined
  stats: { ... }        // Puede ser undefined
}

// Normalized in API Client
{
  starters: Starter[],  // Siempre array (vacío si no hay datos)
  stats: {
    total: 27,
    claimed: number,
    available: number
  }
}

// Component State
{
  starters: Starter[],  // Siempre array
  loading: boolean,
  error: string | null
}
```

### Starter Object Structure

```typescript
interface Starter {
  pokemonId: number;
  name: string;
  nameEs: string;
  types: string[];           // Siempre array (puede estar vacío)
  stats: StarterStats;       // Siempre objeto
  abilities: Ability[];      // Siempre array (puede estar vacío)
  signatureMoves: Move[];    // Siempre array (puede estar vacío)
  evolutions: Evolution[];   // Siempre array (puede estar vacío)
  sprites: Sprites;          // Siempre objeto con URLs
  isClaimed: boolean;
  claimedBy?: string;
  claimedAt?: string;
  isShiny?: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Data normalization preserves count
*For any* API response containing starters, normalizing the data should result in exactly 27 starters with all required properties defined
**Validates: Requirements 1.1, 4.1**

### Property 2: Safe data access never throws
*For any* starter object (including those with undefined or null properties), accessing nested properties with optional chaining and iterating over arrays should never throw an error
**Validates: Requirements 1.2, 1.4, 2.2, 2.4, 3.1, 3.2**

### Property 3: Sprite URLs are always valid
*For any* starter with a pokemonId, the normalized starter should have valid sprite URLs (non-empty strings following the expected format) even if the original data lacks them
**Validates: Requirements 1.3**

### Property 4: Filtering operations are safe and correct
*For any* filter operation (by generation, type, name, or availability) on an array of starters (including starters with undefined properties), the operation should complete without errors and return only starters matching the filter criteria
**Validates: Requirements 2.1, 5.1, 5.2, 5.3, 5.4**

### Property 5: Statistics calculation is consistent
*For any* set of starters with claimed status, the calculated statistics should satisfy: claimed + available = total (27), and the progress percentage should equal (claimed / 27) * 100
**Validates: Requirements 4.2, 4.3, 4.4**

### Property 6: Component renders without errors
*For any* starter object (valid or invalid), the StarterCard component should render either the starter content or an error message, but never throw an unhandled error
**Validates: Requirements 2.3, 3.3, 3.4**

## Error Handling

### API Client Level

```typescript
try {
  const response = await fetch(endpoint);
  const data = await response.json();
  
  // Validar y normalizar
  if (!data || !Array.isArray(data.starters)) {
    console.error('[API] Invalid response:', data);
    return { starters: [], stats: { total: 27, claimed: 0, available: 27 } };
  }
  
  return normalizeResponse(data);
} catch (error) {
  console.error('[API] Request failed:', error);
  throw new Error('Error al cargar datos del servidor');
}
```

### Component Level

```typescript
// Validación de props
if (!starter || !starter.pokemonId) {
  return <ErrorDisplay message="Datos de Pokémon inválidos" />;
}

// Safe array access
const types = starter.types ?? [];
const abilities = starter.abilities ?? [];
```

### Render Level

```typescript
// Optional chaining + fallback
{starter.abilities?.map(ability => ...) ?? <EmptyState />}

// Nullish coalescing
const displayName = starter.nameEs ?? starter.name ?? 'Desconocido';
```

## Testing Strategy

### Unit Tests

1. **API Client Tests**
   - Test normalizeStarter with complete data
   - Test normalizeStarter with missing sprites
   - Test normalizeStarter with undefined arrays
   - Test API response with invalid data

2. **Component Tests**
   - Test StarterCard with complete data
   - Test StarterCard with missing optional properties
   - Test StarterCard with undefined arrays
   - Test error state rendering

3. **Page Tests**
   - Test Galería with empty starters array
   - Test Pokédex with all 27 starters
   - Test filtering with undefined properties
   - Test statistics calculation

### Property-Based Tests

Property-based tests will use `fast-check` library for TypeScript/JavaScript. Each test will run a minimum of 100 iterations.

1. **Property Test: Data Normalization**
   - Generate random starter objects with missing properties
   - Verify normalization always produces valid Starter objects
   - Verify no undefined errors occur

2. **Property Test: Safe Array Operations**
   - Generate random starter objects
   - Verify all array operations complete without errors
   - Verify results are always arrays

3. **Property Test: Sprite URL Generation**
   - Generate random pokemonIds
   - Verify sprite URLs are always valid strings
   - Verify URLs follow expected format

4. **Property Test: Filter Operations**
   - Generate random arrays of starters
   - Apply various filters
   - Verify filtered results maintain data integrity

5. **Property Test: Statistics Consistency**
   - Generate random sets of starters with claimed status
   - Calculate statistics
   - Verify claimed + available = total

## Implementation Notes

### Priority Order

1. Fix API client to normalize data (highest priority - prevents all downstream errors)
2. Fix StarterCard component to handle undefined safely
3. Fix Galería page filtering
4. Fix Pokédex page filtering
5. Add comprehensive error boundaries

### Backward Compatibility

All changes maintain backward compatibility with existing backend API. The normalization layer ensures the frontend works even if backend data structure changes slightly.

### Performance Considerations

- Normalization happens once when data is received
- No performance impact on rendering
- Memoization can be added if needed for expensive calculations

### Browser Compatibility

- Optional chaining (`?.`) is supported in all modern browsers
- Nullish coalescing (`??`) is supported in all modern browsers
- No polyfills needed for target browsers
