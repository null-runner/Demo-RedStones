import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { BRAND, KANBAN_COLUMNS, NAV_ITEMS } from "../brand";
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
    {NAV_ITEMS.map((item) => {
      const isActive = item.label === "Pipeline";
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

export const KanbanScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity =
    fadeIn({ frame, durationFrames: 12 }) * fadeOut({ frame, durationInFrames, outroFrames: 14 });

  // Drag phases: before → dragging → landed
  const dragStart = 65;
  const dragEnd = 95;
  const isDragging = frame >= dragStart && frame <= dragEnd;
  const isLanded = frame > dragEnd;
  const dragProgress = isDragging
    ? springIn({ frame: frame - dragStart, fps, delayFrames: 0, config: { damping: 100, stiffness: 80 } })
    : 0;
  const landedP = isLanded
    ? springIn({ frame: frame - dragEnd, fps, delayFrames: 0 })
    : 0;

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

      <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            opacity: springIn({ frame, fps, delayFrames: 4 }),
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.colors.text }}>Pipeline</div>
            <div style={{ fontSize: 13, color: BRAND.colors.textSecondary }}>
              Gestisci le opportunità commerciali
            </div>
          </div>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: BRAND.colors.primary,
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            + Nuovo Deal
          </div>
        </div>

        {/* Kanban columns */}
        <div style={{ display: "flex", gap: 10, position: "relative" }}>
          {KANBAN_COLUMNS.map((col, colIdx) => (
            <div
              key={col.name}
              style={{
                flex: 1,
                opacity: springIn({ frame, fps, delayFrames: 8 + colIdx * 3 }),
              }}
            >
              {/* Column header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                  padding: "0 4px",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: col.color,
                  }}
                />
                <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.colors.text }}>
                  {col.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: BRAND.colors.muted,
                    marginLeft: "auto",
                    background: "#f3f4f6",
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}
                >
                  {col.deals.length}
                </div>
              </div>

              {/* Cards */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: "#f9fafb",
                  borderRadius: 8,
                  padding: 6,
                  minHeight: 180,
                }}
              >
                {/* Landed card appears in Proposta column */}
                {isLanded && colIdx === 2 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#ffffff",
                      border: `1px solid ${BRAND.colors.cardBorder}`,
                      opacity: landedP,
                      transform: `translateY(${interpolate(landedP, [0, 1], [8, 0])}px)`,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      order: -1,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.colors.text, marginBottom: 3 }}>
                      Progetto Pilot
                    </div>
                    <div style={{ fontSize: 11, color: BRAND.colors.muted, marginBottom: 5 }}>
                      InnovaHub
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.colors.success }}>
                      8.500 €
                    </div>
                  </div>
                )}
                {col.deals.map((deal, dealIdx) => {
                  const cardP = springIn({
                    frame,
                    fps,
                    delayFrames: 14 + colIdx * 3 + dealIdx * 4,
                  });
                  const y = interpolate(cardP, [0, 1], [16, 0]);

                  // Hide dragged card from Qualificato during drag and after landing
                  const isBeingDragged =
                    (isDragging || isLanded) && colIdx === 1 && dealIdx === 1;
                  if (isBeingDragged) return null;

                  return (
                    <div
                      key={deal.title}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "#ffffff",
                        border: `1px solid ${BRAND.colors.cardBorder}`,
                        transform: `translateY(${y}px)`,
                        opacity: cardP,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: BRAND.colors.text,
                          marginBottom: 3,
                        }}
                      >
                        {deal.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: BRAND.colors.muted,
                          marginBottom: 5,
                        }}
                      >
                        {deal.company}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: BRAND.colors.success,
                        }}
                      >
                        {deal.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Floating drag card */}
          {isDragging && (
            <div
              style={{
                position: "absolute",
                top: 60,
                left: interpolate(dragProgress, [0, 1], [270, 430]),
                width: 130,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#ffffff",
                border: `2px solid ${BRAND.colors.secondary}`,
                boxShadow: `0 ${interpolate(dragProgress, [0, 0.5, 1], [2, 12, 4])}px ${interpolate(dragProgress, [0, 0.5, 1], [4, 24, 8])}px rgba(0,0,0,0.12)`,
                transform: `translateY(${interpolate(dragProgress, [0, 0.5, 1], [0, -12, 8])}px) rotate(${interpolate(dragProgress, [0, 0.3, 0.7, 1], [0, -2, 2, 0])}deg)`,
                zIndex: 20,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: BRAND.colors.text,
                  marginBottom: 3,
                }}
              >
                Progetto Pilot
              </div>
              <div style={{ fontSize: 11, color: BRAND.colors.muted, marginBottom: 5 }}>
                InnovaHub
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.colors.success }}>
                8.500 €
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
