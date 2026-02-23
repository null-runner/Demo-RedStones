import "server-only";

import { GoogleGenerativeAI, type Tool } from "@google/generative-ai";
import { and, eq, ne } from "drizzle-orm";

import { CircuitBreaker } from "@/lib/circuit-breaker";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { companies } from "@/server/db/schema";

const geminiBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 2 * 60 * 1000,
});

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

export type EnrichmentProcessing = {
  success: true;
  status: "processing" | "not_enriched";
};

export type EnrichmentError = {
  success: false;
  error:
    | "not_found"
    | "timeout"
    | "service_unavailable"
    | "network_error"
    | "api_key_missing"
    | "enrichment_already_processing";
};

export type EnrichmentResult = EnrichmentSuccess | EnrichmentProcessing | EnrichmentError;

export const enrichmentService = {
  startEnrichment,
  runEnrichment,
  getStatus,
};

const STALE_PROCESSING_MS = 2 * 60 * 1000;

async function getStatus(companyId: string): Promise<EnrichmentResult> {
  const rows = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  const company = rows[0];
  if (!company) {
    return { success: false, error: "not_found" };
  }

  if (company.enrichmentStatus === "processing") {
    const age = Date.now() - company.updatedAt.getTime();
    if (age > STALE_PROCESSING_MS) {
      logger.warn(
        "enrichment",
        `Stale processing detected for ${companyId} (${String(Math.round(age / 1000))}s), resetting`,
      );
      await db
        .update(companies)
        .set({ enrichmentStatus: "not_enriched", updatedAt: new Date() })
        .where(eq(companies.id, companyId));
      return { success: true, status: "not_enriched" as const };
    }
    return { success: true, status: "processing" };
  }

  if (company.enrichmentStatus === "not_enriched") {
    return { success: true, status: "not_enriched" as const };
  }

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

async function startEnrichment(
  companyId: string,
  options: { force?: boolean } = {},
): Promise<EnrichmentResult> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("enrichment", "GEMINI_API_KEY not set");
    return { success: false, error: "api_key_missing" };
  }

  const rows = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  const company = rows[0];
  if (!company) {
    return { success: false, error: "not_found" };
  }

  const force = options.force ?? false;

  if (!force && company.enrichmentStatus === "processing") {
    return { success: true, status: "processing" };
  }

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

  const result = await db
    .update(companies)
    .set({ enrichmentStatus: "processing", updatedAt: new Date() })
    .where(and(eq(companies.id, companyId), ne(companies.enrichmentStatus, "processing")))
    .returning();

  if (result.length === 0) {
    return { success: false, error: "enrichment_already_processing" };
  }

  return { success: true, status: "processing" };
}

const GEMINI_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 45_000;

type GeminiCallResult =
  | {
      success: true;
      data: Awaited<
        ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]>
      >;
    }
  | { success: false; error: string; isQuotaError: boolean };

async function callGemini(
  apiKey: string,
  prompt: string,
  companyName: string,
): Promise<GeminiCallResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const googleSearchTool = { googleSearch: {} } as unknown as Tool;
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, tools: [googleSearchTool] });
  logger.info("enrichment", `Calling ${GEMINI_MODEL} (with Google Search) for "${companyName}"`);

  try {
    const data = await geminiBreaker.execute(() => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("ENRICHMENT_TIMEOUT"));
        }, TIMEOUT_MS);
      });
      return Promise.race([model.generateContent(prompt), timeoutPromise]);
    });
    return { success: true, data };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const isQuotaError = detail.includes("429") || detail.includes("quota");
    return { success: false, error: `${getErrorReason(error)}: ${detail}`, isQuotaError };
  }
}

async function runEnrichment(companyId: string): Promise<string | null> {
  const apiKeys = [env.GEMINI_API_KEY, env.GEMINI_API_KEY_BACKUP].filter(Boolean);
  if (apiKeys.length === 0) return "GEMINI_API_KEY not configured";

  const rows = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  const company = rows[0];
  if (!company) return "Company not found";

  const address = company.operationalAddress ?? company.legalAddress ?? null;
  const prompt = buildGeminiPrompt(company.name, company.domain ?? null, address);

  let rawResult: Awaited<
    ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]>
  > | null = null;
  let lastError = "";

  for (const key of apiKeys) {
    const result = await callGemini(key, prompt, company.name);
    if (result.success) {
      rawResult = result.data;
      break;
    }
    lastError = result.error;
    if (!result.isQuotaError) break;
    logger.warn("enrichment", `Quota exceeded, trying backup key for "${company.name}"`);
  }

  if (!rawResult) {
    logger.error("enrichment", `Failed for ${companyId}: ${lastError}`);
    await db
      .update(companies)
      .set({ enrichmentStatus: "not_enriched", updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    return lastError;
  }

  let text: string;
  try {
    text = rawResult.response.text();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    await db
      .update(companies)
      .set({ enrichmentStatus: "not_enriched", updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    return `response_parse: ${detail}`;
  }

  const data = parseGeminiResponse(text);
  if (!data) {
    await db
      .update(companies)
      .set({ enrichmentStatus: "not_enriched", updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    return `json_parse: could not parse Gemini response. Raw: ${text.slice(0, 500)}`;
  }

  if (isEmptyEnrichment(data)) {
    logger.warn("enrichment", `Empty enrichment for ${companyId}, discarding`);
    await db
      .update(companies)
      .set({ enrichmentStatus: "not_enriched", updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    return "empty_result: all fields returned null";
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
  return null;
}

function buildGeminiPrompt(name: string, domain: string | null, address: string | null): string {
  const domainClause = domain ? ` Il sito aziendale è ${domain}.` : "";
  const addressClause = address ? ` La sede è in ${address}.` : "";
  return `Sei un analista CRM. Un venditore sta valutando "${name}" come potenziale cliente.${domainClause}${addressClause}

ISTRUZIONI DI RICERCA:
- Se è presente un dominio, usa ESCLUSIVAMENTE le informazioni trovate su quel sito.
- Se NON è presente un dominio ma è presente un indirizzo, usa nome + indirizzo per identificare l'azienda corretta ed evitare omonimi.
- Se NON è presente né dominio né indirizzo, cerca online "${name}" e usa SOLO il risultato più pertinente.
- NON inventare informazioni. Se un dato non è verificabile dalle fonti, restituisci null.
- NON menzionare nomi di strumenti, piattaforme o tecnologie specifiche (es: Salesforce, HubSpot, SAP) a meno che non siano esplicitamente citati sul sito aziendale.

Restituisci un JSON con:
{
  "description": "cosa fa l'azienda in max 200 caratteri, basandoti solo su ciò che trovi. null se non trovi info",
  "sector": "settore principale (es: SaaS, Manifattura, Retail, Consulenza IT) o null",
  "estimatedSize": "stima dipendenti (1-10, 11-50, 51-200, 200+) o null se non verificabile",
  "painPoints": ["sfida operativa 1", "sfida operativa 2"] oppure []
}
Per painPoints: indica sfide operative GENERICHE e realistiche per il settore dell'azienda (es: gestione clienti frammentata, processi manuali). NON inventare sfide specifiche non verificabili. NON indicare i problemi dei loro clienti.
Rispondi SOLO con il JSON, senza markdown.`;
}

function parseGeminiResponse(text: string): EnrichmentData | null {
  try {
    // Try direct parse first (clean JSON response)
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return extractEnrichmentData(parsed);
  } catch {
    // Grounding may add text around JSON — extract first { ... } block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      return extractEnrichmentData(parsed);
    } catch {
      return null;
    }
  }
}

function extractEnrichmentData(parsed: Record<string, unknown>): EnrichmentData {
  return {
    description: typeof parsed["description"] === "string" ? parsed["description"] : null,
    sector: typeof parsed["sector"] === "string" ? parsed["sector"] : null,
    estimatedSize: typeof parsed["estimatedSize"] === "string" ? parsed["estimatedSize"] : null,
    painPoints: Array.isArray(parsed["painPoints"])
      ? (parsed["painPoints"] as string[]).filter((p) => typeof p === "string")
      : [],
  };
}

function isEmptyEnrichment(data: EnrichmentData): boolean {
  return (
    data.description === null &&
    data.sector === null &&
    data.estimatedSize === null &&
    data.painPoints.length === 0
  );
}

function detectStatus(data: EnrichmentData): "enriched" | "partial" {
  const hasDescription = data.description !== null;
  const hasSector = data.sector !== null;
  return hasDescription && hasSector ? "enriched" : "partial";
}

function getErrorReason(error: unknown): string {
  if (error instanceof Error && error.message === "Circuit breaker is open") return "circuit_open";
  if (error instanceof Error && error.message === "ENRICHMENT_TIMEOUT") return "timeout";
  if (isHttpError(error)) return "service_unavailable";
  return "network_error";
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
