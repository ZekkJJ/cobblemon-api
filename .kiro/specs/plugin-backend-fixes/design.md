# Design Document - Plugin Backend Integration Fixes

## Overview

This design addresses 39 critical bugs and performance issues in the integration between the Minecraft Plugin v2 (Fabric/Java) and the Backend API (Node.js/TypeScript). The fixes focus on data integrity, security, performance optimization, and reliability across 7 major categories:

1. **Transaction Safety**: Preventing race conditions and data corruption in shop purchases
2. **Cache Consistency**: Ensuring level caps and other cached data remain synchronized
3. **Security**: Eliminating code injection vulnerabilities and strengthening authentication
4. **Performance**: Optimizing sync operations and reducing server load
5. **Reliability**: Implementing retry logic, circuit breakers, and graceful degradation
6. **Monitoring**: Adding health checks, logging, and metrics
7. **Data Integrity**: Validating and sanitizing all data flows

The design maintains backward compatibility where possible while introducing new patterns like circuit breakers, event sourcing, and centralized logging.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Minecraft Server                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Plugin v2 (Fabric/Java)                    │     │
│  │  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │ Circuit      │  │ Local Cache  │               │     │
│  │  │ Breaker      │  │ (30s TTL)    │               │     │
│  │  └──────────────┘  └──────────────┘               │     │
│  │  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │ Rate Limiter │  │ Retry Queue  │               │     │
│  │  └──────────────┘  └──────────────┘               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │ Rate Limiter │  │ Validation   │               │     │
│  │  │ (express)    │  │ (Zod)        │               │     │
│  │  └──────────────┘  └──────────────┘               │     │
│  │  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │ Transaction  │  │ Safe Math    │               │     │
│  │  │ Manager      │  │ (mathjs)     │               │     │
│  │  └──────────────┘  └──────────────┘               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Collections: players, shops, transactions,        │     │
│  │               level_caps, audit_logs, event_log    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Design Decisions

**Decision 1: Circuit Breaker Pattern**
- **Rationale**: Prevents cascading failures when backend is down. Plugin can continue operating with cached data rather than blocking gameplay.
- **Trade-off**: Slightly stale data during outages vs complete service disruption.

**Decision 2: MongoDB Transactions**
- **Rationale**: Ensures atomic operations for shop purchases (balance deduction + stock update + purchase record).
- **Trade-off**: Requires MongoDB replica set, but prevents data corruption.

**Decision 3: Safe Math Library (mathjs)**
- **Rationale**: Eliminates eval() vulnerability while maintaining formula flexibility.
- **Trade-off**: Slightly more complex syntax, but dramatically improves security.

**Decision 4: Event Sourcing for Critical Operations**
- **Rationale**: Provides audit trail and enables rollback for purchases, gacha rolls, and bans.
- **Trade-off**: Additional storage overhead, but essential for debugging and recovery.

**Decision 5: Batch Sync with Compression**
- **Rationale**: Reduces network overhead and server load by syncing 5-10 players at once with gzip.
- **Trade-off**: Slightly more complex implementation, but 60-80% reduction in bandwidth.

## Components and Interfaces

### Backend Components

#### 1. Transaction Manager (New)
```typescript
interface TransactionManager {
  executeShopPurchase(
    playerId: string,
    itemId: string,
    quantity: number
  ): Promise<PurchaseResult>;
  
  refundPurchase(
    transactionId: string,
    reason: string
  ): Promise<RefundResult>;
}
```

**Responsibilities**:
- Wrap shop purchases in MongoDB transactions
- Handle rollback on failure
- Record all operations in event log

#### 2. Safe Formula Evaluator (New)
```typescript
interface FormulaEvaluator {
  validate(formula: string): ValidationResult;
  evaluate(formula: string, context: Record<string, number>): number;
}
```

**Responsibilities**:
- Parse formulas using mathjs
- Whitelist safe operators only
- Reject dangerous expressions

#### 3. Cache Manager (Enhanced)
```typescript
interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl: number): void;
  invalidate(key: string): void;
  getVersion(key: string): number;
  incrementVersion(key: string): void;
}
```

**Responsibilities**:
- Manage TTL-based caching
- Track version numbers for cache invalidation
- Provide cache statistics

#### 4. Health Monitor (New)
```typescript
interface HealthMonitor {
  checkDatabase(): Promise<HealthStatus>;
  checkCache(): Promise<HealthStatus>;
  getMetrics(): SystemMetrics;
}
```

**Responsibilities**:
- Monitor database connectivity
- Track response times
- Expose Prometheus metrics

#### 5. Audit Logger (New)
```typescript
interface AuditLogger {
  logAdminAction(
    adminId: string,
    action: string,
    target: string,
    reason: string
  ): Promise<void>;
  
  logCriticalEvent(
    source: string,
    event: string,
    data: Record<string, any>
  ): Promise<void>;
}
```

**Responsibilities**:
- Record all admin actions
- Store critical events for debugging
- Provide query interface for logs

### Plugin Components (Java)

#### 1. Circuit Breaker (New)
```java
interface CircuitBreaker {
  <T> CompletableFuture<T> execute(Supplier<CompletableFuture<T>> operation);
  CircuitState getState();
  void reset();
}
```

**States**: CLOSED (normal), OPEN (failing), HALF_OPEN (testing)

#### 2. Retry Queue (New)
```java
interface RetryQueue {
  void enqueue(RetryableOperation operation);
  void processQueue();
  int getQueueSize();
}
```

**Responsibilities**:
- Queue failed operations (disconnect notifications, logs)
- Retry with exponential backoff
- Discard after max attempts

#### 3. Batch Sync Manager (Enhanced)
```java
interface BatchSyncManager {
  void scheduleBatchSync(List<Player> players);
  CompletableFuture<SyncResult> syncBatch(List<Player> players);
  byte[] compressPayload(SyncData data);
}
```

**Responsibilities**:
- Group 5-10 players per batch
- Compress with gzip
- Track sync performance

#### 4. Local Rate Limiter (New)
```java
interface RateLimiter {
  boolean allowRequest(UUID playerId, String operation);
  void resetLimits();
}
```

**Responsibilities**:
- Enforce 1 command/second per player
- Prevent command spam
- Track violations

## Data Models

### Enhanced Models

#### Shop Transaction (Enhanced)
```typescript
interface ShopTransaction {
  _id: ObjectId;
  playerId: string;
  itemId: string;
  quantity: number;
  totalCost: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  refundReason?: string;
  deliveryAttempts: number;
  lastDeliveryAttempt?: Date;
}
```

#### Level Cap Configuration (Enhanced)
```typescript
interface LevelCapConfig {
  _id: ObjectId;
  capType: 'global' | 'badge-based';
  formula?: string; // Safe math expression
  staticValue?: number;
  version: number; // Incremented on change
  lastModified: Date;
  modifiedBy: string;
}
```

#### Event Log (New)
```typescript
interface EventLogEntry {
  _id: ObjectId;
  timestamp: Date;
  source: 'plugin' | 'backend' | 'admin';
  eventType: 'purchase' | 'gacha' | 'ban' | 'refund' | 'sync';
  playerId?: string;
  data: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}
```

#### Audit Log (New)
```typescript
interface AuditLogEntry {
  _id: ObjectId;
  timestamp: Date;
  adminId: string;
  adminUsername: string;
  action: string;
  target: string;
  reason: string;
  changes?: Record<string, any>;
}
```

#### System Metrics (New)
```typescript
interface SystemMetrics {
  timestamp: Date;
  endpoints: Record<string, EndpointMetrics>;
  database: DatabaseMetrics;
  cache: CacheMetrics;
}

interface EndpointMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
}
```

### Database Schema Changes

**New Collections**:
- `event_log`: Stores all critical events for debugging
- `audit_log`: Records admin actions
- `system_metrics`: Stores performance metrics (optional, can use external monitoring)

**Modified Collections**:
- `shop_transactions`: Add `status`, `deliveryAttempts`, `refundReason`
- `level_caps`: Add `version`, `lastModified`, `modifiedBy`
- `players`: Add `lastHeartbeat`, `starterDeliveryInProgress`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Shop Transaction Atomicity
*For any* shop purchase request, either all operations (balance deduction, stock reduction, transaction record) succeed together, or all fail together with no partial state changes.
**Validates: Requirements 1.2**

### Property 2: Level Cap Cache Freshness
*For any* level cap query from the plugin, the returned value must not be older than 30 seconds from the last backend update.
**Validates: Requirements 2.1**

### Property 3: Formula Safety
*For any* level cap formula string, if it contains operators outside the whitelist (+, -, *, /, %, min, max, floor, ceil), the system must reject it before saving.
**Validates: Requirements 3.4**

### Property 4: Starter Delivery Idempotence
*For any* player, calling the starter delivery endpoint multiple times should result in exactly one starter being delivered, regardless of timing or failures.
**Validates: Requirements 4.1, 4.4**

### Property 5: Sync Payload Compression
*For any* sync payload larger than 1KB, the compressed size using gzip should be at least 40% smaller than the original size.
**Validates: Requirements 5.4**

### Property 6: Disconnect Notification Delivery
*For any* player disconnect event, the offline notification must eventually be delivered to the backend within 3 retry attempts or queued for later delivery.
**Validates: Requirements 6.1, 6.2**

### Property 7: Balance Consistency
*For any* player, querying balance from backend and plugin cache (within TTL) should return the same value, or plugin should invalidate cache and refetch.
**Validates: Requirements 7.2, 7.3**

### Property 8: Verification Code Entropy
*For any* generated verification code, it must be 8 characters long, alphanumeric, and have sufficient entropy to prevent brute force attacks (at least 2^40 possible combinations).
**Validates: Requirements 8.1, 8.2**

### Property 9: Refund Correctness
*For any* failed shop purchase, if the balance was deducted, the refund operation must restore the exact amount that was deducted.
**Validates: Requirements 1.4, 9.3**

### Property 10: Circuit Breaker State Transitions
*For any* circuit breaker, the state transitions must follow the pattern: CLOSED → OPEN (after 3 failures) → HALF_OPEN (after 60s) → CLOSED (on success) or back to OPEN (on failure).
**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 11: Rate Limit Enforcement
*For any* player making requests, if they exceed 1 command per second, subsequent requests within that second must be rejected.
**Validates: Requirements 11.1**

### Property 12: Data Validation Rejection
*For any* incoming request with invalid data according to Zod schemas, the system must return HTTP 400 with specific field errors before processing.
**Validates: Requirements 14.1, 14.2**

### Property 13: Audit Log Completeness
*For any* admin action that modifies data, an audit log entry must be created with timestamp, admin ID, action, target, and reason before the action completes.
**Validates: Requirements 15.4**

### Property 14: Health Check Accuracy
*For any* health check request, if the database is unreachable, the health endpoint must return unhealthy status within 5 seconds.
**Validates: Requirements 10.1**

### Property 15: Metric Accuracy
*For any* endpoint, the recorded request count must equal the sum of successful responses and error responses.
**Validates: Requirements 16.1, 16.3**

## Error Handling

### Error Categories

#### 1. Transient Errors (Retry)
- Network timeouts
- Database connection failures
- Rate limit exceeded (429)

**Strategy**: Exponential backoff retry (3 attempts: 1s, 2s, 4s)

#### 2. Permanent Errors (Fail Fast)
- Invalid item IDs
- Insufficient balance
- Validation failures (400)
- Authentication failures (401, 403)

**Strategy**: Return error immediately, log for debugging

#### 3. Critical Errors (Alert + Degrade)
- Backend down for >5 minutes
- Database corruption detected
- Circuit breaker open

**Strategy**: Send Discord alert, enter degraded mode, use cached data

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // e.g., "INSUFFICIENT_BALANCE"
    message: string; // Human-readable
    details?: Record<string, any>; // Field-specific errors
    retryable: boolean;
    retryAfter?: number; // Seconds
  };
}
```

### Degraded Mode Behavior

When circuit breaker opens:
- **Disable**: Shop purchases, gacha rolls, verification code generation
- **Enable**: Level cap queries (cached), player data queries (cached), read-only operations
- **Notify**: Admins via Discord webhook, players via in-game message

## Testing Strategy

### Unit Testing

**Backend (Vitest)**:
- Transaction manager rollback logic
- Formula evaluator with malicious inputs
- Cache manager TTL and versioning
- Rate limiter sliding window algorithm
- Validation schemas with edge cases

**Plugin (JUnit)**:
- Circuit breaker state transitions
- Retry queue with exponential backoff
- Batch sync grouping logic
- Local rate limiter enforcement

### Property-Based Testing

**Framework**: fast-check (TypeScript), jqwik (Java)

**Test Configuration**: Minimum 100 iterations per property

**Properties to Test**:
1. Shop transaction atomicity (Property 1)
2. Formula safety validation (Property 3)
3. Starter delivery idempotence (Property 4)
4. Balance consistency (Property 7)
5. Circuit breaker transitions (Property 10)
6. Rate limit enforcement (Property 11)
7. Data validation rejection (Property 12)

### Integration Testing

**Scenarios**:
1. Concurrent shop purchases (10 players, same item, low stock)
2. Backend failure during purchase (verify refund)
3. Level cap update propagation (verify cache invalidation)
4. Circuit breaker opening and recovery
5. Batch sync with network delays

### Performance Testing

**Benchmarks**:
- Shop purchase: <200ms (p95)
- Level cap query: <50ms (p95)
- Batch sync (10 players): <1s (p95)
- Health check: <100ms (p95)

**Load Testing**:
- 100 concurrent shop purchases
- 1000 level cap queries/minute
- 50 players syncing simultaneously

### Security Testing

**Scenarios**:
1. Formula injection attempts (eval, require, import)
2. SQL injection in player names
3. Rate limit bypass attempts
4. Verification code brute force
5. Unauthorized admin action attempts

## Implementation Phases

### Phase 1: Critical Safety Fixes (Week 1)
- Shop transaction atomicity (MongoDB transactions)
- Formula evaluator security (replace eval with mathjs)
- Starter delivery idempotence (delivery flags)
- Basic refund endpoint

### Phase 2: Performance Optimization (Week 2)
- Batch sync implementation
- Gzip compression
- Cache versioning for level caps
- Circuit breaker pattern

### Phase 3: Reliability Improvements (Week 3)
- Retry queue for disconnect notifications
- Health monitoring endpoints
- Rate limiting (backend and plugin)
- Degraded mode logic

### Phase 4: Observability (Week 4)
- Centralized logging
- Audit log implementation
- Metrics endpoint (Prometheus format)
- Event sourcing for critical operations

### Phase 5: Testing & Validation (Week 5)
- Property-based tests for all 15 properties
- Integration tests for critical flows
- Load testing and performance validation
- Security audit

## Deployment Strategy

### Backend Deployment

**Prerequisites**:
- MongoDB replica set (required for transactions)
- Environment variables for Discord webhooks
- Backup of current database

**Steps**:
1. Deploy new endpoints without breaking changes
2. Run database migration to add new fields
3. Enable transaction support
4. Monitor error rates for 24 hours
5. Enable new features gradually (feature flags)

### Plugin Deployment

**Prerequisites**:
- Test server with Cobblemon installed
- Backup of player data

**Steps**:
1. Deploy to test server first
2. Verify circuit breaker and retry logic
3. Test with backend intentionally down
4. Deploy to production during low-traffic period
5. Monitor logs for errors

### Rollback Plan

**Backend**:
- Keep old endpoints active for 1 week
- Feature flags to disable new features
- Database migration rollback scripts

**Plugin**:
- Keep previous JAR file available
- Document configuration changes
- Provide downgrade instructions

## Monitoring and Alerts

### Key Metrics

**Backend**:
- Request rate per endpoint
- Error rate (target: <1%)
- Response time p95 (target: <500ms)
- Database connection pool usage
- Cache hit rate (target: >80%)

**Plugin**:
- Circuit breaker state changes
- Retry queue size (alert if >100)
- Sync operation duration
- Failed API calls per minute

### Alert Conditions

**Critical (Immediate)**:
- Backend down for >5 minutes
- Error rate >5% for >5 minutes
- Database connection failures
- Circuit breaker open for >10 minutes

**Warning (Review within 1 hour)**:
- Response time p95 >1s
- Cache hit rate <60%
- Retry queue size >50
- Sync operation >5s

### Discord Webhook Notifications

**Format**:
```json
{
  "embeds": [{
    "title": "🚨 Critical Alert",
    "description": "Backend health check failing",
    "color": 15158332,
    "fields": [
      {"name": "Service", "value": "Backend API"},
      {"name": "Error", "value": "Database connection timeout"},
      {"name": "Duration", "value": "5 minutes"}
    ],
    "timestamp": "2025-12-22T10:30:00Z"
  }]
}
```

## Security Considerations

### Authentication
- Continue using existing Discord OAuth for web
- Plugin uses API key in Authorization header
- API keys rotated every 90 days

### Authorization
- Admin endpoints require `isAdmin: true` in JWT
- Plugin endpoints require valid API key
- Rate limiting per IP and per player

### Input Validation
- All inputs validated with Zod schemas
- String inputs sanitized to prevent injection
- Payload size limited to 1MB

### Audit Trail
- All admin actions logged with reason
- Critical operations logged in event log
- Logs retained for 30 days

## Performance Optimization

### Caching Strategy

**Level Caps**: 30-second TTL, version-based invalidation
**Player Data**: 60-second TTL, invalidate on write
**Shop Items**: 5-minute TTL, invalidate on stock change

### Database Indexing

```javascript
// Required indexes
db.players.createIndex({ minecraftUUID: 1 }, { unique: true });
db.shop_transactions.createIndex({ playerId: 1, timestamp: -1 });
db.event_log.createIndex({ timestamp: -1, eventType: 1 });
db.audit_log.createIndex({ timestamp: -1, adminId: 1 });
db.level_caps.createIndex({ version: 1 });
```

### Connection Pooling

**MongoDB**: Pool size 10-50 connections
**HTTP Client (Plugin)**: Connection pool size 20, keep-alive enabled

### Batch Operations

- Sync 5-10 players per batch
- Log entries batched every 30 seconds
- Metrics aggregated every 60 seconds

## Backward Compatibility

### API Versioning

New endpoints use `/api/v2/` prefix:
- `/api/v2/shop/purchase` (with transactions)
- `/api/v2/shop/refund` (new)
- `/api/v2/health` (new)
- `/api/v2/metrics` (new)

Old endpoints remain active for 1 month with deprecation warnings.

### Configuration Migration

Plugin config adds new sections:
```yaml
circuitBreaker:
  enabled: true
  failureThreshold: 3
  timeout: 60

retryPolicy:
  maxAttempts: 3
  backoffMultiplier: 2

sync:
  batchSize: 10
  compressionEnabled: true
```

Defaults provided for all new settings.

## Future Enhancements

### Phase 6 (Future)
- WebSocket for real-time updates (eliminate polling)
- Redis for distributed caching
- Kafka for event streaming
- GraphQL API for flexible queries
- Machine learning for fraud detection

### Technical Debt
- Migrate remaining eval() usage in other modules
- Standardize error codes across all endpoints
- Add OpenAPI/Swagger documentation
- Implement request tracing (distributed tracing)

## Appendix

### Dependencies

**Backend (New)**:
- `mathjs`: ^12.0.0 (safe formula evaluation)
- `zod`: ^3.22.0 (schema validation)
- `prom-client`: ^15.0.0 (Prometheus metrics)

**Plugin (New)**:
- `resilience4j`: 2.1.0 (circuit breaker)
- `caffeine`: 3.1.8 (local caching)

### Configuration Examples

**Backend .env**:
```
MONGODB_URI=mongodb://localhost:27017/cobblemon?replicaSet=rs0
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
CIRCUIT_BREAKER_ENABLED=true
```

**Plugin config.yml**:
```yaml
backend:
  url: "https://api.example.com"
  apiKey: "${API_KEY}"
  timeout: 5000
  
circuitBreaker:
  enabled: true
  failureThreshold: 3
  timeout: 60000
  
cache:
  levelCapsTTL: 30
  playerDataTTL: 60
```

### Migration Scripts

**Add version to level_caps**:
```javascript
db.level_caps.updateMany(
  { version: { $exists: false } },
  { $set: { version: 1, lastModified: new Date() } }
);
```

**Add status to shop_transactions**:
```javascript
db.shop_transactions.updateMany(
  { status: { $exists: false } },
  { $set: { status: 'completed', deliveryAttempts: 0 } }
);
```
