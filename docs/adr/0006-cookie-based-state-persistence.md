# ADR 0006: Cookie-Based State Persistence for Server-Side Rendering

## Status

Accepted

## Date

2026-02-20

## Context

The application includes date range filters on the dashboard and pipeline pages. Users expect their selected time period to persist across page navigation and browser refreshes. Three persistence mechanisms were evaluated.

### Options Considered

| Mechanism | SSR Access | Sync Across Tabs | Flash of Default | Storage Limit |
|---|---|---|---|---|
| URL search params | Yes (via `searchParams`) | No (URL per tab) | None | ~2KB per URL |
| localStorage | No (client-only) | No (same origin) | Yes (renders default, then corrects) | 5MB |
| Cookie | Yes (via `cookies()`) | Yes (shared per domain) | None | 4KB |

### The Flash Problem

The initial implementation used `localStorage`. This caused a visible flash on page load:

1. Server renders with the 90-day default (localStorage is unavailable during SSR).
2. Client hydrates, reads localStorage, finds a saved range.
3. Client updates state, triggering a re-render with the saved range.
4. User sees the default label ("Ultimi 90 giorni") flicker to the saved label.

This flash is a hallmark of client-side-only state in server-rendered applications. It degrades perceived performance and suggests an architecture gap.

### The Synchronization Problem

The application has multiple date range pickers (dashboard, pipeline). Users expect that selecting "February 10-20" on the dashboard also applies to the pipeline view. With per-module localStorage keys, each picker maintained independent state.

## Decision

Use a **single HTTP cookie** (`dateRange`) to persist the selected date range. The server reads the cookie during SSR to render the correct initial state. The client writes the cookie on change and triggers `router.refresh()` to re-fetch server data.

### Implementation

**Server side** (server component):
```typescript
const cookieStore = await cookies();
const { from, to } = parseDateRangeCookie(cookieStore.get("dateRange")?.value);
```

**Client side** (custom hook):
```typescript
const [value, onChange] = useDateRange(initialValue);
// onChange writes the cookie and updates React state
```

The server passes the parsed date range as `initialValue` to the client hook. The hook uses it as the initial state, avoiding any mismatch between server-rendered HTML and client hydration.

### Cookie Format

```
dateRange=<encodeURIComponent(JSON.stringify({ from: ISO, to: ISO }))>
```

- `path=/` — accessible from all routes.
- `max-age=31536000` — persists for 1 year.
- `SameSite=Lax` — standard CSRF protection.

## Consequences

### Positive

- **Zero flash**: The server renders the correct date range on the first paint. No hydration mismatch, no flicker.
- **Cross-module sync**: A single cookie means all date range pickers reflect the same selection. Changing the range on the dashboard automatically applies to the pipeline on the next navigation.
- **SSR-compatible**: The `cookies()` API in Next.js server components reads the cookie natively. No workarounds or additional data fetching required.
- **Simple mental model**: Write cookie → refresh → server reads cookie → renders with new range.

### Negative

- **4KB cookie limit**: The JSON payload for a date range is approximately 100 bytes, well within limits. However, this pattern does not scale to large state objects.
- **Cookie sent on every request**: The date range cookie is included in every HTTP request to the server, even for requests that do not use it. For a small payload this is negligible.
- **No per-module override**: If a user wants different date ranges on different pages, the single-cookie approach does not support this. This is a deliberate simplification — for a CRM, a unified time period is the expected behavior.

### Mitigations

- Cookie size is monitored: the payload is compact (two ISO strings) and unlikely to approach limits.
- If per-module state becomes necessary, the cookie key can be namespaced (e.g., `dateRange:dashboard`, `dateRange:pipeline`) without changing the overall architecture.
