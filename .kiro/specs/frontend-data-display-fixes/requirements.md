# Requirements Document

## Introduction

El frontend de Cobblemon Los Pitufos está experimentando problemas críticos al mostrar los datos de starters. Los usuarios reportan que solo se muestran 15 starters en lugar de los 27 disponibles, y hay errores de JavaScript relacionados con propiedades indefinidas. Este documento define los requisitos para corregir estos problemas de visualización y manejo de datos.

## Glossary

- **Frontend**: La aplicación Next.js que se ejecuta en el navegador del usuario
- **Starter**: Un Pokémon inicial que los jugadores pueden reclamar
- **API Client**: El módulo que maneja las comunicaciones con el backend
- **StarterCard**: Componente React que muestra la información de un starter
- **Galería**: Página que muestra los starters reclamados
- **Pokédex**: Página que muestra todos los starters disponibles

## Requirements

### Requirement 1

**User Story:** Como usuario, quiero ver todos los 27 starters disponibles en el Pokédex, para poder explorar todas las opciones.

#### Acceptance Criteria

1. WHEN el usuario accede a la página del Pokédex THEN el sistema SHALL mostrar los 27 starters completos
2. WHEN el sistema recibe datos del backend THEN el sistema SHALL validar que la propiedad `starters` existe antes de procesarla
3. WHEN un starter no tiene sprites definidos THEN el sistema SHALL generar URLs de sprites por defecto basadas en el pokemonId
4. WHEN el sistema procesa la respuesta del API THEN el sistema SHALL manejar casos donde `data.starters` sea undefined o null

### Requirement 2

**User Story:** Como usuario, quiero que la galería muestre correctamente los starters reclamados sin errores de JavaScript, para tener una experiencia fluida.

#### Acceptance Criteria

1. WHEN el usuario accede a la galería THEN el sistema SHALL filtrar solo los starters con `isClaimed: true` de forma segura
2. WHEN un starter tiene propiedades undefined THEN el sistema SHALL usar valores por defecto en lugar de causar errores
3. WHEN el componente StarterCard renderiza un starter THEN el sistema SHALL validar que todas las propiedades requeridas existen
4. WHEN se hace `.map()` sobre arrays de propiedades THEN el sistema SHALL verificar que el array existe y no es undefined

### Requirement 3

**User Story:** Como desarrollador, quiero que el código maneje datos incompletos de forma robusta, para evitar errores en producción.

#### Acceptance Criteria

1. WHEN el sistema accede a propiedades anidadas THEN el sistema SHALL usar optional chaining (`?.`) para evitar errores
2. WHEN el sistema itera sobre arrays THEN el sistema SHALL proporcionar arrays vacíos como fallback
3. WHEN el StarterCard recibe datos inválidos THEN el sistema SHALL mostrar un mensaje de error amigable
4. WHEN el API devuelve una respuesta inesperada THEN el sistema SHALL registrar el error en la consola y mostrar un estado de error al usuario

### Requirement 4

**User Story:** Como usuario, quiero que las estadísticas de starters se muestren correctamente, para entender el progreso de la comunidad.

#### Acceptance Criteria

1. WHEN el sistema calcula estadísticas THEN el sistema SHALL contar correctamente los 27 starters totales
2. WHEN el sistema muestra starters reclamados THEN el sistema SHALL mostrar el conteo correcto basado en `isClaimed`
3. WHEN el sistema calcula starters disponibles THEN el sistema SHALL restar correctamente los reclamados del total
4. WHEN el sistema muestra el progreso THEN el sistema SHALL calcular el porcentaje basado en 27 starters totales

### Requirement 5

**User Story:** Como usuario, quiero que los filtros del Pokédex funcionen correctamente con todos los 27 starters, para encontrar fácilmente lo que busco.

#### Acceptance Criteria

1. WHEN el usuario filtra por generación THEN el sistema SHALL incluir todos los starters de esa generación
2. WHEN el usuario filtra por tipo THEN el sistema SHALL verificar que `starter.types` existe antes de filtrar
3. WHEN el usuario busca por nombre THEN el sistema SHALL verificar que `starter.name` y `starter.nameEs` existen
4. WHEN el usuario filtra por disponibilidad THEN el sistema SHALL verificar correctamente el estado `isClaimed`
