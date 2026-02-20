import React from "react";
import { Composition } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";

import { CrmHero, TOTAL_DURATION } from "./CrmHero";

loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CrmHero"
        component={CrmHero}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={960}
        height={540}
      />
    </>
  );
};
