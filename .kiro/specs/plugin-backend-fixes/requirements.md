# Requirements Document - Plugin Backend Integration Fixes

## Introduction

This document defines requirements for fixing critical bugs and performance issues in the integration between the Minecraft Plugin v2 (Fabric/Java) and the Backend API (Node.js/TypeScript). The analysis identified 39 problems across 7 categories that cause data corruption, security vulnerabilities, performance degradation, and poor user experience.

## Glossary

- **Plugin**: Minecraft Fabric mod (Java) that runs on the game server
- **Backend**: Node.js/Express API that stores data in MongoDB
- **Level Cap**: Maximum level limit for capturing/owning Pokémon
- **Cache**: Temporary storage of data to reduce API calls
- **Race Condition**: Bug where two operations interfere with each other
- **Atomic Operation**: Database operation that completes fully or not at all
- **Round Trip**: Serializing then deserializing data to verify integrity
- **Circuit Breaker**: Pattern that stops calling failing services
- **Health Check**: Endpoint to verify system is working correctly

## Requirements

### Requirement 1: Shop Transaction Safety

**User Story:** As a player, I want my shop purchases to be safe, so that I don't lose money or items due to bugs.

#### Acceptance Criteria

1. WHEN two players purchase the same item simultaneously THEN The System SHALL use atomic MongoDB operations to prevent race conditions
2. WHEN a player purchases items THEN The System SHALL use MongoDB transactions to ensure balance deduction, stock reduction, and purchase record creation all succeed or all fail
3. WHEN stock reaches zero THEN The System SHALL prevent additional purchases even if requests arrive simultaneously
4. WHEN a purchase fails after payment THEN The System SHALL automatically refund the player's balance
5. WHEN the plugin cannot deliver items (invalid item ID) THEN The System SHALL implement automatic refund via `/api/shop/refund` endpoint


### Requirement 2: Level Caps Cache Consistency

**User Story:** As an administrator, I want level cap changes to apply immediately, so that players cannot bypass limits.

#### Acceptance Criteria

1. WHEN the plugin requests level caps THEN The System SHALL return caps that are never more than 30 seconds old
2. WHEN an administrator changes level caps THEN The System SHALL increment a version number that the plugin can poll
3. WHEN the plugin detects a version change THEN The System SHALL invalidate its cache and fetch new caps
4. WHEN the backend is unreachable THEN The Plugin SHALL use the last known good caps instead of defaults
5. WHEN a player captures a Pokémon THEN The Plugin SHALL verify the level cap BEFORE the capture completes, not after

### Requirement 3: Backend Formula Security

**User Story:** As a system administrator, I want formula evaluation to be secure, so that malicious admins cannot execute arbitrary code.

#### Acceptance Criteria

1. WHEN evaluating level cap formulas THEN The System SHALL use a safe math library (mathjs or expr-eval) instead of eval()
2. WHEN an administrator saves a formula THEN The System SHALL validate syntax before saving
3. WHEN a formula contains invalid operators THEN The System SHALL reject it with a descriptive error
4. THE System SHALL whitelist only safe operators: +, -, *, /, %, min, max, floor, ceil
5. THE System SHALL reject formulas containing: require, import, function, eval, or any method calls

### Requirement 4: Starter Delivery Safety

**User Story:** As a player, I want to receive exactly one starter Pokémon, so that I don't get duplicates or lose my starter.

#### Acceptance Criteria

1. WHEN the plugin gives a starter THEN The System SHALL set a flag `starterDeliveryInProgress` to prevent concurrent deliveries
2. WHEN adding a Pokémon to party fails THEN The Plugin SHALL notify the backend to mark delivery as failed
3. WHEN a player receives a Pokémon from another source during delivery THEN The Plugin SHALL detect this and abort starter delivery
4. WHEN starter delivery fails THEN The Backend SHALL allow retry without marking as delivered
5. WHEN starter delivery succeeds THEN The Plugin SHALL verify the Pokémon was added before notifying backend


### Requirement 5: Sync Performance Optimization

**User Story:** As a player, I want the server to run smoothly, so that I don't experience lag during gameplay.

#### Acceptance Criteria

1. WHEN syncing player data THEN The Plugin SHALL only sync party (6 Pokémon) by default, not PC storage
2. WHEN a player uses `/syncpc` command THEN The Plugin SHALL sync PC storage on-demand
3. WHEN syncing multiple players THEN The Plugin SHALL batch sync 5-10 players in parallel instead of one at a time
4. WHEN building sync payload THEN The Plugin SHALL compress data with gzip before sending
5. WHEN sync takes longer than 5 seconds THEN The Plugin SHALL log a warning and skip that player for this cycle

### Requirement 6: Disconnect Handler Reliability

**User Story:** As a player, I want my online status to be accurate, so that others know when I'm actually playing.

#### Acceptance Criteria

1. WHEN a player disconnects THEN The Plugin SHALL retry the offline notification up to 3 times with exponential backoff
2. WHEN the backend is unreachable during disconnect THEN The Plugin SHALL queue the notification for later delivery
3. WHEN the backend receives a disconnect notification THEN The System SHALL mark the player offline immediately
4. THE Backend SHALL run a cleanup job every 5 minutes to mark players offline if no heartbeat received
5. THE Backend SHALL expose `/api/players/cleanup-stale` endpoint for manual cleanup

### Requirement 7: CobbleDollars Synchronization

**User Story:** As a player, I want my balance to be accurate, so that I can make purchases without errors.

#### Acceptance Criteria

1. THE Backend SHALL be the single source of truth for CobbleDollars balance
2. WHEN the plugin needs balance THEN The Plugin SHALL query the backend with 30-second cache TTL
3. WHEN CobbleDollars mod changes balance THEN The Plugin SHALL detect the change and sync to backend
4. WHEN a web purchase occurs THEN The Backend SHALL update balance immediately
5. WHEN balance sync fails THEN The Plugin SHALL use cached value and retry in background


### Requirement 8: Verification Code Security

**User Story:** As a player, I want verification codes to be secure, so that others cannot guess my code.

#### Acceptance Criteria

1. WHEN generating verification codes THEN The Plugin SHALL use SecureRandom instead of Random
2. THE System SHALL generate 8-character alphanumeric codes instead of 5-digit numeric
3. WHEN a code is generated THEN The System SHALL expire it after 15 minutes
4. THE Backend SHALL implement rate limiting: maximum 5 verification attempts per minute per IP
5. THE System SHALL run a cleanup job to remove expired codes from memory

### Requirement 9: Shop Inventory Management

**User Story:** As a player, I want to receive my purchased items even if my inventory is full, so that I don't lose items.

#### Acceptance Criteria

1. WHEN a player's inventory is full THEN The Plugin SHALL drop items on the ground at player's location
2. WHEN items are dropped THEN The Plugin SHALL notify the player with coordinates
3. WHEN the plugin cannot create an item THEN The Plugin SHALL call `/api/shop/refund` to return the money
4. THE Plugin SHALL validate item IDs against a hardcoded whitelist before attempting to create them
5. WHEN claim fails THEN The Plugin SHALL NOT mark the purchase as claimed, allowing retry

### Requirement 10: Health Monitoring

**User Story:** As a system administrator, I want to know when systems are failing, so that I can fix problems quickly.

#### Acceptance Criteria

1. THE Backend SHALL expose `/api/health` endpoint returning status of database, cache, and services
2. THE Plugin SHALL check backend health every 60 seconds
3. WHEN backend is unhealthy for 5 minutes THEN The Plugin SHALL enter degraded mode and disable non-critical features
4. WHEN entering degraded mode THEN The Plugin SHALL send notification to Discord webhook
5. THE System SHALL expose `/api/metrics` endpoint with Prometheus-compatible metrics


### Requirement 11: Rate Limiting and Abuse Prevention

**User Story:** As a system administrator, I want to prevent abuse, so that the server remains stable.

#### Acceptance Criteria

1. THE Plugin SHALL implement local rate limiting: 1 command per second per player
2. THE Backend SHALL implement global rate limiting: 100 requests per minute per IP for read endpoints
3. THE Backend SHALL implement stricter rate limiting: 20 requests per minute per IP for write endpoints
4. WHEN rate limit is exceeded THEN The System SHALL return HTTP 429 with Retry-After header
5. THE System SHALL use sliding window algorithm for rate limiting instead of fixed window

### Requirement 12: Centralized Logging

**User Story:** As a system administrator, I want to see all logs in one place, so that I can debug problems easily.

#### Acceptance Criteria

1. THE Plugin SHALL send critical errors to backend via `/api/logs` endpoint
2. THE Backend SHALL store logs in MongoDB with timestamp, level, source, and message
3. THE System SHALL expose `/api/admin/logs` endpoint for viewing logs with filters
4. THE Plugin SHALL batch log entries and send every 30 seconds to reduce overhead
5. THE System SHALL automatically delete logs older than 30 days

### Requirement 13: Circuit Breaker Pattern

**User Story:** As a player, I want the plugin to work even when the backend is down, so that I can still play.

#### Acceptance Criteria

1. WHEN backend fails 3 consecutive times THEN The Plugin SHALL open the circuit breaker
2. WHEN circuit is open THEN The Plugin SHALL use cached data and disable features that require backend
3. WHEN circuit is open for 60 seconds THEN The Plugin SHALL attempt one test request (half-open state)
4. WHEN test request succeeds THEN The Plugin SHALL close the circuit and resume normal operation
5. THE Plugin SHALL log circuit state changes and notify admins via Discord


### Requirement 14: Data Validation and Sanitization

**User Story:** As a system administrator, I want all data to be validated, so that corrupt data doesn't enter the system.

#### Acceptance Criteria

1. THE Backend SHALL validate all incoming data using Zod schemas before processing
2. WHEN validation fails THEN The System SHALL return HTTP 400 with specific field errors
3. THE Plugin SHALL validate Pokémon data before sending to backend
4. THE System SHALL sanitize all string inputs to prevent injection attacks
5. THE Backend SHALL reject payloads larger than 1MB to prevent DoS attacks

### Requirement 15: Backup and Recovery

**User Story:** As a system administrator, I want to recover from data corruption, so that players don't lose progress.

#### Acceptance Criteria

1. THE Backend SHALL create daily backups of MongoDB database
2. THE System SHALL implement event sourcing for critical operations (purchases, gacha rolls, bans)
3. WHEN data corruption is detected THEN The System SHALL allow rollback to previous state
4. THE System SHALL maintain audit log of all admin actions with timestamp and reason
5. THE Backend SHALL expose `/api/admin/audit` endpoint for viewing audit logs

### Requirement 16: Performance Monitoring

**User Story:** As a system administrator, I want to monitor performance, so that I can optimize slow operations.

#### Acceptance Criteria

1. THE Backend SHALL log response time for all API endpoints
2. WHEN an endpoint takes longer than 1 second THEN The System SHALL log a warning
3. THE System SHALL track error rate per endpoint
4. THE Backend SHALL expose `/api/metrics` with: request count, error count, average response time
5. THE System SHALL send alerts to Discord when error rate exceeds 5% for 5 minutes

