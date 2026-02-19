const EUR_FORMATTER = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatEUR(value: number): string {
  return EUR_FORMATTER.format(value);
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
