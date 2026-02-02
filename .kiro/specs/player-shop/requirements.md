# Requirements Document

## Introduction

La Player Shop es un sistema de mercado peer-to-peer donde los jugadores pueden vender sus Pokémon a otros jugadores por CobbleDollars. Los jugadores pueden listar cualquier Pokémon de su Party o PC Storage, establecer precios para compra directa o crear subastas (bidding) con duración configurable. El sistema incluye un cálculo de "Pitufipuntos" - una métrica de poder total basada en estadísticas, IVs, EVs, naturaleza, habilidad y tipo del Pokémon. Las transacciones se manejan de forma segura incluso cuando comprador o vendedor están offline.

## Glossary

- **Player_Shop_System**: Sistema de mercado peer-to-peer para intercambio de Pokémon entre jugadores
- **Listing**: Una publicación de venta de un Pokémon en el mercado
- **Direct_Purchase**: Método de venta donde el comprador paga el precio fijo establecido
- **Bidding**: Método de subasta donde múltiples compradores pueden pujar, ganando el mayor postor
- **Pitufipuntos**: Métrica de poder total calculada basándose en stats base, IVs, EVs, nivel, naturaleza, habilidad y tipos del Pokémon
- **CobbleDollars**: Moneda in-game usada para todas las transacciones
- **Pending_Delivery**: Estado de una transacción completada esperando que el receptor esté online
- **Escrow**: Sistema de retención temporal del Pokémon durante una venta activa
- **Bid_Duration**: Tiempo que dura una subasta activa (mínimo 24 horas, máximo 72 horas)
- **Outbid**: Cuando una puja es superada por otra más alta
- **Reserve_Price**: Precio mínimo opcional en subastas

## Requirements

### Requirement 1

**User Story:** As a player, I want to list my Pokémon for sale in the marketplace, so that I can earn CobbleDollars from Pokémon I no longer need.

#### Acceptance Criteria

1. WHEN a player selects a Pokémon from their Party or PC Storage THEN the Player_Shop_System SHALL display all Pokémon statistics including species, level, IVs, EVs, nature, ability, moves, shiny status, and calculated Pitufipuntos
2. WHEN a player creates a listing THEN the Player_Shop_System SHALL require selection of sale method (Direct_Purchase or Bidding)
3. WHEN a player selects Direct_Purchase THEN the Player_Shop_System SHALL require a fixed price in CobbleDollars between 100 and 10,000,000
4. WHEN a player selects Bidding THEN the Player_Shop_System SHALL require a starting bid price and duration between 24 and 72 hours
5. WHEN a listing is created THEN the Player_Shop_System SHALL move the Pokémon to Escrow status preventing its use in battles or trades
6. WHEN a player attempts to list a Pokémon already in Escrow THEN the Player_Shop_System SHALL reject the listing and display an error message

### Requirement 2

**User Story:** As a player, I want to browse and search the marketplace, so that I can find Pokémon that match my needs.

#### Acceptance Criteria

1. WHEN a player opens the marketplace THEN the Player_Shop_System SHALL display all active listings with Pokémon sprite, species, level, shiny indicator, Pitufipuntos, price/current bid, and time remaining for auctions
2. WHEN a player filters by species THEN the Player_Shop_System SHALL display only listings matching the selected species
3. WHEN a player filters by type THEN the Player_Shop_System SHALL display only listings with Pokémon of the selected type
4. WHEN a player filters by price range THEN the Player_Shop_System SHALL display only listings within the specified CobbleDollars range
5. WHEN a player filters by shiny status THEN the Player_Shop_System SHALL display only shiny or non-shiny listings as selected
6. WHEN a player sorts by Pitufipuntos THEN the Player_Shop_System SHALL order listings by calculated power score in ascending or descending order
7. WHEN a player views a listing detail THEN the Player_Shop_System SHALL display complete Pokémon statistics, seller username, listing creation time, and sale method details

### Requirement 3

**User Story:** As a player, I want to calculate and display Pitufipuntos accurately, so that I can compare Pokémon power levels objectively.

#### Acceptance Criteria

1. WHEN calculating Pitufipuntos THEN the Player_Shop_System SHALL use the formula: BaseStatTotal + (IVTotal * 2) + (EVTotal / 4) + (LevelBonus) + (NatureBonus) + (AbilityBonus) + (TypeBonus)
2. WHEN a Pokémon has beneficial nature for its role THEN the Player_Shop_System SHALL add 50 to 150 NatureBonus based on stat alignment
3. WHEN a Pokémon has a hidden ability THEN the Player_Shop_System SHALL add 100 AbilityBonus
4. WHEN a Pokémon is shiny THEN the Player_Shop_System SHALL add 200 bonus Pitufipuntos for rarity
5. WHEN displaying Pitufipuntos THEN the Player_Shop_System SHALL show the total score and a breakdown of contributing factors
6. WHEN two Pokémon of the same species exist THEN the Player_Shop_System SHALL calculate different Pitufipuntos based on their individual IVs, EVs, nature, and ability

### Requirement 4

**User Story:** As a buyer, I want to purchase Pokémon directly, so that I can instantly acquire Pokémon I want.

#### Acceptance Criteria

1. WHEN a buyer clicks purchase on a Direct_Purchase listing THEN the Player_Shop_System SHALL verify the buyer has sufficient CobbleDollars balance
2. IF the buyer has insufficient CobbleDollars THEN the Player_Shop_System SHALL reject the purchase and display the required amount
3. WHEN a purchase is confirmed THEN the Player_Shop_System SHALL atomically deduct CobbleDollars from buyer and credit to seller
4. WHEN a purchase is completed THEN the Player_Shop_System SHALL remove the Pokémon from Escrow and mark for delivery to buyer
5. WHEN the buyer is online in-game THEN the Player_Shop_System SHALL deliver the Pokémon to their Party or PC within 30 seconds
6. WHEN the buyer is offline THEN the Player_Shop_System SHALL queue the Pokémon for Pending_Delivery and deliver when they next login
7. WHEN a purchase is completed THEN the Player_Shop_System SHALL notify both buyer and seller via in-game message and web notification

### Requirement 5

**User Story:** As a buyer, I want to participate in auctions, so that I can bid on valuable Pokémon.

#### Acceptance Criteria

1. WHEN a buyer places a bid THEN the Player_Shop_System SHALL verify the bid exceeds current highest bid by minimum 5%
2. WHEN a buyer places a bid THEN the Player_Shop_System SHALL verify the buyer has sufficient CobbleDollars for the bid amount
3. WHEN a bid is placed THEN the Player_Shop_System SHALL reserve the bid amount from the buyer's balance
4. WHEN a buyer is Outbid THEN the Player_Shop_System SHALL release the reserved CobbleDollars back to their balance within 5 seconds
5. WHEN a buyer is Outbid THEN the Player_Shop_System SHALL notify the buyer via in-game message and web notification
6. WHEN Bid_Duration expires THEN the Player_Shop_System SHALL complete the sale to the highest bidder
7. WHEN an auction ends with no bids THEN the Player_Shop_System SHALL return the Pokémon from Escrow to the seller
8. WHEN an auction ends THEN the Player_Shop_System SHALL process delivery following the same rules as Direct_Purchase

### Requirement 6

**User Story:** As a seller, I want to manage my listings, so that I can cancel or modify them if needed.

#### Acceptance Criteria

1. WHEN a seller views their active listings THEN the Player_Shop_System SHALL display all their listings with current status, views, and bid count
2. WHEN a seller cancels a Direct_Purchase listing THEN the Player_Shop_System SHALL return the Pokémon from Escrow to their storage
3. WHEN a seller attempts to cancel a Bidding listing with active bids THEN the Player_Shop_System SHALL reject the cancellation
4. WHEN a seller cancels a Bidding listing with zero bids THEN the Player_Shop_System SHALL return the Pokémon from Escrow
5. WHEN a listing expires without sale THEN the Player_Shop_System SHALL automatically return the Pokémon to seller storage
6. WHEN a sale completes THEN the Player_Shop_System SHALL update seller's transaction history with sale details

### Requirement 7

**User Story:** As a player, I want secure transactions even when offline, so that I can trade without being online simultaneously.

#### Acceptance Criteria

1. WHEN a transaction completes and recipient is offline THEN the Player_Shop_System SHALL store the Pokémon in Pending_Delivery queue
2. WHEN a player with Pending_Delivery logs into the game THEN the Minecraft_Plugin SHALL check for pending deliveries within 5 seconds
3. WHEN delivering a pending Pokémon THEN the Minecraft_Plugin SHALL add it to Party if space available or first available PC slot
4. WHEN delivery succeeds THEN the Player_Shop_System SHALL mark the delivery as completed and notify the player
5. IF delivery fails due to full storage THEN the Player_Shop_System SHALL retain the Pokémon in queue and notify the player to make space
6. WHEN CobbleDollars are credited to an offline seller THEN the Player_Shop_System SHALL update their balance immediately for web display and sync to game on next login

### Requirement 8

**User Story:** As a system administrator, I want transaction integrity, so that no Pokémon or currency is duplicated or lost.

#### Acceptance Criteria

1. WHEN a listing is created THEN the Player_Shop_System SHALL use database transactions to atomically move Pokémon to Escrow
2. WHEN a purchase completes THEN the Player_Shop_System SHALL use database transactions to atomically transfer Pokémon and CobbleDollars
3. WHEN a bid is placed THEN the Player_Shop_System SHALL use database transactions to atomically reserve buyer funds
4. WHEN an auction ends THEN the Player_Shop_System SHALL use database transactions to atomically complete or revert the sale
5. WHEN any transaction fails THEN the Player_Shop_System SHALL rollback all changes and return assets to original owners
6. WHEN the system restarts THEN the Player_Shop_System SHALL resume processing of incomplete transactions from last known state

### Requirement 9

**User Story:** As a player, I want to see detailed Pokémon information before buying, so that I can make informed purchase decisions.

#### Acceptance Criteria

1. WHEN viewing a listing THEN the Player_Shop_System SHALL display animated sprite for the Pokémon species and form
2. WHEN viewing a listing THEN the Player_Shop_System SHALL display shiny sprite if the Pokémon is shiny
3. WHEN viewing a listing THEN the Player_Shop_System SHALL display IV values with color coding (green for 31, yellow for 25-30, red for below 10)
4. WHEN viewing a listing THEN the Player_Shop_System SHALL display EV distribution with visual bar chart
5. WHEN viewing a listing THEN the Player_Shop_System SHALL display nature with highlighted boosted and reduced stats
6. WHEN viewing a listing THEN the Player_Shop_System SHALL display ability name and description
7. WHEN viewing a listing THEN the Player_Shop_System SHALL display all four moves with type icons
8. WHEN viewing a listing THEN the Player_Shop_System SHALL display Pitufipuntos breakdown showing contribution from each factor

### Requirement 10

**User Story:** As a developer, I want to serialize and deserialize listing data, so that data can be stored and transmitted reliably.

#### Acceptance Criteria

1. WHEN serializing a listing THEN the Player_Shop_System SHALL convert all Pokémon data, pricing, and metadata to JSON format
2. WHEN deserializing a listing THEN the Player_Shop_System SHALL reconstruct the complete listing object from JSON
3. WHEN serializing then deserializing a listing THEN the Player_Shop_System SHALL produce an equivalent listing object (round-trip consistency)
4. WHEN serializing Pitufipuntos calculation THEN the Player_Shop_System SHALL include all component values for verification
5. WHEN receiving listing data from the Minecraft_Plugin THEN the Player_Shop_System SHALL validate against the listing schema before processing
