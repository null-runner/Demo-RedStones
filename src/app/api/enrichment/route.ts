import { NextResponse } from "next/server";
import { z } from "zod/v3";

import { getCurrentUser } from "@/lib/auth";
import type { EnrichmentError } from "@/server/services/enrichment.service";
import { enrichmentService } from "@/server/services/enrichment.service";

export const maxDuration = 60;

const EnrichBodySchema = z.object({
  companyId: z.string().uuid(),
  force: z.boolean().optional().default(false),
});

const ERROR_STATUS_MAP: Record<EnrichmentError["error"], number> = {
  not_found: 404,
  api_key_missing: 503,
  service_unavailable: 503,
  timeout: 504,
  network_error: 503,
  enrichment_already_processing: 409,
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EnrichBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { companyId, force } = parsed.data;
    const result = await enrichmentService.startEnrichment(companyId, { force });

    if (!result.success) {
      return NextResponse.json(result, { status: ERROR_STATUS_MAP[result.error] });
    }

    if (result.status !== "processing") {
      return NextResponse.json(result, { status: 200 });
    }

    // Run enrichment inline (not in after()) for reliable execution on Vercel
    await enrichmentService.runEnrichment(companyId);
    const finalResult = await enrichmentService.getStatus(companyId);
    const status = finalResult.success ? 200 : ERROR_STATUS_MAP[finalResult.error];
    return NextResponse.json(finalResult, { status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId || !/^[0-9a-f-]{36}$/i.test(companyId)) {
    return NextResponse.json({ error: "Invalid companyId" }, { status: 400 });
  }

  try {
    const result = await enrichmentService.getStatus(companyId);
    const status = result.success ? 200 : ERROR_STATUS_MAP[result.error];
    return NextResponse.json(result, { status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
