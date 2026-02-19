import { NextResponse } from "next/server";

import { resetDatabase } from "@/server/services/seed.service";

export async function POST() {
  try {
    await resetDatabase();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[seed/reset] Reset failed:", error);
    return NextResponse.json({ success: false, error: "Reset fallito. Riprova." }, { status: 500 });
  }
}
