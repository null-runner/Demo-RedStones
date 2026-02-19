import { DemoModeBadge } from "./demo-mode-badge";

export function Topbar() {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-6">
      <button
        className="text-muted-foreground hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
        type="button"
        aria-label="Apri ricerca globale"
      >
        <span>Cerca...</span>
        <kbd className="bg-muted rounded px-1.5 py-0.5 text-xs">⌘K</kbd>
      </button>
      <DemoModeBadge />
    </header>
  );
}
