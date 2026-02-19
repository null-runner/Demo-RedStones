const EUR_FORMATTER = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatEUR(value: number): string {
  return EUR_FORMATTER.format(value);
}
