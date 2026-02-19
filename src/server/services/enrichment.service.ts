import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { companies } from "@/server/db/schema";

export type EnrichmentData = {
  description: string | null;
  sector: string | null;
  estimatedSize: string | null;
  painPoints: string[];
};

export type EnrichmentSuccess = {
  success: true;
  data: EnrichmentData;
  status: "enriched" | "partial";
};

export type EnrichmentError = {
  success: false;
  error: "not_found" | "timeout" | "service_unavailable" | "network_error" | "api_key_missing";
};

export type EnrichmentResult = EnrichmentSuccess | EnrichmentError;

export const enrichmentService = {
  enrich,
};

async function enrich(
  companyId: string,
  options: { force?: boolean } = {},
): Promise<EnrichmentResult> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    console.warn("[enrichment] GEMINI_API_KEY non impostata — enrichment disabilitato");
    return { success: false, error: "api_key_missing" };
  }

  const rows = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  const company = rows[0];
  if (!company) {
    return { success: false, error: "not_found" };
  }

  const force = options.force ?? false;
  if (!force && company.enrichmentStatus !== "not_enriched") {
    return {
      success: true,
      status: company.enrichmentStatus,
      data: {
        description: company.enrichmentDescription ?? null,
        sector: company.enrichmentSector ?? null,
        estimatedSize: company.enrichmentSize ?? null,
        painPoints: company.enrichmentPainPoints
          ? company.enrichmentPainPoints.split("\n").filter(Boolean)
          : [],
      },
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = buildGeminiPrompt(company.name, company.domain ?? null);

  const TIMEOUT_MS = 9_500;

  let rawResult;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("ENRICHMENT_TIMEOUT"));
      }, TIMEOUT_MS);
    });
    rawResult = await Promise.race([model.generateContent(prompt), timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message === "ENRICHMENT_TIMEOUT") {
      return { success: false, error: "timeout" };
    }
    if (isHttpError(error)) {
      return { success: false, error: "service_unavailable" };
    }
    return { success: false, error: "network_error" };
  }

  let text: string;
  try {
    text = rawResult.response.text();
  } catch {
    return { success: false, error: "service_unavailable" };
  }

  const data = parseGeminiResponse(text);
  if (!data) {
    return { success: false, error: "service_unavailable" };
  }

  const status = detectStatus(data);

  await db
    .update(companies)
    .set({
      enrichmentDescription: data.description,
      enrichmentSector: data.sector,
      enrichmentSize: data.estimatedSize,
      enrichmentPainPoints: data.painPoints.length > 0 ? data.painPoints.join("\n") : null,
      enrichmentStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  return { success: true, data, status };
}

function buildGeminiPrompt(name: string, domain: string | null): string {
  return `Analizza l'azienda "${name}"${domain ? ` (dominio: ${domain})` : ""} e restituisci un JSON con:
{
  "description": "descrizione breve dell'azienda (max 200 caratteri) o null",
  "sector": "settore di business (es: SaaS, Manifattura, Retail) o null",
  "estimatedSize": "stima dimensione (es: 1-10, 11-50, 51-200, 200+) o null",
  "painPoints": ["pain point 1", "pain point 2"] oppure []
}
Rispondi SOLO con il JSON, senza markdown.`;
}

function parseGeminiResponse(text: string): EnrichmentData | null {
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    return {
      description: typeof parsed["description"] === "string" ? parsed["description"] : null,
      sector: typeof parsed["sector"] === "string" ? parsed["sector"] : null,
      estimatedSize: typeof parsed["estimatedSize"] === "string" ? parsed["estimatedSize"] : null,
      painPoints: Array.isArray(parsed["painPoints"])
        ? (parsed["painPoints"] as string[]).filter((p) => typeof p === "string")
        : [],
    };
  } catch {
    return null;
  }
}

function detectStatus(data: EnrichmentData): "enriched" | "partial" {
  const hasAllFields =
    data.description !== null &&
    data.sector !== null &&
    data.estimatedSize !== null &&
    data.painPoints.length > 0;
  return hasAllFields ? "enriched" : "partial";
}

function isHttpError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("503") ||
      error.message.includes("429") ||
      error.message.includes("500") ||
      error.message.includes("GoogleGenerativeAI Error"))
  );
}
