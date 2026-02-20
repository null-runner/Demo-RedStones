import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { BRAND } from "../brand";
import { fadeIn, fadeOut, springIn } from "../utils/anim";

export const TitleScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleP = springIn({ frame, fps, delayFrames: 6, config: { damping: 120 } });
  const subtitleP = springIn({ frame, fps, delayFrames: 16 });
  const pillsP = springIn({ frame, fps, delayFrames: 26 });
  const opacity =
    fadeIn({ frame, durationFrames: 10 }) * fadeOut({ frame, durationInFrames, outroFrames: 14 });
  const titleY = interpolate(titleP, [0, 1], [24, 0]);
  const subtitleY = interpolate(subtitleP, [0, 1], [16, 0]);

  return (
    <AbsoluteFill
      style={{
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Red accent line */}
      <div
        style={{
          width: interpolate(titleP, [0, 1], [0, 48]),
          height: 4,
          borderRadius: 2,
          background: BRAND.colors.primary,
          marginBottom: 28,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          color: BRAND.colors.text,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          textAlign: "center",
          transform: `translateY(${titleY}px)`,
          opacity: titleP,
        }}
      >
        RedStones{" "}
        <span style={{ color: BRAND.colors.primary }}>CRM</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 14,
          fontSize: 22,
          fontWeight: 500,
          color: BRAND.colors.textSecondary,
          letterSpacing: "-0.01em",
          textAlign: "center",
          transform: `translateY(${subtitleY}px)`,
          opacity: subtitleP,
        }}
      >
        Pipeline Management & AI Enrichment
      </div>

      {/* Tech pills */}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          gap: 10,
          opacity: pillsP,
        }}
      >
        {["Next.js 16", "TypeScript", "Drizzle ORM", "Gemini AI"].map((tech) => (
          <div
            key={tech}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              border: `1px solid ${BRAND.colors.border}`,
              background: "#ffffff",
              color: BRAND.colors.textSecondary,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {tech}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
