import React from "react";
import { AbsoluteFill, Sequence } from "remotion";

import { DashboardScene } from "./scenes/DashboardScene";
import { EnrichmentScene } from "./scenes/EnrichmentScene";
import { KanbanScene } from "./scenes/KanbanScene";
import { TitleScene } from "./scenes/TitleScene";
import { GradientBackground } from "./visual/GradientBackground";

// Scene durations in frames (30fps)
const TITLE = 105; // 3.5s
const DASHBOARD = 120; // 4s
const KANBAN = 130; // 4.3s
const ENRICHMENT = 120; // 4s
const OUTRO = 60; // 2s

export const TOTAL_DURATION = TITLE + DASHBOARD + KANBAN + ENRICHMENT + OUTRO;

export const CrmHero: React.FC = () => {
  let offset = 0;

  return (
    <AbsoluteFill>
      <GradientBackground />

      <Sequence from={offset} durationInFrames={TITLE}>
        <TitleScene durationInFrames={TITLE} />
      </Sequence>

      <Sequence from={(offset += TITLE)} durationInFrames={DASHBOARD}>
        <DashboardScene durationInFrames={DASHBOARD} />
      </Sequence>

      <Sequence from={(offset += DASHBOARD)} durationInFrames={KANBAN}>
        <KanbanScene durationInFrames={KANBAN} />
      </Sequence>

      <Sequence from={(offset += KANBAN)} durationInFrames={ENRICHMENT}>
        <EnrichmentScene durationInFrames={ENRICHMENT} />
      </Sequence>

      {/* Outro — back to title */}
      <Sequence from={(offset += ENRICHMENT)} durationInFrames={OUTRO}>
        <TitleScene durationInFrames={OUTRO} />
      </Sequence>
    </AbsoluteFill>
  );
};
