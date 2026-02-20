export const BRAND = {
  name: "RedStones CRM",
  colors: {
    // Light theme matching real dashboard
    bg: "#ffffff",
    sidebar: "#fafafa",
    sidebarBorder: "#e5e7eb",
    card: "#ffffff",
    cardBorder: "#e5e7eb",
    primary: "#ef4444",
    primaryLight: "#fef2f2",
    secondary: "#3b82f6",
    accent: "#8b5cf6",
    success: "#16a34a",
    successBg: "#f0fdf4",
    warning: "#ea580c",
    warningBg: "#fff7ed",
    text: "#111827",
    textSecondary: "#6b7280",
    muted: "#9ca3af",
    border: "#e5e7eb",
    chartPurple: "#7c3aed",
    chartBlue: "#3b82f6",
    chartIndigo: "#6366f1",
    chartOrange: "#f97316",
    chartRed: "#ef4444",
    chartGreen: "#22c55e",
    demoBadge: "#fef3c7",
    demoBadgeBorder: "#f59e0b",
    demoBadgeText: "#92400e",
  },
} as const;

export const KPI_DATA = [
  { label: "Pipeline Value", value: "205.000,00 €", sub: null },
  { label: "Win Rate", value: "62.5%", sub: "+62.5pp", subColor: "#16a34a" },
  { label: "Pipeline Velocity", value: "1.737,33 €", sub: "per giorno", subColor: "#6b7280" },
  { label: "Deal Vinti", value: "79.500,00 €", sub: "5 deal", subColor: "#6b7280" },
] as const;

export const CHART_DATA = [
  { name: "Proposta", value: 2, color: "#7c3aed" },
  { name: "Qualificato", value: 2, color: "#3b82f6" },
  { name: "Lead", value: 2, color: "#6366f1" },
  { name: "Negoziazione", value: 1, color: "#f97316" },
  { name: "Demo", value: 1, color: "#ef4444" },
] as const;

export const STAGNANT_DEALS = [
  { name: "Fornitura Componenti Custom", stage: "Qualificato", days: 22, value: "35.000,00 €" },
  { name: "Progetto Pilot 3 mesi", stage: "Qualificato", days: 18, value: "8.500,00 €" },
] as const;

export const KANBAN_COLUMNS = [
  {
    name: "Lead",
    color: "#6366f1",
    deals: [
      { title: "Consulenza IT Setup", company: "NovaTech SRL", value: "12.000 €" },
      { title: "Integrazione API", company: "DataSync", value: "8.500 €" },
    ],
  },
  {
    name: "Qualificato",
    color: "#3b82f6",
    deals: [
      { title: "Fornitura Componenti", company: "MecParts", value: "35.000 €" },
      { title: "Progetto Pilot", company: "InnovaHub", value: "8.500 €" },
    ],
  },
  {
    name: "Proposta",
    color: "#7c3aed",
    deals: [
      { title: "Cloud Migration", company: "RedStones", value: "45.000 €" },
      { title: "ERP Upgrade", company: "LogiTech", value: "67.000 €" },
    ],
  },
  {
    name: "Negoziazione",
    color: "#f97316",
    deals: [{ title: "AI Chatbot", company: "RetailMax", value: "35.000 €" }],
  },
  {
    name: "Chiuso Vinto",
    color: "#22c55e",
    deals: [
      { title: "Data Warehouse", company: "FoodChain", value: "55.000 €" },
      { title: "Mobile App", company: "TechFlow", value: "24.500 €" },
    ],
  },
] as const;

export const NAV_ITEMS = [
  { label: "Dashboard", icon: "grid", active: true },
  { label: "Contatti", icon: "users", active: false },
  { label: "Aziende", icon: "building", active: false },
  { label: "Pipeline", icon: "kanban", active: false },
  { label: "Impostazioni", icon: "settings", active: false },
] as const;
