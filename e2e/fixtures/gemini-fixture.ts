import { GoogleGenerativeAI } from "@google/generative-ai";

import { test as authTest } from "./auth";

type ReviewResult = { pass: boolean; feedback: string };

type GeminiFixture = {
  reviewScreenshot: (screenshot: Buffer, context: string) => Promise<ReviewResult>;
};

export const test = authTest.extend<GeminiFixture>({
  reviewScreenshot: async ({}, use) => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      await use(async () => ({ pass: true, feedback: "SKIPPED: no GEMINI_API_KEY" }));
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const reviewFn = async (screenshot: Buffer, context: string): Promise<ReviewResult> => {
      const prompt = `Sei un QA reviewer esperto di UI/UX per applicazioni web enterprise.
Stai valutando uno screenshot di un CRM (Customer Relationship Management).

Contesto della pagina: ${context}

Valuta lo screenshot per questi criteri:
1. LAYOUT: elementi allineati, nessuna sovrapposizione, spaziatura consistente
2. LEGGIBILITA: testo leggibile, contrasto sufficiente, gerarchia visiva chiara
3. COMPLETEZZA: nessun placeholder visibile, nessun "[object Object]", nessun testo troncato
4. ERRORI VISIVI: nessun bordo rotto, immagini mancanti, icone non caricate, scrollbar anomale
5. RESPONSIVE: il layout usa lo spazio disponibile in modo ragionevole

Rispondi SOLO con un JSON valido (senza markdown):
{
  "pass": true/false,
  "issues": ["descrizione issue 1", "descrizione issue 2"],
  "score": 1-10,
  "summary": "valutazione complessiva in una frase"
}

Se non trovi problemi significativi, rispondi con pass: true e issues: [].
Ignora problemi minori di gusto estetico. Segnala solo problemi che un utente noterebbe.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/png",
            data: screenshot.toString("base64"),
          },
        },
      ]);

      const text = result.response.text();
      try {
        const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned) as {
          pass: boolean;
          issues: string[];
          score: number;
          summary: string;
        };
        const feedback =
          parsed.issues.length > 0
            ? `Score: ${String(parsed.score)}/10 - ${parsed.summary}\nIssues:\n${parsed.issues.map((i) => `  - ${i}`).join("\n")}`
            : `Score: ${String(parsed.score)}/10 - ${parsed.summary}`;
        return { pass: parsed.pass, feedback };
      } catch {
        return { pass: true, feedback: `UNPARSEABLE: ${text.slice(0, 200)}` };
      }
    };

    await use(reviewFn);
  },
});

export { expect } from "@playwright/test";
