# RedStones CRM

Mini CRM per la gestione contatti, aziende e pipeline commerciale.

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js App Router, Server Actions, Drizzle ORM
- **Database:** PostgreSQL (Neon)
- **Auth:** Auth.js v5 (JWT + RBAC)
- **AI:** Google Gemini (Magic Enrichment)
- **Testing:** Vitest + React Testing Library

## Setup

```bash
pnpm install
cp .env.example .env.local
# Configurare le variabili in .env.local
pnpm dev
```

## Scripts

| Script | Descrizione |
|--------|-------------|
| `pnpm dev` | Avvia dev server (Turbopack) |
| `pnpm build` | Build produzione |
| `pnpm typecheck` | TypeScript strict check |
| `pnpm lint` | ESLint strictTypeChecked |
| `pnpm format:check` | Prettier check |
| `pnpm test:run` | Vitest run |
| `pnpm test:coverage` | Vitest con coverage |
