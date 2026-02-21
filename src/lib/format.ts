const EUR_FORMATTER = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatEUR(value: number): string {
  return EUR_FORMATTER.format(Number.isNaN(value) ? 0 : value);
}

/** Convert string value to integer cents to avoid floating-point precision issues. */
export function toCents(value: string): number {
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/** Sum an array of string currency values safely using integer cents. */
export function sumCurrency(values: string[]): number {
  const totalCents = values.reduce((sum, v) => sum + toCents(v), 0);
  return totalCents / 100;
}

export function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return "pochi secondi fa";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSec < 60) return "pochi secondi fa";
  if (diffMin < 60) return diffMin === 1 ? "1 minuto fa" : `${String(diffMin)} minuti fa`;
  if (diffHours < 24) return diffHours === 1 ? "1 ora fa" : `${String(diffHours)} ore fa`;
  if (diffDays < 7) return diffDays === 1 ? "ieri" : `${String(diffDays)} giorni fa`;
  if (diffDays < 30)
    return diffWeeks === 1 ? "1 settimana fa" : `${String(diffWeeks)} settimane fa`;
  return diffMonths === 1 ? "1 mese fa" : `${String(diffMonths)} mesi fa`;
}
