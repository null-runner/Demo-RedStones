"use client";

import dynamic from "next/dynamic";

const TutorialOverlay = dynamic(() => import("./tutorial-overlay").then((m) => m.TutorialOverlay), {
  ssr: false,
});

export function TutorialOverlayLoader() {
  return <TutorialOverlay />;
}
