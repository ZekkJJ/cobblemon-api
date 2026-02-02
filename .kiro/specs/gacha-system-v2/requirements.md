# Requirements Document

## Introduction

Gacha System 2.0 es una actualización completa del sistema de gacha existente para Cobblemon Los Pitufos. Esta actualización corrige problemas técnicos críticos, expande el pool de Pokémon, mejora drásticamente la experiencia visual con animaciones premium, añade efectos de sonido, implementa notificaciones in-game con efectos especiales, integra webhooks de Discord para tiradas raras, y añade nuevas mecánicas como tirada diaria gratuita, sistema de duplicados/Stardust, y Epitomized Path para banners limitados.

## Glossary

- **Gacha System**: Sistema de lotería donde los jugadores gastan moneda virtual para obtener recompensas aleatorias
- **Pity System**: Mecanismo que garantiza recompensas de alta rareza después de cierto número de tiradas
- **Soft Pity**: Aumento gradual de probabilidad antes del hard pity (comienza en tirada 75)
- **Hard Pity**: Garantía absoluta de recompensa Epic+ en la tirada 90
- **50/50 System**: Sistema donde al obtener Epic+, hay 50% de que sea el destacado; si pierdes, el siguiente es garantizado
- **Epitomized Path**: Sistema que permite elegir un Pokémon destacado específico y garantizarlo después de perder 2 veces el 50/50
- **Stardust**: Moneda obtenida al conseguir duplicados, usable para comprar items especiales
- **Daily Free Pull**: Una tirada gratuita disponible cada 24 horas
- **Dragon Effect**: Efecto visual/sonoro especial en Minecraft para Legendary/Mythic (como el efecto del Ender Dragon)
- **XP Effect**: Efecto visual/sonoro sutil en Minecraft para Epic (como recoger experiencia)
- **Discord Webhook**: Notificación automática a Discord cuando ocurren eventos especiales
- **Skip Animation**: Opción para saltar la animación de tirada y ver resultados directamente

## Requirements

### Requirement 1: Corrección de Configuración de Pity

**User Story:** As a player, I want the pity system to work consistently between frontend and backend, so that I can accurately track my progress.

#### Acceptance Criteria

1. THE Gacha_System SHALL use soft pity starting at pull 75 and hard pity at pull 90 consistently in both frontend and backend
2. WHEN displaying pity progress THEN the Frontend SHALL show accurate values matching backend configuration (75/90, not 50/200)
3. WHEN a player views pity status THEN the System SHALL display: current pull count, pulls until soft pity, pulls until hard pity, and current Epic+ probability
4. THE PityDisplay component SHALL calculate probability correctly: base 4.6% + 5% per pull after 75

### Requirement 2: Expansión del Pool de Pokémon

**User Story:** As a player, I want a larger variety of Pokémon available in the gacha, so that pulling feels more exciting and diverse.

#### Acceptance Criteria

1. THE Gacha_System SHALL include Pokémon from generations 1-9 in the pool (minimum 400 Pokémon total)
2. THE Common tier SHALL contain approximately 150 basic/first-stage Pokémon
3. THE Uncommon tier SHALL contain approximately 100 mid-evolution Pokémon
4. THE Rare tier SHALL contain approximately 80 final-evolution Pokémon
5. THE Epic tier SHALL contain approximately 50 strong final evolutions and pseudo-legendary pre-evolutions
6. THE Legendary tier SHALL contain all pseudo-legendary final forms and minor legendaries (approximately 30)
7. THE Mythic tier SHALL contain box legendaries and mythical Pokémon (approximately 25)

### Requirement 3: Notificaciones Discord Webhook

**User Story:** As a server admin, I want rare pulls to be announced on Discord, so that the community can celebrate together.

#### Acceptance Criteria

1. WHEN a player obtains a Shiny Pokémon THEN the Backend SHALL send a webhook notification to the configured Discord channel
2. WHEN a player obtains a Legendary rarity reward THEN the Backend SHALL send a webhook notification
3. WHEN a player obtains a Mythic rarity reward THEN the Backend SHALL send a webhook notification with special formatting
4. THE webhook message SHALL include: player name, Pokémon/item obtained, rarity, shiny status, and Pokemon sprite image
5. THE Backend SHALL use webhook URL: https://discord.com/api/webhooks/1272445276354777203/HzrbjsXD23GnHePnbZx7596elfZSL_l29i16ZT_u3JwDNRr-yg8WoCRNrwfgRGCqtYMu

### Requirement 4: Notificaciones In-Game con Efectos

**User Story:** As a player, I want to see special effects in Minecraft when I or others get rare pulls, so that the experience feels rewarding.

#### Acceptance Criteria

1. WHEN a player claims a Legendary or Mythic reward THEN the Plugin SHALL broadcast a server-wide message with Dragon death effect sound
2. WHEN a player claims an Epic reward THEN the Plugin SHALL broadcast a server-wide message with XP orb collection sound (subtle)
3. THE broadcast message SHALL include: player name, Pokémon name, rarity tier, and shiny indicator if applicable
4. WHEN a player claims a Shiny Pokémon of any rarity THEN the Plugin SHALL play the Dragon effect sound
5. THE Plugin SHALL use color formatting: Epic=Purple, Legendary=Gold, Mythic=Pink, Shiny=Rainbow/Aqua

### Requirement 5: Animación de Tirada Premium

**User Story:** As a player, I want an exciting pull animation that builds anticipation, so that the gacha experience feels premium.

#### Acceptance Criteria

1. WHEN a pull is initiated THEN the Frontend SHALL display a multi-phase animation sequence lasting 3-4 seconds
2. THE animation SHALL include: energy gathering phase, pokeball throw phase, pokeball shake phase, and dramatic reveal
3. WHEN revealing Epic+ rewards THEN the Frontend SHALL show screen shake effect and particle explosion
4. WHEN revealing Shiny rewards THEN the Frontend SHALL show golden sparkle effects and special glow
5. WHEN revealing Mythic rewards THEN the Frontend SHALL show rainbow particle effects and dramatic lighting
6. THE Frontend SHALL provide a "Skip" button that appears after 1 second to skip directly to results

### Requirement 6: Efectos de Sonido

**User Story:** As a player, I want sound effects during pulls, so that the experience is more immersive.

#### Acceptance Criteria

1. WHEN a pull animation starts THEN the Frontend SHALL play a "whoosh" or energy gathering sound
2. WHEN the pokeball shakes THEN the Frontend SHALL play pokeball shake sounds
3. WHEN a Common/Uncommon/Rare reward is revealed THEN the Frontend SHALL play a standard reveal sound
4. WHEN an Epic reward is revealed THEN the Frontend SHALL play an enhanced reveal sound with chime
5. WHEN a Legendary reward is revealed THEN the Frontend SHALL play a dramatic fanfare sound
6. WHEN a Mythic reward is revealed THEN the Frontend SHALL play an epic orchestral hit sound
7. WHEN a Shiny is revealed THEN the Frontend SHALL play a special sparkle/shimmer sound overlay
8. THE Frontend SHALL respect user's mute preference from the global audio context

### Requirement 7: Modal de Resultados Mejorado

**User Story:** As a player, I want the results screen to feel impactful for rare pulls, so that getting something good feels special.

#### Acceptance Criteria

1. WHEN displaying Epic+ results THEN the ResultsModal SHALL show animated particle effects around the reward
2. WHEN displaying Shiny results THEN the ResultsModal SHALL show continuous sparkle animation and golden border
3. WHEN displaying Mythic results THEN the ResultsModal SHALL show rainbow gradient background animation
4. THE ResultsModal SHALL show a "celebration screen" for first-time Legendary/Mythic/Shiny obtains
5. WHEN a multi-pull contains Epic+ THEN the ResultsModal header SHALL change color and show special text

### Requirement 8: Sistema de Tirada Diaria Gratuita

**User Story:** As a player, I want one free pull per day, so that I can participate even without spending currency.

#### Acceptance Criteria

1. THE Gacha_System SHALL provide one free single pull per player per 24-hour period
2. WHEN a player has a free pull available THEN the Frontend SHALL display a special "Free Pull" button
3. WHEN a player uses their free pull THEN the System SHALL record the timestamp and prevent another free pull for 24 hours
4. WHEN displaying the gacha page THEN the Frontend SHALL show countdown timer until next free pull if unavailable
5. THE free pull SHALL use the Standard Banner pool only (not limited banners)
6. WHEN a player's free pull resets THEN the System SHALL NOT notify them (passive availability)

### Requirement 9: Sistema de Duplicados y Stardust

**User Story:** As a player, I want duplicates to have value, so that getting the same Pokémon again doesn't feel wasted.

#### Acceptance Criteria

1. WHEN a player obtains a Pokémon they already own THEN the System SHALL convert it to Stardust currency
2. THE Stardust conversion rates SHALL be: Common=10, Uncommon=25, Rare=50, Epic=100, Legendary=250, Mythic=500
3. WHEN a Shiny duplicate is obtained THEN the System SHALL award 5x the normal Stardust amount
4. THE Frontend SHALL display current Stardust balance on the gacha page
5. THE System SHALL provide a Stardust Shop with purchasable items (Rare Candy, Ability Capsule, etc.)
6. WHEN a player views their inventory THEN the System SHALL track which Pokémon species they have obtained

### Requirement 10: Epitomized Path System

**User Story:** As a player, I want to guarantee a specific featured Pokémon after enough pulls, so that I can plan for what I want.

#### Acceptance Criteria

1. WHEN a limited banner has multiple featured Pokémon THEN the System SHALL allow players to select one as their "Epitomized Path" target
2. THE System SHALL track "Fate Points" - earned when obtaining featured-rarity but NOT the Epitomized target
3. WHEN a player accumulates 2 Fate Points THEN the next featured-rarity reward SHALL be guaranteed to be their Epitomized target
4. WHEN a player obtains their Epitomized target THEN the System SHALL reset their Fate Points to 0
5. WHEN a banner ends THEN the System SHALL reset all Fate Points for that banner (they do not carry over)
6. THE Frontend SHALL display current Fate Points and Epitomized Path selection on banner details

### Requirement 11: Historial y Estadísticas Completas

**User Story:** As a player, I want to view my complete pull history and statistics, so that I can track my luck and spending.

#### Acceptance Criteria

1. WHEN a player visits /gacha/history THEN the Frontend SHALL display paginated pull history with filters
2. THE history page SHALL support filtering by: banner, rarity, date range, shiny status, and Pokemon/item type
3. WHEN a player visits /gacha/stats THEN the Frontend SHALL display comprehensive statistics
4. THE stats page SHALL show: total pulls, total CD spent, rarity distribution pie chart, luck rating, shiny count, and average pity
5. THE stats page SHALL show pull history graph over time
6. THE Frontend SHALL allow exporting history as CSV

### Requirement 12: Mejoras en Banner Cards

**User Story:** As a player, I want banner cards to look attractive and informative, so that I know what I'm pulling for.

#### Acceptance Criteria

1. WHEN displaying a banner THEN the BannerCard SHALL show custom artwork or high-quality Pokemon artwork
2. THE BannerCard SHALL display animated countdown timer for limited banners
3. THE BannerCard SHALL show all featured Pokémon with their sprites and rate-up indicator
4. WHEN hovering a banner THEN the Frontend SHALL show detailed rate information tooltip
5. THE BannerCard SHALL indicate if the player has Epitomized Path set for that banner

### Requirement 13: Plugin - Entrega de Recompensas Mejorada

**User Story:** As a player, I want my gacha rewards delivered smoothly in-game with appropriate feedback.

#### Acceptance Criteria

1. WHEN delivering a reward THEN the Plugin SHALL play appropriate sound effect based on rarity
2. WHEN delivering a Legendary/Mythic THEN the Plugin SHALL play ender dragon death sound to all online players
3. WHEN delivering an Epic THEN the Plugin SHALL play experience orb sound to the receiving player only
4. WHEN delivering a Shiny THEN the Plugin SHALL play ender dragon death sound regardless of rarity
5. THE Plugin SHALL send formatted chat messages with hover text showing Pokemon details
6. WHEN a player is offline THEN the Plugin SHALL queue rewards and deliver on next login with notification

### Requirement 14: Pantalla de Celebración para Shinies/Mythics

**User Story:** As a player, I want a special celebration when I get extremely rare pulls, so that the moment feels memorable.

#### Acceptance Criteria

1. WHEN a player obtains their first Shiny of a species THEN the Frontend SHALL show a full-screen celebration overlay
2. WHEN a player obtains any Mythic THEN the Frontend SHALL show a full-screen celebration overlay
3. THE celebration overlay SHALL include: large Pokemon artwork, particle effects, congratulations text, and share button
4. THE celebration SHALL auto-dismiss after 5 seconds or on user click
5. THE celebration SHALL play a special victory fanfare sound



### Requirement 15: Opción de Saltar Animación

**User Story:** As a player, I want to skip the pull animation when I'm in a hurry, so that I can pull quickly.

#### Acceptance Criteria

1. WHEN a pull animation is playing THEN the Frontend SHALL display a "Skip" button after 1 second
2. WHEN the Skip button is clicked THEN the Frontend SHALL immediately transition to the results modal
3. THE Frontend SHALL remember user's skip preference in localStorage
4. WHEN skip preference is enabled THEN the Frontend SHALL show a minimal 0.5 second transition instead of full animation
5. THE skip option SHALL NOT affect sound effects (they still play on reveal)

### Requirement 16: Rate Limiting y Seguridad

**User Story:** As a system administrator, I want the gacha to be protected against abuse, so that the economy remains stable.

#### Acceptance Criteria

1. THE Backend SHALL implement rate limiting of maximum 10 pull requests per minute per player
2. WHEN rate limit is exceeded THEN the Backend SHALL return error code RATE_LIMITED with retry-after header
3. THE Backend SHALL validate all pull requests have valid authentication
4. THE Backend SHALL log all pull transactions with player ID, timestamp, and result for audit purposes
5. THE Backend SHALL implement request signing to prevent replay attacks

### Requirement 17: Actualización del Plugin para Nuevas Funcionalidades

**User Story:** As a developer, I want the Minecraft plugin to support all new gacha features.

#### Acceptance Criteria

1. THE Plugin SHALL check for daily free pull availability via backend API
2. THE Plugin SHALL support the new Stardust currency display in player info
3. THE Plugin SHALL handle the new reward delivery sound effects based on rarity
4. THE Plugin SHALL broadcast server-wide messages for Epic+ pulls with appropriate formatting
5. THE Plugin SHALL support the /gacha info command showing pity, stardust, and daily pull status
6. THE Plugin SHALL cache player gacha data to reduce API calls

