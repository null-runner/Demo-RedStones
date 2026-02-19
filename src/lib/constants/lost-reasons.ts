export const LOST_REASONS = [
  "Prezzo troppo alto",
  "Scelta competitor",
  "Budget non approvato",
  "Progetto cancellato",
  "Tempistiche non allineate",
  "Nessuna risposta",
  "Altro",
] as const;

export type LostReason = (typeof LOST_REASONS)[number];
