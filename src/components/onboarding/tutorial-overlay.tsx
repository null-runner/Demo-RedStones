"use client";

import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";

const STORAGE_KEY = "crm-tutorial-completed";

interface TutorialStep {
  title: string;
  description: string;
}

const STEPS: TutorialStep[] = [
  {
    title: "Benvenuto in RedStones CRM",
    description:
      "Questo è un CRM demo per la gestione pipeline e arricchimento dati. Ti guideremo nelle funzionalità principali.",
  },
  {
    title: "Dashboard & KPI",
    description:
      "La dashboard mostra i KPI chiave: valore pipeline, win rate, velocity e deal stagnanti. Usa il filtro periodo per analizzare intervalli diversi.",
  },
  {
    title: "Pipeline Kanban",
    description:
      "La sezione Pipeline visualizza i deal come kanban. Trascina le card tra le colonne per aggiornare lo stage. Ogni card mostra valore e azienda.",
  },
  {
    title: "Magic Enrichment",
    description:
      "Nelle pagine azienda, il pulsante Magic Enrichment usa Google Gemini per compilare automaticamente settore, dipendenti e pain points.",
  },
  {
    title: "Next Best Action",
    description:
      "Il sistema suggerisce azioni basate su regole: follow-up per deal stagnanti, note per deal senza attività, decisioni per negoziazioni lunghe.",
  },
];

function isCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function TutorialOverlay() {
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(isCompleted);

  const dismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) {
      dismiss();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, dismiss]);

  const isGuest = session?.user.role === "guest";
  if (dismissed || !isGuest) return null;

  const current = STEPS[step] as TutorialStep;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative mx-4 w-full max-w-md rounded-xl border bg-white p-6 shadow-xl">
        <button
          onClick={() => {
            dismiss();
          }}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 text-sm font-medium"
        >
          Salta
        </button>

        <h2 className="mb-2 pr-12 text-lg font-bold text-gray-900">{current.title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">{current.description}</p>

        <div className="mb-4 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              data-testid="step-dot"
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step ? "bg-red-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2">
          {step > 0 && (
            <button
              onClick={() => {
                setStep((s) => s - 1);
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Indietro
            </button>
          )}
          <button
            onClick={() => {
              next();
            }}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            {isLast ? "Inizia" : "Avanti"}
          </button>
        </div>
      </div>
    </div>
  );
}
