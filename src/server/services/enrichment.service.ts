import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq } from "drizzle-orm";

import { CircuitBreaker } from "@/lib/circuit-breaker";
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
  status: "processing";
};

export type EnrichmentError = {
  success: false;
  error: "not_found" | "timeout" | "service_unavailable" | "network_error" | "api_key_missing";
};

export type EnrichmentResult = EnrichmentSuccess | EnrichmentProcessing | EnrichmentError;

export const enrichmentService = {
  startEnrichment,
  runEnrichment,
  getStatus,
};

async function getStatus(companyId: string): Promise<EnrichmentResult> {
  const rows = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  const company = rows[0];
  if (!company) {
    return { success: false, error: "not_found" };
  }

  if (company.enrichmentStatus === "processing") {
    return { success: true, status: "processing" };
  }

  if (company.enrichmentStatus === "not_enriched") {
    return { success: false, error: "not_found" };
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
  const apiKey = process.env["GEMINI_API_KEY"];
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

  await db
    .update(companies)
    .set({ enrichmentStatus: "processing", updatedAt: new Date() })
    .where(eq(companies.id, companyId));

  return { success: true, status: "processing" };
}

async function runEnrichment(companyId: string): Promise<void> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) return;

  const rows = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  const company = rows[0];
  if (!company) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  const prompt = buildGeminiPrompt(company.name, company.domain ?? null);

  const TIMEOUT_MS = 120_000;

  let rawResult;
  try {
    rawResult = await geminiBreaker.execute(() => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("ENRICHMENT_TIMEOUT"));
        }, TIMEOUT_MS);
      });
      return Promise.race([model.generateContent(prompt), timeoutPromise]);
    });
  } catch (error) {
    const errorReason = getErrorReason(error);
    logger.error("enrichment", `Failed for ${companyId}: ${errorReason}`);
    await db
      .update(companies)
      .set({ enrichmentStatus: "not_enriched", updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    return;
  }

  let text: string;
  try {
    text = rawResult.response.text();
  } catch {
    await db
      .update(companies)
      .set({ enrichmentStatus: "not_enriched", updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    return;
  }

  const data = parseGeminiResponse(text);
  if (!data) {
    await db
      .update(companies)
      .set({ enrichmentStatus: "not_enriched", updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    return;
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
}

function buildGeminiPrompt(name: string, domain: string | null): string {
  const domainClause = domain ? ` Il sito aziendale è ${domain}.` : "";
  return `Sei un analista CRM. Un venditore sta valutando "${name}" come potenziale cliente.${domainClause}

ISTRUZIONI DI RICERCA:
- Se è presente un dominio, usa ESCLUSIVAMENTE le informazioni trovate su quel sito.
- Se NON è presente un dominio, cerca online "${name}" e usa SOLO il risultato più pertinente.
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
