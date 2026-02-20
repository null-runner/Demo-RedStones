import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { BRAND, NAV_ITEMS } from "../brand";
import { fadeIn, fadeOut, springIn } from "../utils/anim";

const ENRICHMENT_FIELDS = [
  { label: "Settore", value: "SaaS — Digital Solutions", delay: 22 },
  { label: "Dipendenti", value: "11-50", delay: 28 },
  { label: "Descrizione", value: "Software custom e soluzioni SaaS per PMI", delay: 34 },
  {
    label: "Pain Points",
    value: "Retention clienti, scaling operativo, lead qualification",
    delay: 40,
  },
] as const;

const Sidebar: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      width: 180,
      height: "100%",
      background: BRAND.colors.sidebar,
      borderRight: `1px solid ${BRAND.colors.sidebarBorder}`,
      padding: "20px 0",
      opacity,
      flexShrink: 0,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}
  >
    <div
      style={{
        padding: "0 18px",
        fontSize: 16,
        fontWeight: 800,
        color: BRAND.colors.text,
        letterSpacing: "-0.02em",
        marginBottom: 24,
      }}
    >
      RedStones CRM
    </div>
    {NAV_ITEMS.map((item) => {
      const isActive = item.label === "Aziende";
      return (
        <div
          key={item.label}
          style={{
            padding: "9px 18px",
            fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? BRAND.colors.text : BRAND.colors.textSecondary,
            background: isActive ? "rgba(239,68,68,0.06)" : "transparent",
            borderLeft: isActive ? `3px solid ${BRAND.colors.primary}` : "3px solid transparent",
          }}
        >
          {item.label}
        </div>
      );
    })}
  </div>
);

export const EnrichmentScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity =
    fadeIn({ frame, durationFrames: 12 }) * fadeOut({ frame, durationInFrames, outroFrames: 14 });

  const processingEnd = 20;
  const isProcessing = frame < processingEnd;
  const pulseOpacity = isProcessing ? interpolate(frame % 16, [0, 8, 16], [0.3, 1, 0.3]) : 0;

  return (
    <AbsoluteFill
      style={{
        opacity,
        display: "flex",
        flexDirection: "row",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <Sidebar opacity={springIn({ frame, fps, delayFrames: 2 })} />

      <div style={{ flex: 1, padding: "16px 28px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ marginBottom: 16, opacity: springIn({ frame, fps, delayFrames: 4 }) }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.colors.text }}>
            Dettaglio Azienda
          </div>
          <div style={{ fontSize: 13, color: BRAND.colors.textSecondary }}>
            Magic Enrichment con Google Gemini
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {/* Company card */}
          <div
            style={{
              flex: 1,
              padding: 20,
              borderRadius: 12,
              border: `1px solid ${BRAND.colors.cardBorder}`,
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              opacity: springIn({ frame, fps, delayFrames: 6 }),
            }}
          >
            {/* Company header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${BRAND.colors.primary}, #dc2626)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                R
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.colors.text }}>
                  RedStones SRL
                </div>
                <div style={{ fontSize: 13, color: BRAND.colors.muted }}>redstones.it</div>
              </div>
            </div>

            {/* Processing state */}
            {isProcessing && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  opacity: pulseOpacity,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: BRAND.colors.accent,
                  }}
                />
                <div style={{ fontSize: 13, color: BRAND.colors.accent, fontWeight: 500 }}>
                  Gemini sta analizzando...
                </div>
              </div>
            )}

            {/* Enriched fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ENRICHMENT_FIELDS.map((field) => {
                const p = springIn({ frame, fps, delayFrames: field.delay });
                return (
                  <div
                    key={field.label}
                    style={{
                      opacity: p,
                      transform: `translateX(${interpolate(p, [0, 1], [16, 0])}px)`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: BRAND.colors.muted,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                        marginBottom: 3,
                      }}
                    >
                      {field.label}
                    </div>
                    <div style={{ fontSize: 14, color: BRAND.colors.text, fontWeight: 500 }}>
                      {field.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column — status cards */}
          <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Circuit breaker card */}
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                border: `1px solid ${BRAND.colors.cardBorder}`,
                background: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                opacity: springIn({ frame, fps, delayFrames: 46 }),
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: BRAND.colors.muted,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                Circuit Breaker
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: BRAND.colors.success,
                  }}
                />
                <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.colors.success }}>
                  CLOSED
                </div>
              </div>
              <div style={{ fontSize: 12, color: BRAND.colors.muted, marginTop: 4 }}>
                0 failures / 3 threshold
              </div>
            </div>

            {/* Status badge */}
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                border: `1px solid rgba(22,163,74,0.2)`,
                background: BRAND.colors.successBg,
                opacity: springIn({ frame, fps, delayFrames: 52 }),
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: BRAND.colors.muted,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                Enrichment Status
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.colors.success }}>
                Enriched
              </div>
              <div style={{ fontSize: 12, color: BRAND.colors.textSecondary, marginTop: 3 }}>
                4/4 campi compilati
              </div>
            </div>

            {/* Async badge */}
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                border: `1px solid ${BRAND.colors.cardBorder}`,
                background: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                opacity: springIn({ frame, fps, delayFrames: 58 }),
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: BRAND.colors.muted,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                Processing
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: BRAND.colors.text }}>
                Fire & Forget
              </div>
              <div style={{ fontSize: 12, color: BRAND.colors.muted, marginTop: 3 }}>
                Async background task
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
