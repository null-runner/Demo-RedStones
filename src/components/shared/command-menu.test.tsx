import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

import { CommandMenu, filterResults } from "./command-menu";

import type { SearchDataset } from "@/app/(dashboard)/_lib/search.actions";

function makeDataset(): SearchDataset {
  return {
    contacts: [
      { id: "c1", name: "Mario Rossi", email: "mario@example.com" },
      { id: "c2", name: "Luigi Bianchi", email: "luigi@example.com" },
    ],
    companies: [
      { id: "co1", name: "RedStones Srl", sector: "SaaS" },
      { id: "co2", name: "Eter Studio", sector: "Design" },
    ],
    deals: [
      { id: "d1", title: "Contratto Mario", value: "5000.00" },
      { id: "d2", title: "Progetto Luigi", value: "12000.00" },
    ],
  };
}

function renderMenu(dataset: SearchDataset = makeDataset()) {
  return render(<CommandMenu dataset={dataset} />);
}

describe("filterResults", () => {
  it("filtra per nome contenente il termine (case-insensitive)", () => {
    const result = filterResults("mario", makeDataset());
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0]?.name).toBe("Mario Rossi");
    expect(result.deals).toHaveLength(1);
    expect(result.deals[0]?.title).toBe("Contratto Mario");
  });

  it("ritorna array vuoti con query vuota", () => {
    const result = filterResults("", makeDataset());
    expect(result.contacts).toHaveLength(0);
    expect(result.companies).toHaveLength(0);
    expect(result.deals).toHaveLength(0);
  });

  it("ritorna array vuoti con query senza match", () => {
    const result = filterResults("zzz_nessun_match", makeDataset());
    expect(result.contacts).toHaveLength(0);
    expect(result.companies).toHaveLength(0);
    expect(result.deals).toHaveLength(0);
  });

  it("limita a 5 risultati per gruppo", () => {
    const bigDataset: SearchDataset = {
      contacts: Array.from({ length: 10 }, (_, i) => ({
        id: `c${String(i)}`,
        name: `Mario ${String(i)}`,
        email: null,
      })),
      companies: [],
      deals: [],
    };
    const result = filterResults("mario", bigDataset);
    expect(result.contacts).toHaveLength(5);
  });
});

describe("CommandMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderizza il bottone trigger con testo Cerca... e aria-label", () => {
    renderMenu();
    expect(screen.getByRole("button", { name: /ricerca/i })).toBeInTheDocument();
    expect(screen.getByText("Cerca...")).toBeInTheDocument();
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("apre l'overlay con Ctrl+K", () => {
    renderMenu();
    fireEvent(document, new KeyboardEvent("keydown", { ctrlKey: true, key: "k", bubbles: true }));
    expect(screen.getByPlaceholderText(/digita per cercare/i)).toBeInTheDocument();
  });

  it("apre l'overlay con Meta+K", () => {
    renderMenu();
    fireEvent(document, new KeyboardEvent("keydown", { metaKey: true, key: "k", bubbles: true }));
    expect(screen.getByPlaceholderText(/digita per cercare/i)).toBeInTheDocument();
  });

  it("apre l'overlay cliccando il bottone trigger", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    expect(screen.getByPlaceholderText(/digita per cercare/i)).toBeInTheDocument();
  });

  it("click su risultato contatto chiama router.push con /contacts/[id]", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    const input = screen.getByPlaceholderText(/digita per cercare/i);
    await user.type(input, "mario");
    const contactItem = screen.getByText("Mario Rossi");
    await user.click(contactItem);
    expect(mockPush).toHaveBeenCalledWith("/contacts/c1");
  });

  it("click su risultato azienda chiama router.push con /companies/[id]", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    const input = screen.getByPlaceholderText(/digita per cercare/i);
    await user.type(input, "redstones");
    await user.click(screen.getByText("RedStones Srl"));
    expect(mockPush).toHaveBeenCalledWith("/companies/co1");
  });

  it("click su risultato deal chiama router.push con /deals/[id]", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    const input = screen.getByPlaceholderText(/digita per cercare/i);
    await user.type(input, "contratto");
    await user.click(screen.getByText("Contratto Mario"));
    expect(mockPush).toHaveBeenCalledWith("/deals/d1");
  });

  it("mostra heading Contatti, Aziende e Deal per query che matcha tutti i gruppi", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    const input = screen.getByPlaceholderText(/digita per cercare/i);
    await user.type(input, "r");
    expect(screen.getByText("Contatti")).toBeInTheDocument();
    expect(screen.getByText("Aziende")).toBeInTheDocument();
    expect(screen.getByText("Deal")).toBeInTheDocument();
  });

  it("mostra messaggio stato vuoto quando overlay aperto senza query", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    expect(screen.getByText("Digita per cercare contatti, aziende e deal...")).toBeInTheDocument();
  });

  it("mostra messaggio nessun risultato per query senza match", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    const input = screen.getByPlaceholderText(/digita per cercare/i);
    await user.type(input, "zzz");
    expect(screen.getByText(/nessun risultato per/i)).toBeInTheDocument();
  });

  it("chiude overlay con Escape", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    expect(screen.getByPlaceholderText(/digita per cercare/i)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText(/digita per cercare/i)).not.toBeInTheDocument();
  });

  it("resetta la query quando il dialog si chiude", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    const input = screen.getByPlaceholderText(/digita per cercare/i);
    await user.type(input, "mario");
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: /ricerca/i }));
    expect(screen.getByText("Digita per cercare contatti, aziende e deal...")).toBeInTheDocument();
  });
});
