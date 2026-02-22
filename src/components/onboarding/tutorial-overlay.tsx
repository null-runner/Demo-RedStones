"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "crm-tutorial-completed";

interface TutorialStep {
  title: string;
  description: string;
}

const STEPS: TutorialStep[] = [
  {
    title: "Ciao Jacopo / Team RedStones!",
    description:
      "Questo CRM è stato costruito su misura come proposta per voi. Vi guideremo nelle funzionalità principali: pipeline, enrichment AI e analytics.",
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

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dismissed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus first interactive element on mount
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const first = dialogRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        first?.focus();
      }
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [dismissed, dismiss]);

  const isGuest = session?.user.role === "guest";
  if (dismissed || !isGuest) return null;

  const current = STEPS[step] as TutorialStep;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="relative mx-4 w-full max-w-md rounded-xl border bg-white p-6 shadow-xl"
      >
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
