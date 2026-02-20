import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { BRAND, CHART_DATA, KPI_DATA, NAV_ITEMS, STAGNANT_DEALS } from "../brand";
import { fadeIn, fadeOut, springIn } from "../utils/anim";

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
    {NAV_ITEMS.map((item) => (
      <div
        key={item.label}
        style={{
          padding: "9px 18px",
          fontSize: 14,
          fontWeight: item.active ? 600 : 500,
          color: item.active ? BRAND.colors.text : BRAND.colors.textSecondary,
          background: item.active ? "rgba(239,68,68,0.06)" : "transparent",
          borderLeft: item.active ? `3px solid ${BRAND.colors.primary}` : "3px solid transparent",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {item.label}
      </div>
    ))}
  </div>
);

const TopBar: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: `1px solid ${BRAND.colors.border}`,
      marginBottom: 20,
      opacity,
    }}
  >
    <div
      style={{
        padding: "6px 14px",
        border: `1px solid ${BRAND.colors.border}`,
        borderRadius: 8,
        fontSize: 13,
        color: BRAND.colors.muted,
      }}
    >
      Cerca... Ctrl+K
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          background: BRAND.colors.demoBadge,
          border: `1px solid ${BRAND.colors.demoBadgeBorder}`,
          fontSize: 12,
          fontWeight: 600,
          color: BRAND.colors.demoBadgeText,
        }}
      >
        Demo Mode
      </div>
      <div style={{ fontSize: 13, color: BRAND.colors.textSecondary }}>Demo Guest</div>
    </div>
  </div>
);

export const DashboardScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity =
    fadeIn({ frame, durationFrames: 12 }) * fadeOut({ frame, durationInFrames, outroFrames: 14 });
  const sidebarP = springIn({ frame, fps, delayFrames: 2 });
  const topbarP = springIn({ frame, fps, delayFrames: 6 });

  return (
    <AbsoluteFill
      style={{
        opacity,
        display: "flex",
        flexDirection: "row",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <Sidebar opacity={sidebarP} />

      {/* Main content */}
      <div style={{ flex: 1, padding: "0 28px", overflow: "hidden" }}>
        <TopBar opacity={topbarP} />

        {/* Header */}
        <div style={{ marginBottom: 18, opacity: springIn({ frame, fps, delayFrames: 8 }) }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.colors.text }}>Dashboard</div>
          <div style={{ fontSize: 13, color: BRAND.colors.textSecondary }}>
            KPI e overview pipeline
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          {KPI_DATA.map((kpi, i) => {
            const p = springIn({ frame, fps, delayFrames: 12 + i * 5 });
            const y = interpolate(p, [0, 1], [20, 0]);
            return (
              <div
                key={kpi.label}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: `1px solid ${BRAND.colors.cardBorder}`,
                  background: "#ffffff",
                  transform: `translateY(${y}px)`,
                  opacity: p,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: BRAND.colors.textSecondary,
                    marginBottom: 6,
                  }}
                >
                  {kpi.label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: BRAND.colors.text,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {kpi.value}
                </div>
                {kpi.sub && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: kpi.subColor,
                    }}
                  >
                    {kpi.sub}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chart + Stagnant row */}
        <div style={{ display: "flex", gap: 12 }}>
          {/* Bar chart */}
          <div
            style={{
              flex: 1.2,
              padding: "14px 16px",
              borderRadius: 10,
              border: `1px solid ${BRAND.colors.cardBorder}`,
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              opacity: springIn({ frame, fps, delayFrames: 28 }),
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: BRAND.colors.text,
                marginBottom: 14,
              }}
            >
              Deal per Stage
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 100 }}>
              {CHART_DATA.map((bar, i) => {
                const barP = springIn({ frame, fps, delayFrames: 32 + i * 3 });
                const maxVal = Math.max(...CHART_DATA.map((d) => d.value));
                const h = interpolate(barP, [0, 1], [0, (bar.value / maxVal) * 80]);
                return (
                  <div
                    key={bar.name}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <div
                      style={{
                        width: "80%",
                        height: h,
                        borderRadius: "4px 4px 0 0",
                        background: bar.color,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 10,
                        color: BRAND.colors.muted,
                        whiteSpace: "nowrap",
                        opacity: barP,
                      }}
                    >
                      {bar.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stagnant deals */}
          <div
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 10,
              border: `1px solid ${BRAND.colors.cardBorder}`,
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              opacity: springIn({ frame, fps, delayFrames: 34 }),
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: BRAND.colors.text,
                marginBottom: 14,
              }}
            >
              Deal Stagnanti
            </div>
            {STAGNANT_DEALS.map((deal, i) => {
              const p = springIn({ frame, fps, delayFrames: 38 + i * 5 });
              return (
                <div
                  key={deal.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderTop: i > 0 ? `1px solid ${BRAND.colors.border}` : "none",
                    opacity: p,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 600, color: BRAND.colors.text }}
                    >
                      {deal.name}
                    </div>
                    <div
                      style={{
                        display: "inline-block",
                        marginTop: 3,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#f3f4f6",
                        fontSize: 11,
                        fontWeight: 500,
                        color: BRAND.colors.textSecondary,
                      }}
                    >
                      {deal.stage}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 600, color: BRAND.colors.warning }}
                    >
                      {deal.days} giorni
                    </div>
                    <div
                      style={{ fontSize: 12, color: BRAND.colors.textSecondary }}
                    >
                      {deal.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
