# ADR 0001: Use Next.js Server Actions for Mutations

## Status

Accepted

## Date

2026-02-15

## Context

The application requires a mutation layer for CRUD operations on contacts, companies, deals, and pipeline settings. Two primary approaches were evaluated:

1. **Traditional REST API routes** (`app/api/*/route.ts`) — explicit HTTP endpoints with manual request/response handling, status codes, and client-side fetch calls.
2. **Next.js Server Actions** — co-located server functions invocable directly from client components via RPC-style calls, with built-in form integration and progressive enhancement.

### Evaluation Criteria

| Criterion | API Routes | Server Actions |
|---|---|---|
| Type safety | Manual (Zod + fetch wrapper) | End-to-end (function signature) |
| Boilerplate | High (route handler + client fetch + error mapping) | Low (single function + `useTransition`) |
| Progressive enhancement | Manual | Built-in (works without JS) |
| Revalidation | Manual `revalidatePath`/`revalidateTag` | Same, but co-located with mutation |
| Bundle size | Separate client fetch layer | Zero client bundle for action code |
| Caching semantics | `GET` cacheable by default | N/A (mutations only) |

### Key Considerations

- Server Actions eliminate an entire abstraction layer (the fetch wrapper, error type mapping, and response parsing) that API routes require.
- The application has no external consumers — all mutations originate from the Next.js frontend. There is no need for a public API contract.
- Server Actions integrate natively with React 19's `useTransition` for optimistic UI patterns, which this application leverages for timeline note creation.
- API routes remain appropriate for webhook receivers and background processing endpoints (e.g., `/api/enrichment`, `/api/seed/reset`), where the caller is not a React component.

## Decision

Use **Server Actions** as the primary mutation layer for all user-initiated CRUD operations. Reserve API routes exclusively for:

- External webhook endpoints
- Background processing triggers (enrichment, seed)
- Authentication callbacks (OAuth, guest session)

Each Server Action validates input with Zod, checks authorization via the session, and returns a discriminated union (`{ success: true; data } | { success: false; error }`).

## Consequences

### Positive

- **Reduced boilerplate**: ~40% less code per mutation compared to equivalent API route + client fetch.
- **Type-safe RPC**: TypeScript ensures the client receives exactly the return type of the server function, with no runtime type assertions.
- **Simpler error handling**: No HTTP status code mapping — errors are returned as typed objects.
- **Progressive enhancement**: Forms degrade gracefully when JavaScript is unavailable.

### Negative

- **No REST semantics**: Server Actions use POST for all mutations. Tooling that relies on HTTP method semantics (API gateways, rate limiters keyed on method+path) cannot distinguish between operations.
- **Testing strategy shift**: Actions are tested as plain async functions (unit tests) rather than via HTTP request/response assertions. Integration tests require mocking the auth session.
- **Migration cost if API consumers appear**: If the application later requires a public API (e.g., mobile client, third-party integration), a separate API layer must be introduced.

### Mitigations

- API routes are used where appropriate (webhooks, background tasks), maintaining familiarity with the pattern.
- Each action is a pure function with injected dependencies, making extraction to an API route trivial if needed.
