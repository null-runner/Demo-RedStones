import { NextResponse } from "next/server";

import { resetDatabase } from "@/server/services/seed.service";

export async function POST() {
  try {
    await resetDatabase();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(
      "[auth/guest] Reset failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json({ success: false, error: "Reset fallito" }, { status: 500 });
  }
}
