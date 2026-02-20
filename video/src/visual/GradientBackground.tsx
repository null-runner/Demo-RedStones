import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const GradientBackground: React.FC = () => {
  const frame = useCurrentFrame();

  // Slow-moving ambient glow orbs (like rentevo but on light background)
  const orbX1 = interpolate(frame, [0, 535], [60, 80], { extrapolateRight: "clamp" });
  const orbY1 = interpolate(frame, [0, 267, 535], [10, 30, 15], { extrapolateRight: "clamp" });
  const orbX2 = interpolate(frame, [0, 535], [10, 30], { extrapolateRight: "clamp" });
  const orbY2 = interpolate(frame, [0, 267, 535], [70, 50, 75], { extrapolateRight: "clamp" });
  const pulseScale = interpolate(frame % 120, [0, 60, 120], [1, 1.15, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#f8fafc" }}>
      {/* Animated red/warm glow orb — top right */}
      <div
        style={{
          position: "absolute",
          top: `${orbY1}%`,
          left: `${orbX1}%`,
          width: "40%",
          height: "40%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 40%, transparent 70%)",
          filter: "blur(40px)",
          transform: `scale(${pulseScale})`,
        }}
      />
      {/* Animated blue/cool glow orb — bottom left */}
      <div
        style={{
          position: "absolute",
          top: `${orbY2}%`,
          left: `${orbX2}%`,
          width: "35%",
          height: "35%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.07) 0%, rgba(59,130,246,0.03) 40%, transparent 70%)",
          filter: "blur(40px)",
          transform: `scale(${interpolate(pulseScale, [1, 1.15], [1.1, 1])})`,
        }}
      />
      {/* Subtle purple accent glow — center */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "45%",
          width: "25%",
          height: "25%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 60%)",
          filter: "blur(30px)",
          opacity: interpolate(frame % 180, [0, 90, 180], [0.4, 1, 0.4]),
        }}
      />
    </AbsoluteFill>
  );
};
