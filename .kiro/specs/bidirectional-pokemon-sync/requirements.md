# Requirements Document

## Introduction

Bidirectional Pokemon Sync system that allows administrators to delete Pokemon from the database and have those deletions reflected in-game. Currently, the plugin only syncs data TO the backend. This feature adds the reverse: backend commands that the plugin executes.

## Glossary

- **Sync_System**: The WebSyncManager that handles data synchronization between plugin and backend
- **Pending_Command**: An action queued in the backend that the plugin should execute
- **Pokemon_UUID**: The unique identifier of a Pokemon in Cobblemon

## Requirements

### Requirement 1: Backend Command Queue

**User Story:** As an admin, I want to queue Pokemon deletion commands in the backend, so that they are executed when the player is online.

#### Acceptance Criteria

1. WHEN an admin deletes a Pokemon from the database THEN the Sync_System SHALL create a pending command with type "DELETE_POKEMON" and the Pokemon UUID
2. WHEN a pending command is created THEN the Sync_System SHALL store the player UUID, command type, and Pokemon UUID
3. WHEN a command is stored THEN the Sync_System SHALL mark it as "pending" status

### Requirement 2: Plugin Command Polling

**User Story:** As the system, I want the plugin to check for pending commands, so that database changes are reflected in-game.

#### Acceptance Criteria

1. WHEN a player logs in THEN the Sync_System SHALL check for pending commands for that player
2. WHEN the periodic sync runs THEN the Sync_System SHALL include pending commands in the response
3. WHEN the plugin receives a DELETE_POKEMON command THEN the Sync_System SHALL remove the Pokemon from the player's party or PC
4. WHEN a command is executed successfully THEN the Sync_System SHALL mark it as "completed" in the backend
5. IF the Pokemon is not found THEN the Sync_System SHALL mark the command as "failed" with reason

### Requirement 3: Admin Interface

**User Story:** As an admin, I want a simple way to delete Pokemon from the admin panel, so that I can manage player inventories.

#### Acceptance Criteria

1. WHEN viewing a player's Pokemon in admin panel THEN the Sync_System SHALL show a delete button for each Pokemon
2. WHEN clicking delete THEN the Sync_System SHALL confirm the action before proceeding
3. WHEN deletion is confirmed THEN the Sync_System SHALL remove from database AND queue the in-game deletion command
4. WHEN the command is executed THEN the Sync_System SHALL show the status in the admin panel
