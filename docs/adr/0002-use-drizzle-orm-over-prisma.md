# ADR 0002: Use Drizzle ORM Over Prisma

## Status

Accepted

## Date

2026-02-15

## Context

The application requires an ORM for PostgreSQL access with the following constraints:

- **Serverless deployment** on Vercel (cold starts must remain under 500ms).
- **Edge-compatible** connection pooling via Neon's serverless driver (`@neondatabase/serverless`).
- **Type-safe schema** co-located with application code, not generated from introspection.
- **Migration tooling** for schema evolution in CI/CD.

Two ORMs were evaluated: **Prisma** (v6.x) and **Drizzle ORM** (v0.38.x).

### Performance Analysis

| Metric | Prisma | Drizzle |
|---|---|---|
| Cold start overhead | ~300-800ms (engine initialization) | ~50-100ms (no engine binary) |
| Bundle size (serverless) | ~15MB (query engine WASM) | ~200KB (pure JS) |
| Edge Runtime support | Partial (Prisma Accelerate required) | Native (pure JS, no binary) |
| Connection to Neon | Requires adapter or Prisma Accelerate | Direct via `@neondatabase/serverless` |

### Architectural Considerations

- **Prisma** uses a Rust-based query engine compiled to WASM for serverless. This adds binary size and initialization latency to every cold start. Edge Runtime support requires Prisma Accelerate (a paid proxy service) or the experimental WASM adapter.
- **Drizzle** is pure TypeScript/JavaScript with zero binary dependencies. It operates directly on the database driver, making it natively compatible with Neon's WebSocket-based serverless driver and Vercel's Edge Runtime.
- **Schema definition**: Prisma uses a DSL (`.prisma` file) that generates TypeScript types. Drizzle defines schemas in TypeScript directly, enabling co-location with application types and avoiding a code generation step.
- **Query composition**: Drizzle's query builder produces SQL that maps 1:1 to the generated query, simplifying debugging and performance tuning. Prisma's query engine introduces an abstraction layer that can generate suboptimal queries for complex joins.

### Migration Strategy

Drizzle Kit provides `drizzle-kit push` for development (schema sync without migration files) and `drizzle-kit generate` + `drizzle-kit migrate` for production (versioned SQL migration files). This matches the project's workflow: rapid iteration in development, controlled migrations in production.

Neon requires an **unpooled connection URL** for DDL operations (migrations), while the application uses the **pooled URL** for runtime queries. Drizzle supports this via separate connection configurations.

## Decision

Use **Drizzle ORM** with the `@neondatabase/serverless` driver for all database access. Use Drizzle Kit for schema migrations with separate pooled (runtime) and unpooled (migrations) connection URLs.

## Consequences

### Positive

- **Sub-100ms cold starts**: No binary engine initialization. Serverless functions start faster.
- **Native Edge compatibility**: No proxy service or WASM adapter required. The ORM runs anywhere JavaScript runs.
- **Zero code generation**: Schema changes take effect immediately without a `prisma generate` step. TypeScript types are derived directly from the schema definition.
- **Transparent SQL**: Queries are predictable and debuggable. No query engine black box.
- **Neon-native**: Direct integration with Neon's WebSocket pooler, leveraging connection multiplexing without additional infrastructure.

### Negative

- **Smaller ecosystem**: Prisma has a larger community, more tutorials, and more third-party integrations (e.g., Prisma Studio for data browsing).
- **Less abstraction**: Drizzle requires more explicit query construction for complex operations (e.g., nested includes require manual joins or the `with` API).
- **Rapid iteration**: Drizzle's API surface is still evolving. Minor breaking changes between versions are more frequent than Prisma's stable releases.

### Mitigations

- Drizzle Studio (`drizzle-kit studio`) provides a data browser comparable to Prisma Studio.
- The `with` relational query API covers common nested-read patterns without manual joins.
- Schema and query patterns are encapsulated in service modules, isolating ORM-specific code from business logic.
