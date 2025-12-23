# Implementation Plan - Plugin Backend Integration Fixes

## Phase 1: Critical Safety Fixes

- [x] 1. Implement MongoDB Transaction Support for Shop Purchases


  - Add MongoDB transaction wrapper for atomic shop operations
  - Ensure balance deduction, stock reduction, and purchase record creation are atomic
  - Implement automatic rollback on any operation failure
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 Write property test for shop transaction atomicity
  - **Property 1: Shop Transaction Atomicity**
  - **Validates: Requirements 1.2**



- [x] 2. Replace eval() with Safe Math Library (mathjs)


  - Install mathjs dependency
  - Create FormulaEvaluator service with whitelist validation
  - Replace eval() in level-caps.service.ts with safe evaluator
  - Add formula syntax validation before saving
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 2.1 Write property test for formula safety
  - **Property 3: Formula Safety**


  - **Validates: Requirements 3.4**



- [ ] 3. Implement Shop Refund Endpoint
  - Create POST /api/shop/refund endpoint
  - Add refund logic to ShopService
  - Update shop_transactions schema with status and refundReason fields
  - Implement automatic refund on delivery failure
  - _Requirements: 1.4, 1.5, 9.3_



- [x]* 3.1 Write property test for refund correctness


  - **Property 9: Refund Correctness**
  - **Validates: Requirements 1.4, 9.3**

- [ ] 4. Add Starter Delivery Idempotence Flag
  - Add starterDeliveryInProgress field to User schema
  - Update gacha service to set flag before delivery
  - Implement delivery status tracking and retry logic
  - Add endpoint for plugin to report delivery success/failure
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_




- [ ]* 4.1 Write property test for starter delivery idempotence
  - **Property 4: Starter Delivery Idempotence**
  - **Validates: Requirements 4.1, 4.4**

## Phase 2: Security Enhancements

- [x] 5. Upgrade Verification Code Security


  - Replace Math.random() with crypto.randomBytes() for secure code generation
  - Change code format from 5-digit numeric to 8-character alphanumeric
  - Add code expiration (15 minutes TTL)
  - Implement cleanup job for expired codes
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x]* 5.1 Write property test for verification code entropy


  - **Property 8: Verification Code Entropy**
  - **Validates: Requirements 8.1, 8.2**



- [ ] 6. Implement Rate Limiting for Verification Endpoint
  - Add rate limiter: 5 verification attempts per minute per IP
  - Return HTTP 429 with Retry-After header on limit exceeded
  - Use sliding window algorithm
  - _Requirements: 8.4, 11.2, 11.3, 11.4, 11.5_



- [ ]* 6.1 Write property test for rate limit enforcement
  - **Property 11: Rate Limit Enforcement**


  - **Validates: Requirements 11.1**

- [ ] 7. Implement Data Validation with Zod Schemas
  - Create comprehensive Zod schemas for all API endpoints
  - Add validation middleware to reject invalid requests with HTTP 400
  - Sanitize string inputs to prevent injection attacks
  - Add payload size limit (1MB) to prevent DoS
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_




- [ ]* 7.1 Write property test for data validation rejection
  - **Property 12: Data Validation Rejection**


  - **Validates: Requirements 14.1, 14.2**

## Phase 3: Performance Optimization

- [ ] 8. Implement Cache Versioning for Level Caps
  - Add version field to LevelCapsDocument schema
  - Increment version on every level cap update
  - Create GET /api/level-caps/version endpoint
  - Add lastHeartbeat field to track player connection status


  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 8.1 Write property test for level cap cache freshness
  - **Property 2: Level Cap Cache Freshness**
  - **Validates: Requirements 2.1**

- [x] 9. Add Database Indexes for Performance


  - Create index on players.minecraftUUID (unique)
  - Create index on shop_transactions (playerId, timestamp)
  - Create index on level_caps.version
  - Document all indexes in migration script
  - _Requirements: Performance optimization_

## Phase 4: Reliability & Monitoring

- [ ] 10. Implement Health Monitoring Endpoints
  - Create HealthMonitor service
  - Add GET /api/health endpoint with database/cache status checks
  - Add GET /api/metrics endpoint with Prometheus-compatible metrics
  - Track request count, error count, and response times per endpoint
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ]* 10.1 Write property test for health check accuracy
  - **Property 14: Health Check Accuracy**
  - **Validates: Requirements 10.1**

- [ ]* 10.2 Write property test for metric accuracy
  - **Property 15: Metric Accuracy**
  - **Validates: Requirements 16.1, 16.3**

- [ ] 11. Implement Audit Logging System
  - Create AuditLogger service
  - Add audit_log collection to MongoDB
  - Log all admin actions with timestamp, adminId, action, target, reason
  - Create GET /api/admin/audit endpoint for viewing logs
  - _Requirements: 15.4, 15.5_

- [ ]* 11.1 Write property test for audit log completeness
  - **Property 13: Audit Log Completeness**
  - **Validates: Requirements 15.4**

- [ ] 12. Implement Event Sourcing for Critical Operations
  - Create event_log collection in MongoDB
  - Add EventLogger service
  - Log all purchases, gacha rolls, bans, refunds with full data
  - Enable rollback capability for data corruption recovery
  - _Requirements: 15.2, 15.3_

- [ ] 13. Add Disconnect Handler Cleanup Job
  - Implement cleanup job to mark players offline after 5 minutes of no heartbeat
  - Create POST /api/players/cleanup-stale endpoint
  - Add lastHeartbeat tracking to player records

  - _Requirements: 6.3, 6.4, 6.5_

- [ ] 14. Implement Discord Webhook Notifications
  - Add Discord webhook integration for critical alerts
  - Send notifications for: backend down >5min, error rate >5%, circuit breaker open
  - Format alerts with embeds showing service, error, and duration
  - _Requirements: 10.4, 13.5_

## Phase 5: Database Schema Updates

- [x] 15. Run Database Migration Scripts

  - Add version field to level_caps collection (default: 1)
  - Add status, deliveryAttempts, refundReason to shop_transactions
  - Add starterDeliveryInProgress, lastHeartbeat to players
  - Create audit_log and event_log collections
  - _Requirements: All schema changes_

## Phase 6: Testing & Validation

- [x] 16. Checkpoint - Ensure All Tests Pass



  - Run all property-based tests (minimum 100 iterations each)
  - Run all unit tests
  - Verify all endpoints return expected responses
  - Check database schema migrations completed successfully
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 17. Integration Testing for Critical Flows
  - Test concurrent shop purchases with low stock
  - Test backend failure during purchase (verify refund)
  - Test level cap update propagation
  - Test verification code generation and validation flow
  - _Requirements: All integration scenarios_

- [ ]* 18. Performance Benchmarking
  - Benchmark shop purchase endpoint (<200ms p95)
  - Benchmark level cap query endpoint (<50ms p95)
  - Benchmark health check endpoint (<100ms p95)
  - Load test with 100 concurrent shop purchases
  - _Requirements: Performance targets_

- [ ]* 19. Security Testing
  - Test formula injection attempts (eval, require, import)
  - Test rate limit bypass attempts
  - Test verification code brute force resistance
  - Test unauthorized admin action attempts
  - _Requirements: Security validation_

## Phase 7: Documentation & Deployment

- [ ]* 20. Update API Documentation
  - Document all new endpoints with request/response examples
  - Document error codes and retry strategies
  - Document rate limits and authentication requirements
  - Create migration guide for plugin developers
  - _Requirements: Documentation_

- [ ]* 21. Create Deployment Runbook
  - Document MongoDB replica set setup requirements
  - Document environment variable configuration
  - Document rollback procedures
  - Create monitoring dashboard setup guide
  - _Requirements: Deployment preparation_
