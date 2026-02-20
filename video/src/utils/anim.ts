import { interpolate, spring, type SpringConfig } from "remotion";

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export const springIn = ({
  frame,
  fps,
  delayFrames = 0,
  config,
}: {
  frame: number;
  fps: number;
  delayFrames?: number;
  config?: Partial<SpringConfig>;
}): number => {
  return clamp01(
    spring({
      frame: frame - delayFrames,
      fps,
      config: {
        damping: 200,
        mass: 0.9,
        stiffness: 120,
        ...config,
      },
    }),
  );
};

export const fadeIn = ({
  frame,
  delayFrames = 0,
  durationFrames = 14,
}: {
  frame: number;
  fps?: number;
  delayFrames?: number;
  durationFrames?: number;
}): number => {
  return interpolate(frame - delayFrames, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const fadeOut = ({
  frame,
  durationInFrames,
  outroFrames = 12,
}: {
  frame: number;
  durationInFrames: number;
  outroFrames?: number;
}): number => {
  const start = Math.max(0, durationInFrames - outroFrames);
  return interpolate(frame, [start, start + outroFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const slideUp = ({
  frame,
  fps,
  delayFrames = 0,
  distance = 40,
}: {
  frame: number;
  fps: number;
  delayFrames?: number;
  distance?: number;
}): number => {
  const progress = springIn({ frame, fps, delayFrames });
  return interpolate(progress, [0, 1], [distance, 0]);
};
