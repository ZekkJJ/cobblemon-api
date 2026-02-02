# Requirements Document

## Introduction

Sistema de Gacha tipo Genshin Impact para obtener Pokémon aleatorios con diferentes raridades. Los jugadores gastan CobbleDollars (CD) para hacer tiradas y obtener Pokémon, items raros como Master Balls, y otros objetos valiosos. El sistema incluye banners rotativos, Pokémon destacados con rate-up, sistema de pity, y utiliza RNG criptográfico para verdadera aleatoriedad.

## Glossary

- **Gacha System**: Sistema de lotería donde los jugadores gastan moneda virtual para obtener recompensas aleatorias
- **Banner**: Evento temporal con un pool específico de recompensas y Pokémon destacados
- **Featured/Rate-Up**: Pokémon o items con probabilidad aumentada en un banner específico
- **Pity System**: Mecanismo que garantiza recompensas de alta rareza después de cierto número de tiradas sin éxito
- **Soft Pity**: Aumento gradual de probabilidad antes del hard pity
- **Hard Pity**: Garantía absoluta de recompensa rara después de X tiradas
- **CSPRNG**: Cryptographically Secure Pseudo-Random Number Generator - generador de números aleatorios criptográficamente seguro
- **IVs (Individual Values)**: Estadísticas ocultas que determinan el potencial de un Pokémon (0-31)
- **Pull/Tirada**: Una ejecución del gacha que consume moneda y otorga una recompensa
- **Multi-Pull**: Múltiples tiradas en una sola transacción (típicamente 10x)
- **Rarity**: Nivel de rareza de una recompensa (Common, Uncommon, Rare, Epic, Legendary, Mythic)
- **Pool**: Conjunto de recompensas posibles en un banner

## Requirements

### Requirement 1: Sistema de Tiradas Básico

**User Story:** As a player, I want to spend CobbleDollars to pull from the gacha, so that I can obtain random Pokémon and items.

#### Acceptance Criteria

1. WHEN a player requests a single pull THEN the Gacha_System SHALL deduct 500 CD from the player balance and return one random reward
2. WHEN a player requests a multi-pull (10x) THEN the Gacha_System SHALL deduct 4500 CD and return exactly 10 random rewards
3. WHEN a player has insufficient balance for a pull THEN the Gacha_System SHALL reject the request and return an error message without modifying balance
4. WHEN a pull is executed THEN the Gacha_System SHALL use crypto.randomBytes() for random number generation instead of Math.random()
5. WHEN a reward is determined THEN the Gacha_System SHALL record the pull in the player history with timestamp, reward details, and banner ID

### Requirement 2: Sistema de Raridades

**User Story:** As a player, I want different rarity tiers for rewards, so that obtaining rare Pokémon feels special and rewarding.

#### Acceptance Criteria

1. THE Gacha_System SHALL support exactly six rarity tiers: Common (60%), Uncommon (25%), Rare (10%), Epic (4%), Legendary (0.6%), Mythic (0.0001%)
2. WHEN determining rarity THEN the Gacha_System SHALL use weighted probability distribution based on the defined percentages
3. WHEN a Pokémon is obtained THEN the Gacha_System SHALL assign IVs based on rarity: Common (0-15), Uncommon (5-20), Rare (10-25), Epic (15-28), Legendary (20-30), Mythic (25-31)
4. WHEN displaying a reward THEN the Gacha_System SHALL show visual indicators matching the rarity tier (color coding and star rating)

### Requirement 3: Sistema de Shiny

**User Story:** As a player, I want a chance to obtain shiny Pokémon, so that I can collect rare variants.

#### Acceptance Criteria

1. WHEN a Pokémon reward is determined THEN the Gacha_System SHALL apply a 1/4096 (0.0244%) chance for shiny variant
2. WHEN a shiny Pokémon is obtained THEN the Gacha_System SHALL mark the Pokémon with isShiny flag and use shiny sprites
3. WHEN a shiny is obtained THEN the Gacha_System SHALL send a Discord webhook notification announcing the rare pull
4. WHEN displaying pull results THEN the Gacha_System SHALL show special animation and effects for shiny Pokémon

### Requirement 4: Sistema de Pity

**User Story:** As a player, I want a pity system that guarantees rare rewards after many pulls, so that I feel my investment is protected.

#### Acceptance Criteria

1. THE Gacha_System SHALL track pull count since last Epic-or-better reward for each player per banner
2. WHEN a player reaches 75 pulls without Epic-or-better THEN the Gacha_System SHALL increase Epic+ probability by 5% per additional pull (soft pity)
3. WHEN a player reaches 90 pulls without Epic-or-better THEN the Gacha_System SHALL guarantee an Epic-or-better reward (hard pity)
4. WHEN a player obtains an Epic-or-better reward THEN the Gacha_System SHALL reset the pity counter to zero
5. THE Gacha_System SHALL maintain separate pity counters for different banner types (standard vs limited)

### Requirement 5: Sistema de Banners

**User Story:** As a player, I want rotating banners with different featured Pokémon, so that I can target specific rewards.

#### Acceptance Criteria

1. THE Gacha_System SHALL support multiple concurrent banners with independent pools and pity counters
2. WHEN a banner is active THEN the Gacha_System SHALL display banner artwork, featured rewards, end date, and rate-up information
3. WHEN a banner expires THEN the Gacha_System SHALL automatically deactivate it and prevent further pulls
4. THE Gacha_System SHALL always maintain one permanent "Standard Banner" that never expires
5. WHEN an admin creates a banner THEN the Gacha_System SHALL require: name, start date, end date, featured items, and rate-up multiplier

### Requirement 6: Sistema de Featured/Rate-Up

**User Story:** As a player, I want featured Pokémon with increased rates, so that I can plan my pulls for desired rewards.

#### Acceptance Criteria

1. WHEN a banner has featured Pokémon THEN the Gacha_System SHALL apply a rate-up multiplier (default 5x) to their base probability
2. WHEN a player obtains a reward matching the featured rarity THEN the Gacha_System SHALL have 50% chance to be the featured item (50/50 system)
3. IF a player loses the 50/50 THEN the next featured-rarity reward SHALL be guaranteed to be the featured item
4. WHEN displaying banner details THEN the Gacha_System SHALL show all featured items with their boosted probabilities

### Requirement 7: Pool de Recompensas Mixto

**User Story:** As a player, I want the gacha to include items like Master Balls and rare Poké Balls, so that I can obtain valuable items beyond Pokémon.

#### Acceptance Criteria

1. THE Gacha_System SHALL include items in the reward pool: Master Ball (Mythic), Beast Ball (Legendary), Safari Ball (Epic), Sport Ball (Epic), Dream Ball (Rare)
2. WHEN an item reward is determined THEN the Gacha_System SHALL add the item to the player pending deliveries instead of creating a Pokémon
3. WHEN a player claims item rewards in-game THEN the Plugin SHALL deliver the items to the player inventory
4. THE Gacha_System SHALL allow admins to configure item drop rates independently from Pokémon rates

### Requirement 8: Historial y Estadísticas

**User Story:** As a player, I want to view my pull history and statistics, so that I can track my luck and spending.

#### Acceptance Criteria

1. WHEN a player views their history THEN the Gacha_System SHALL display the last 100 pulls with timestamps, rewards, and banner names
2. WHEN a player views statistics THEN the Gacha_System SHALL show total pulls, CD spent, rarity distribution, and pity progress
3. THE Gacha_System SHALL persist pull history in the database with player ID, banner ID, reward details, and timestamp
4. WHEN displaying history THEN the Gacha_System SHALL allow filtering by banner, rarity, and date range

### Requirement 9: Interfaz de Usuario Web

**User Story:** As a player, I want an engaging web interface for the gacha, so that pulling feels exciting and visually appealing.

#### Acceptance Criteria

1. WHEN a player visits the gacha page THEN the Frontend SHALL display active banners with artwork and countdown timers
2. WHEN a player initiates a pull THEN the Frontend SHALL show an animated pull sequence before revealing results
3. WHEN results are revealed THEN the Frontend SHALL display rewards with appropriate rarity effects (particles, glow, sound)
4. WHEN a multi-pull completes THEN the Frontend SHALL show all 10 results in a grid with option to view details
5. THE Frontend SHALL display current pity progress and CD balance prominently

### Requirement 10: Entrega de Recompensas In-Game

**User Story:** As a player, I want to claim my gacha rewards in Minecraft, so that I can use my new Pokémon and items.

#### Acceptance Criteria

1. WHEN a player has pending gacha rewards THEN the Plugin SHALL notify them upon login with reward count
2. WHEN a player executes /gacha claim THEN the Plugin SHALL deliver all pending Pokémon to their party or PC
3. WHEN a player executes /gacha claim THEN the Plugin SHALL deliver all pending items to their inventory
4. IF a player party and PC are full THEN the Plugin SHALL notify the player and retain rewards as pending
5. WHEN a reward is successfully delivered THEN the Plugin SHALL mark it as claimed in the database

### Requirement 11: Administración de Banners

**User Story:** As an admin, I want to create and manage gacha banners, so that I can control the gacha content and events.

#### Acceptance Criteria

1. WHEN an admin accesses the admin panel THEN the System SHALL display banner management interface
2. WHEN an admin creates a banner THEN the System SHALL validate all required fields and save to database
3. WHEN an admin edits a banner THEN the System SHALL allow modification of pool, rates, dates, and featured items
4. WHEN an admin deactivates a banner THEN the System SHALL immediately prevent new pulls while preserving history
5. THE System SHALL log all admin actions on banners with timestamp and admin identifier

### Requirement 12: Seguridad y Anti-Exploit

**User Story:** As a system administrator, I want the gacha to be secure against exploits, so that the economy remains balanced.

#### Acceptance Criteria

1. THE Gacha_System SHALL use database transactions for all balance modifications and reward grants
2. WHEN a pull request is received THEN the Gacha_System SHALL validate player authentication and rate-limit requests
3. THE Gacha_System SHALL implement idempotency keys to prevent duplicate pulls from network issues
4. WHEN suspicious activity is detected THEN the Gacha_System SHALL log the event and optionally alert admins
5. THE Gacha_System SHALL validate all RNG outputs are within expected bounds before granting rewards
