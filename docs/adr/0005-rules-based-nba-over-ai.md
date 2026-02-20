# ADR 0005: Rules-Based Next Best Action Engine Over AI Inference

## Status

Accepted

## Date

2026-02-15

## Context

The CRM includes a "Next Best Action" (NBA) feature that suggests actionable steps to sales representatives based on deal state. Two implementation approaches were evaluated:

### Option A: AI-Powered Suggestions (LLM Inference)

Send deal context (stage, timeline, value, stagnation days) to an LLM (Gemini) and request actionable suggestions. This produces nuanced, context-aware recommendations.

**Tradeoffs:**
- Latency: 2-10 seconds per suggestion generation.
- Cost: API calls on every dashboard load and deal view.
- Determinism: Identical deal states may produce different suggestions across requests.
- Reliability: Suggestions depend on external API availability.

### Option B: Rules-Based Engine (Deterministic)

Define business rules as pure functions that evaluate deal attributes against configurable thresholds. Rules produce deterministic suggestions with zero external dependencies.

**Tradeoffs:**
- Latency: Sub-millisecond (pure computation).
- Cost: Zero.
- Determinism: Identical inputs always produce identical outputs.
- Flexibility: Adding new rules requires code changes, not prompt engineering.

### Evaluation Against Requirements

| Criterion | AI Inference | Rules Engine |
|---|---|---|
| Response time | 2-10s | <1ms |
| Dashboard load impact | Blocks render or requires streaming | None |
| Testability | Non-deterministic, requires mocking | Pure functions, trivially testable |
| Offline/demo mode | Fails without API key | Works everywhere |
| Cost at scale | Linear with usage | Zero |
| Suggestion quality | Higher ceiling (nuanced) | Lower ceiling (formulaic) |

The application already uses Gemini for company enrichment (ADR 0003). Adding a second AI call path increases the blast radius of Gemini outages and doubles API cost.

## Decision

Implement the NBA engine as a **pure rules-based system** with configurable thresholds. Reserve AI integration for company enrichment only.

### Rule Architecture

```
nba.service.ts
├── evaluateNbaRules(deal, timeline) → NbaSuggestion[]
├── Rule: stagnant deal (no activity > N days per stage)
├── Rule: high-value deal without recent follow-up
├── Rule: deal missing contact assignment
├── Rule: won deal without post-sale note
└── Constants: NBA_THRESHOLDS (configurable per stage)
```

Each rule is a pure function: `(deal: Deal, timeline: TimelineEntry[]) → NbaSuggestion | null`.

Suggestions include:
- `type`: action category (follow_up, add_notes, request_decision, escalate)
- `priority`: high / medium / low
- `message`: human-readable recommendation (in Italian)
- `dealId`: reference to the actionable deal

### Threshold Configuration

Thresholds are defined as TypeScript constants, not database records:

```typescript
const NBA_THRESHOLDS = {
  stagnantDays: { Lead: 7, Qualificato: 5, Proposta: 10, Negoziazione: 7 },
  highValueThreshold: 50_000, // cents
  followUpMaxDays: 14,
};
```

This is intentional: for a CRM with 7 fixed pipeline stages, thresholds change rarely and benefit from type safety and co-location with the rules that reference them.

## Consequences

### Positive

- **Zero latency impact**: NBA suggestions are computed synchronously during server component rendering. No async calls, no loading states, no streaming.
- **Deterministic and testable**: Each rule is a pure function with explicit inputs and outputs. Test coverage is complete and assertions are exact (no fuzzy matching on LLM output).
- **Independent of external services**: NBA works without an API key, without internet, and in demo/guest mode. This is critical for reviewer experience.
- **Clear separation from AI features**: Company enrichment (AI) and NBA suggestions (rules) are architecturally distinct. Gemini outages affect enrichment only.

### Negative

- **Limited nuance**: Rules cannot capture complex deal dynamics (e.g., "this deal resembles 3 others that were lost after long negotiations"). Suggestions are formulaic.
- **Manual rule maintenance**: New business rules require code changes, testing, and deployment. There is no admin UI for rule configuration.
- **Fixed thresholds**: The threshold constants assume a specific sales process. Different clients may need different values.

### Mitigations

- The rule architecture supports extension: adding a new rule is adding one function to the evaluation chain.
- Thresholds are isolated in a constants file, making them easy to extract to a database table or admin UI if configurability becomes a requirement.
- If AI-powered suggestions become valuable in the future, they can be added as an additional suggestion source alongside rules, not a replacement.
