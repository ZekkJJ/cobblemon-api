# Documento de Requisitos - Cobblemon Los Pitufos (Reconstrucción)

## Introducción

Este documento define los requisitos para la reconstrucción completa de la plataforma web "Cobblemon Los Pitufos", un sistema de gestión para un servidor de Minecraft con el mod Cobblemon. El proyecto se dividirá en dos partes separadas: un backend API y un frontend web, manteniendo compatibilidad total con la base de datos MongoDB existente y el plugin de Minecraft actual.

La plataforma permite a los jugadores:
- Obtener un Pokémon inicial único mediante un sistema gacha
- Verificar su cuenta de Minecraft con Discord
- Comprar Pokéballs en una tienda con stock dinámico
- Ver perfiles de jugadores y sus equipos Pokémon
- Participar en torneos
- Consultar información del servidor

## Glosario

- **Sistema**: La plataforma Cobblemon Los Pitufos (backend + frontend)
- **Jugador**: Usuario que juega en el servidor de Minecraft
- **Starter/Inicial**: Pokémon inicial único que cada jugador puede obtener una sola vez. Existe exactamente 1 de cada uno de los 27 starters oficiales (Gen 1-9). Una vez reclamado, nadie más puede obtenerlo.
- **Gacha**: Sistema de sorteo aleatorio para obtener el Pokémon inicial
- **Shiny**: Variante rara de un Pokémon con coloración especial (1% probabilidad)
- **CobbleDollars**: Moneda virtual del servidor de Minecraft
- **Level Cap**: Límite de nivel máximo para captura/posesión de Pokémon
- **UUID**: Identificador único de jugador de Minecraft
- **Discord ID**: Identificador único de usuario de Discord
- **Verificación**: Proceso de vincular cuenta de Minecraft con Discord
- **Soul Driven**: Modo de gacha que usa un cuestionario de personalidad para mapear respuestas a tipos de Pokémon y seleccionar un starter compatible de los disponibles

## Estados del Jugador

El flujo de un jugador nuevo sigue estos estados:

1. **Sin cuenta**: No ha iniciado sesión
2. **Autenticado**: Pasó por OAuth de Discord (hasDiscordAccount: true)
3. **Con starter**: Hizo su tirada (hasRolledStarter: true, starterId: X, starterIsShiny: boolean)
4. **Verificado**: Vinculó su cuenta de Minecraft (isMinecraftVerified: true, minecraftUuid: "...")
5. **Starter entregado**: El plugin le dio el Pokémon en el juego (starterGiven: true)

## Requisitos

### Requisito 1: Arquitectura del Proyecto

**Historia de Usuario:** Como desarrollador, quiero tener el backend y frontend separados, para que el código sea más mantenible y escalable.

#### Criterios de Aceptación

1. THE Sistema SHALL organizar el código en dos proyectos separados: `/backend` para la API y `/frontend` para la interfaz web
2. THE Backend SHALL exponer una API REST en Node.js/Express con TypeScript
3. THE Frontend SHALL ser una aplicación Next.js 14 con App Router y TypeScript
4. THE Sistema SHALL mantener compatibilidad con la base de datos MongoDB existente sin modificar la estructura de datos
5. THE Backend SHALL implementar los mismos endpoints que el sistema actual para mantener compatibilidad con el plugin de Minecraft

### Requisito 2: Sistema de Autenticación

**Historia de Usuario:** Como jugador, quiero iniciar sesión con mi cuenta de Discord, para que mi progreso esté vinculado a mi identidad.

#### Criterios de Aceptación

1. WHEN un usuario inicia sesión con Discord OAuth THEN El Sistema DEBE crear o actualizar su registro en la base de datos con discordId, discordUsername y avatar
2. WHEN un usuario no autenticado intenta acceder a funciones protegidas THEN El Sistema DEBE redirigir al flujo de autenticación de Discord
3. El Sistema DEBE mantener la sesión del usuario usando JWT con estrategia de sesión
4. WHEN un usuario cierra sesión THEN El Sistema DEBE invalidar su sesión actual
5. El Sistema DEBE usar exclusivamente Discord OAuth para autenticación, sin métodos alternativos que comprometan la seguridad

### Requisito 3: Sistema Gacha de Starters

**Historia de Usuario:** Como jugador, quiero obtener un Pokémon inicial único mediante un sistema de sorteo, para que tenga un compañero exclusivo.

#### Criterios de Aceptación

1. WHEN un jugador autenticado hace una tirada THEN El Sistema DEBE seleccionar aleatoriamente un starter de los 27 disponibles (1 de cada tipo, Gen 1-9) que no hayan sido reclamados. El pool es fijo: existe exactamente 1 Bulbasaur, 1 Charmander, etc.
2. WHEN un jugador intenta hacer una segunda tirada THEN El Sistema DEBE rechazar la solicitud e informar que ya tiene un starter
3. WHEN se selecciona un starter THEN El Sistema DEBE aplicar una probabilidad del 1% para que sea shiny
4. WHEN un starter es reclamado THEN El Sistema DEBE marcarlo como no disponible (isClaimed: true, claimedBy: discordId) para que ningún otro jugador pueda obtenerlo
5. WHEN ocurre un error durante la transacción de tirada THEN El Sistema DEBE revertir todos los cambios (rollback) para evitar pérdida de starters o estados inconsistentes
6. El Sistema DEBE mostrar la cantidad de starters disponibles y reclamados en tiempo real
7. WHEN un jugador usa el modo Soul Driven THEN El Sistema DEBE presentar un cuestionario de 5 preguntas que mapean respuestas a tipos de Pokémon (ej: "¿Prefieres velocidad o fuerza?" -> Tipo Eléctrico/Lucha) y seleccionar aleatoriamente entre los starters disponibles que coincidan con los tipos resultantes

### Requisito 4: Sistema de Verificación Minecraft-Discord

**Historia de Usuario:** Como jugador, quiero vincular mi cuenta de Minecraft con Discord, para que pueda moverme en el servidor y recibir mi starter.

#### Criterios de Aceptación

1. WHEN el plugin de Minecraft solicita generar un código THEN El Sistema DEBE crear un código de 5 dígitos y asociarlo al UUID del jugador
2. WHEN un jugador ingresa el código correcto en la web THEN El Sistema DEBE marcar su cuenta como verificada (verified: true, verifiedAt: timestamp)
3. WHEN un jugador ingresa un código incorrecto THEN El Sistema DEBE informar que el código es inválido
4. El Sistema DEBE permitir al plugin consultar el estado de verificación de un jugador por UUID
5. WHEN un jugador verificado se conecta al servidor THEN El Sistema DEBE permitir que el plugin le dé su starter pendiente si tiene uno

### Requisito 5: Tienda de Pokéballs

**Historia de Usuario:** Como jugador, quiero comprar Pokéballs con mis CobbleDollars, para que pueda capturar más Pokémon.

#### Criterios de Aceptación

1. El Sistema DEBE mostrar un catálogo de Pokéballs con stock dinámico que se regenera cada hora
2. WHEN un jugador consulta su balance THEN El Sistema DEBE retornar su cantidad de CobbleDollars sincronizada desde el servidor
3. WHEN un jugador compra Pokéballs THEN El Sistema DEBE verificar que tiene suficiente balance y stock disponible
4. WHEN una compra es exitosa THEN El Sistema DEBE descontar el balance, reducir el stock y crear un registro de compra pendiente
5. WHEN el stock de una Pokéball es bajo (menos del 25% del máximo) THEN El Sistema DEBE aumentar su precio proporcionalmente (hasta 3x el precio base)
6. El Sistema DEBE incluir siempre las 3 Pokéballs básicas (Poké, Great, Ultra). Cada hora al regenerar stock, se seleccionan 2 Pokéballs especiales aleatorias. Hay un 5% de probabilidad de que aparezca una Master Ball con stock de 1 unidad y precio fijo de 100,000 CobbleDollars
7. WHEN un jugador reclama compras en el servidor mediante /claimshop THEN El Sistema DEBE marcar las compras como entregadas (claimed: true, claimedAt: timestamp)

### Requisito 6: Perfiles de Jugadores

**Historia de Usuario:** Como jugador, quiero ver mi perfil y el de otros jugadores, para que pueda comparar equipos y progreso.

#### Criterios de Aceptación

1. El Sistema DEBE mostrar una lista de todos los jugadores con su nombre, cantidad de Pokémon, shinies y preview del equipo (máximo 6)
2. WHEN un usuario accede al perfil de un jugador THEN El Sistema DEBE mostrar su equipo completo con estadísticas detalladas de cada Pokémon (nivel, IVs, EVs, naturaleza, habilidad, movimientos)
3. El Sistema DEBE mostrar el starter del gacha de cada jugador si lo tiene, indicando si es shiny
4. El Sistema DEBE permitir buscar jugadores por nombre y ordenar por cantidad de Pokémon, shinies o nombre
5. WHEN el plugin sincroniza datos de un jugador THEN El Sistema DEBE actualizar su perfil con el equipo actual, PC storage (primeras 2 cajas) y balance de CobbleDollars

### Requisito 7: Sistema de Torneos

**Historia de Usuario:** Como jugador, quiero ver los torneos disponibles y participar en ellos, para que pueda competir con otros jugadores.

#### Criterios de Aceptación

1. El Sistema DEBE mostrar torneos organizados por estado: activos (en curso), próximos (upcoming) y completados
2. WHEN un administrador crea un torneo THEN El Sistema DEBE validar que la fecha de inicio sea futura
3. El Sistema DEBE mostrar información del torneo: título, descripción, fecha de inicio, participantes máximos y premios
4. WHEN un torneo tiene participantes THEN El Sistema DEBE mostrar la cantidad actual vs máxima

### Requisito 8: Galería de Starters

**Historia de Usuario:** Como jugador, quiero ver todos los starters reclamados, para que pueda ver qué Pokémon tienen otros jugadores.

#### Criterios de Aceptación

1. El Sistema DEBE mostrar todos los starters que han sido reclamados con su sprite animado, tipos y nombre del dueño
2. WHEN un starter es shiny THEN El Sistema DEBE mostrarlo con indicador visual especial (estrella, borde dorado) y sprite shiny
3. El Sistema DEBE mostrar estadísticas: total reclamados, disponibles y porcentaje de progreso (barra visual)
4. WHEN un usuario hace clic en un starter THEN El Sistema DEBE mostrar una tarjeta detallada con stats base, habilidades, movimientos característicos y cadena evolutiva

### Requisito 9: Sistema de Level Caps

**Historia de Usuario:** Como administrador, quiero configurar límites de nivel para los Pokémon, para que pueda balancear el juego.

#### Criterios de Aceptación

1. El Sistema DEBE permitir configurar un cap de captura (nivel máximo de Pokémon que se puede capturar) y un cap de posesión (nivel máximo al que puede subir un Pokémon)
2. El Sistema DEBE soportar reglas estáticas con condiciones opcionales: grupos de jugadores, rango de badges, tiempo de juego mínimo/máximo
3. El Sistema DEBE soportar reglas temporales con tres tipos de progresión: diaria (incremento fijo por día), por intervalos (incremento cada N días), o por calendario (fechas específicas con caps fijos)
4. WHEN el plugin consulta GET /api/level-caps/effective?uuid=X THEN El Sistema DEBE calcular y retornar los valores aplicables: {captureCap: number, ownershipCap: number, appliedRules: string[]}
5. El Sistema DEBE mantener un historial de cambios en la configuración de level caps con timestamp, admin y valores antes/después

**Nota:** El plugin de Minecraft actual ya consume este endpoint y aplica los límites en tiempo real. El backend solo calcula, el plugin enforce.

### Requisito 10: Información del Servidor

**Historia de Usuario:** Como jugador, quiero ver el estado del servidor y cómo conectarme, para que pueda unirme a jugar.

#### Criterios de Aceptación

1. El Sistema DEBE mostrar el estado del servidor (online/offline), cantidad de jugadores conectados vs máximo, y versión del servidor
2. El Sistema DEBE permitir copiar la IP del servidor al portapapeles con un clic
3. WHEN el servidor está online THEN El Sistema DEBE mostrar la lista de nombres de jugadores conectados
4. El Sistema DEBE mostrar instrucciones de conexión paso a paso, información del modpack Cobblemon y reglas del servidor

### Requisito 11: Panel de Administración

**Historia de Usuario:** Como administrador, quiero gestionar jugadores, torneos y configuraciones, para que pueda mantener el servidor.

#### Criterios de Aceptación

1. WHEN un usuario con rol de administrador (isAdmin: true) accede al panel THEN El Sistema DEBE mostrar las opciones de gestión
2. El Sistema DEBE permitir banear/desbanear jugadores especificando una razón que se mostrará al jugador
3. El Sistema DEBE permitir crear, editar y eliminar torneos
4. El Sistema DEBE permitir configurar los level caps: configuración global (fórmulas por defecto, mensajes) y reglas específicas
5. El Sistema DEBE permitir ver el historial de cambios en level caps con filtros por fecha y administrador

### Requisito 12: Sincronización con Plugin de Minecraft

**Historia de Usuario:** Como sistema, quiero recibir datos del plugin de Minecraft, para que la información esté actualizada.

#### Criterios de Aceptación

1. WHEN el plugin envía POST /api/players/sync con datos de sincronización THEN El Sistema DEBE actualizar el perfil del jugador con equipo (party), PC storage y balance de CobbleDollars
2. El Sistema DEBE implementar rate limiting: máximo 60 solicitudes por minuto por IP del servidor de Minecraft, con ventana deslizante
3. WHEN el plugin consulta GET /api/players/starter?uuid=X THEN El Sistema DEBE retornar {pending: boolean, pokemonId?: number, isShiny?: boolean}
4. WHEN el plugin notifica POST /api/players/starter-given que entregó el starter THEN El Sistema DEBE marcar starterGiven: true en el usuario
5. El Sistema DEBE retornar el estado de ban del jugador {banned: boolean, banReason?: string} en cada respuesta de sincronización
6. El Sistema DEBE validar que las solicitudes de sincronización provengan de IPs autorizadas (configurable via variable de entorno)

### Requisito 13: Interfaz de Usuario

**Historia de Usuario:** Como jugador, quiero una interfaz atractiva y fácil de usar, para que disfrute usando la plataforma.

#### Criterios de Aceptación

1. El Sistema DEBE usar un diseño responsive que funcione correctamente en móviles (320px+) y escritorio (1024px+)
2. El Sistema DEBE usar tema oscuro con acentos de colores Pokémon: rojo (#EF4444) para acciones principales, azul (#3B82F6) para información, amarillo (#EAB308) para shinies
3. El Sistema DEBE incluir efectos de sonido opcionales (toggle en navbar) para interacciones: click, confirm, cancel, roll
4. El Sistema DEBE mostrar animaciones suaves en transiciones de página y acciones importantes (tirada gacha, compra exitosa)
5. El Sistema DEBE mostrar sprites animados de Pokémon (GIF de PokeAPI) para Gen 1-5, y sprites estáticos de Showdown para Gen 6-9
6. El Sistema DEBE estar completamente en español: textos, mensajes de error, fechas formateadas

### Requisito 14: Rendimiento y Seguridad

**Historia de Usuario:** Como sistema, quiero ser seguro y eficiente, para que los usuarios tengan buena experiencia.

#### Criterios de Aceptación

1. El Sistema DEBE validar todas las entradas de usuario usando esquemas de validación (Zod) para prevenir inyección y datos malformados
2. El Sistema DEBE usar HTTPS para todas las comunicaciones en producción
3. El Sistema DEBE implementar rate limiting en endpoints públicos: 100 req/min para lectura, 20 req/min para escritura por IP
4. El Sistema DEBE cachear datos estáticos que no cambian: STARTERS_DATA, POKEBALLS_DATA en memoria del servidor
5. El Sistema DEBE manejar errores gracefully: mostrar mensajes amigables al usuario sin exponer detalles técnicos, loguear errores completos en servidor

### Requisito 15: Serialización y Parsing de Datos

**Historia de Usuario:** Como sistema, quiero serializar y deserializar datos correctamente, para que la información se mantenga íntegra.

#### Criterios de Aceptación

1. WHEN el sistema serializa datos de Pokémon a JSON THEN El Sistema DEBE preservar todos los campos: species, speciesId, level, experience, shiny, gender, nature, ability, friendship, ball, ivs (6 stats), evs (6 stats), moves, heldItem, currentHealth, maxHealth, status
2. WHEN el sistema deserializa datos de la base de datos THEN El Sistema DEBE validar la estructura y tipos de datos usando esquemas TypeScript
3. El Sistema DEBE implementar funciones de serialización/deserialización para Pokémon que permitan verificar integridad mediante round-trip: serialize(deserialize(data)) === data
4. WHEN se reciben datos malformados en endpoints de sincronización THEN El Sistema DEBE rechazar la solicitud con código 400 y mensaje descriptivo indicando qué campo es inválido
