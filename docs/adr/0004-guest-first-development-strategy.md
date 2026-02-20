# ADR 0004: Guest-First Development Strategy

## Status

Accepted

## Date

2026-02-15

## Context

The application serves as a demonstration CRM for prospective clients. The primary audience is technical reviewers who will evaluate the codebase within a 5-minute window. Two constraints dominate the development strategy:

1. **Zero-friction evaluation**: Reviewers must be able to explore the application immediately, without registration or login.
2. **Consistent demo state**: Every reviewer must see the same curated seed data that showcases all features (enrichment, pipeline stages, timeline activity, NBA suggestions).

### Development Order Dilemma

Traditional web applications implement authentication early (often as the first feature) because most routes depend on user identity. This creates a problem for demo-oriented projects:

- Authentication implemented first means every feature is built behind a login wall. Testing requires credentials. Demo sharing requires account provisioning.
- Authentication implemented last means the application is usable throughout development. The demo is functional from day one.

### Approaches Evaluated

| Approach | Advantage | Risk |
|---|---|---|
| Auth-first, skip for dev | Conventional, auth tested from start | Features coupled to auth early, demo requires credentials |
| Auth-last (guest-first) | Demo works immediately, features testable in isolation | Auth integration may require refactoring |
| Auth optional (feature flag) | Flexible | Complexity of dual paths, risk of divergence |

## Decision

Adopt a **guest-first development strategy**: build the entire application as a functional system without authentication, then layer auth and RBAC as the final epic.

### Implementation Details

1. **Development order**: All CRUD, pipeline, dashboard, enrichment, and NBA features are built and tested without any auth dependency. Authentication (Auth.js v5, JWT, RBAC) is added as the last implementation epic.

2. **Guest mode**: A pre-created user with role `guest` is automatically selected when no session exists. The middleware redirects unauthenticated visitors to a guest session endpoint that creates a JWT without requiring credentials.

3. **Seed auto-reset**: Each guest session triggers a seed data reset, ensuring every visitor encounters a pristine, curated dataset. This includes pre-enriched companies, deals at various pipeline stages, and timeline entries with realistic dates.

4. **RBAC as a permission layer, not a routing layer**: All routes are accessible by default. RBAC restricts _actions_ (create, update, delete) not _navigation_. Guest users can view everything but cannot mutate data.

5. **Auth file split**: Auth.js configuration is split into `config.ts` (edge-safe, imported by middleware) and `index.ts` (Node runtime, imports Drizzle adapter). This is required by the Vercel Edge Runtime constraint.

## Consequences

### Positive

- **Immediate demo availability**: The application is fully functional and demonstrable from the first implemented feature, without requiring authentication setup.
- **Feature isolation**: Each feature is developed and tested independently of the auth system. Service-layer tests do not require session mocking.
- **Clean separation of concerns**: The auth layer wraps the application rather than being woven into it. This makes the RBAC implementation auditable in a single commit.
- **Reviewer experience**: Technical reviewers can explore the full application in under 30 seconds (click "Entra come Guest" on landing page).

### Negative

- **Late auth integration risk**: Auth-related bugs surface late in the development cycle when most features are already built. A fundamental auth design flaw could require widespread refactoring.
- **Permission gaps**: Features built without auth may not consider permission checks. Every server action and route handler must be audited when RBAC is added.
- **Seed data coupling**: Guest mode depends on seed data quality. Poor seed data degrades the demo experience regardless of feature quality.

### Mitigations

- Server Actions follow a consistent pattern (`auth()` → role check → validate → execute) that makes permission auditing systematic.
- The RBAC permission matrix is defined upfront in the PRD, even though implementation is deferred. This ensures features are designed with permission boundaries in mind.
- Seed data is a dedicated service (`seed.service.ts`) with curated, realistic records including RedStones itself as a demo company.
