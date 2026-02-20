import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { resetDatabase } from "@/server/services/seed.service";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "guest" && user.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await resetDatabase();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[seed/reset] Reset failed:", error);
    return NextResponse.json({ success: false, error: "Reset fallito. Riprova." }, { status: 500 });
  }
}
