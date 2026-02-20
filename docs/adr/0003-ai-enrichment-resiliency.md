# ADR 0003: AI Enrichment Resiliency Design

## Status

Accepted

## Date

2026-02-15

## Context

The CRM provides an AI-powered company enrichment feature that queries Google Gemini to populate company metadata (description, sector, estimated size, pain points). This feature is inherently dependent on an external, non-deterministic service with the following failure characteristics:

- **Latency variance**: Gemini response times range from 2-30 seconds depending on load.
- **Rate limiting**: The free tier enforces request quotas that can trigger 429 responses.
- **Availability**: As a preview API, Gemini may return 503 errors during capacity constraints.
- **Output quality**: LLM responses may be malformed JSON, hallucinated data, or incomplete.

The enrichment feature must not degrade the core CRM experience. A user who clicks "Enrich" should never encounter a blocked UI, a crashed page, or corrupted company data.

### Failure Modes Analyzed

| Failure Mode | Impact Without Mitigation | Mitigation Strategy |
|---|---|---|
| API timeout (>120s) | Blocked UI, spinner forever | Timeout with `Promise.race`, async processing |
| Malformed JSON response | Runtime crash on parse | Defensive parsing with fallback to `null` |
| Partial data (some fields null) | Misleading "enriched" badge | Distinct `partial` status with visual indicator |
| API key missing | Silent failure, no feedback | Explicit `api_key_missing` error, user-facing message |
| Repeated failures (API down) | Wasted requests, slow feedback | Circuit breaker pattern (fast fail) |
| Invalid data persisted | Corrupted company record | Write only parsed, validated fields; never overwrite existing data with null |

## Decision

Design the enrichment pipeline as a **fire-and-forget async operation** with the following resiliency guarantees:

### 1. Asynchronous Processing

Enrichment is split into two phases:
- **`startEnrichment`**: Validates preconditions, sets status to `processing`, returns immediately to the client.
- **`runEnrichment`**: Executes the Gemini call asynchronously (via API route). The UI polls or refreshes to check status.

This ensures the user never waits for an LLM response in a synchronous request cycle.

### 2. Timeout Boundary

Every Gemini call is wrapped in `Promise.race` with a 120-second deadline. Timeout triggers the same error path as a network failure — the company reverts to `not_enriched` status.

### 3. Defensive Response Parsing

The Gemini response is parsed with:
- JSON cleanup (strip markdown fences).
- Type-checked field extraction (each field validated individually).
- Graceful degradation: missing fields become `null`, not errors.

### 4. Tri-State Status Model

Companies carry an `enrichmentStatus` field with three values:
- `not_enriched` — no data, enrichment available.
- `processing` — enrichment in progress, UI shows spinner.
- `enriched` — all fields populated.
- `partial` — some fields populated, others null.

The `partial` state is surfaced in the UI with a distinct badge, informing the user that data is incomplete without implying failure.

### 5. Circuit Breaker

A circuit breaker wraps the Gemini call to prevent cascading failures:
- **Closed** (normal): Requests pass through.
- **Open** (after 3 consecutive failures): Requests fail immediately for 2 minutes without making external calls.
- **Half-Open** (after cooldown): One probe request is allowed. Success closes the circuit; failure re-opens it.

This protects against sustained API outages and provides fast feedback to users during downtime.

### 6. Idempotent Re-enrichment

The `force` flag allows re-running enrichment on already-enriched companies. This is safe because:
- The entire enrichment result is replaced atomically (single `UPDATE` statement).
- The status transitions through `processing` before the new data is written.
- Concurrent enrichment requests for the same company are deduplicated by the `processing` status check.

## Consequences

### Positive

- **Zero UI blocking**: The enrichment button returns instantly. Users can continue working while enrichment runs.
- **Graceful degradation**: Every failure mode results in a defined, recoverable state. No company record is ever corrupted by a failed enrichment.
- **Observable state**: The tri-state model gives the UI sufficient information to render appropriate feedback (spinner, badge, retry button) without leaking implementation details.
- **Cost protection**: The circuit breaker prevents burning API quota during outages.

### Negative

- **Eventual consistency**: The user must refresh or re-check to see enrichment results. There is no real-time push notification when enrichment completes.
- **Status polling overhead**: Without WebSockets, the client must poll for status updates, adding minor server load.
- **Complexity**: The async pipeline, status model, and circuit breaker introduce more moving parts than a simple synchronous API call.

### Mitigations

- `router.refresh()` after enrichment trigger provides a reasonable "check again" pattern without explicit polling.
- The circuit breaker is implemented as a stateless utility with in-memory state, adding minimal complexity.
- Comprehensive test coverage validates each failure mode independently.
