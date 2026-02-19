import { NextResponse } from "next/server";
import { z } from "zod/v3";

import type { EnrichmentError } from "@/server/services/enrichment.service";
import { enrichmentService } from "@/server/services/enrichment.service";

export const maxDuration = 10;

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
};

export async function POST(request: Request) {
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
    const result = await enrichmentService.enrich(companyId, { force });

    const status = result.success ? 200 : ERROR_STATUS_MAP[result.error];
    return NextResponse.json(result, { status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
