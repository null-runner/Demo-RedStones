export const PIPELINE_STAGES = [
  "Lead",
  "Qualificato",
  "Demo",
  "Proposta",
  "Negoziazione",
  "Chiuso Vinto",
  "Chiuso Perso",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const TERMINAL_STAGES: readonly PipelineStage[] = ["Chiuso Vinto", "Chiuso Perso"];

export function isTerminalStage(stage: string): boolean {
  return (TERMINAL_STAGES as readonly string[]).includes(stage);
}
