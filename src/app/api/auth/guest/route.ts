import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { resetDatabase } from "@/server/services/seed.service";

export async function POST() {
  try {
    await resetDatabase();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error("auth/guest", "Reset failed", error);
    return NextResponse.json({ success: false, error: "Reset fallito" }, { status: 500 });
  }
}
