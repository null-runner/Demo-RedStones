"use client";

import { useEffect, useState } from "react";
import { Building2, Handshake, User } from "lucide-react";
import { useRouter } from "next/navigation";

import type { SearchDataset } from "@/app/(dashboard)/_lib/search.actions";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatEUR } from "@/lib/format";

export function filterResults(
  query: string,
  dataset: SearchDataset,
  maxPerGroup = 5,
): SearchDataset {
  if (!query.trim()) return { contacts: [], companies: [], deals: [] };
  const q = query.toLowerCase().trim();

  function filterGroup<T>(items: T[], getText: (item: T) => string): T[] {
    const exact = items.filter((i) => getText(i).toLowerCase().startsWith(q));
    const partial = items.filter(
      (i) => !getText(i).toLowerCase().startsWith(q) && getText(i).toLowerCase().includes(q),
    );
    return [...exact, ...partial].slice(0, maxPerGroup);
  }

  return {
    contacts: filterGroup(dataset.contacts, (c) => c.name),
    companies: filterGroup(dataset.companies, (c) => c.name),
    deals: filterGroup(dataset.deals, (d) => d.title),
  };
}

type CommandMenuProps = { dataset: SearchDataset };

export function CommandMenu({ dataset }: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: client-only navigator check avoids hydration mismatch
    setIsMac(/mac/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filtered = filterResults(query, dataset);
  const hasResults =
    filtered.contacts.length > 0 || filtered.companies.length > 0 || filtered.deals.length > 0;

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Apri ricerca globale"
        className="text-muted-foreground hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
        onClick={() => {
          setOpen(true);
        }}
      >
        <span>Cerca...</span>
        <kbd className="bg-muted rounded px-1.5 py-0.5 text-xs">{isMac ? "⌘K" : "Ctrl+K"}</kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) setQuery("");
        }}
        title="Ricerca globale"
        description="Cerca contatti, aziende e deal"
        showCloseButton={false}
      >
        <CommandInput
          placeholder="Digita per cercare contatti, aziende e deal..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim() === "" ? (
            <CommandEmpty>Digita per cercare contatti, aziende e deal...</CommandEmpty>
          ) : !hasResults ? (
            <CommandEmpty>Nessun risultato per &quot;{query}&quot;</CommandEmpty>
          ) : (
            <>
              {filtered.contacts.length > 0 && (
                <CommandGroup heading="Contatti">
                  {filtered.contacts.map((c) => (
                    <CommandItem
                      key={c.id}
                      onSelect={() => {
                        handleSelect(`/contacts/${c.id}`);
                      }}
                    >
                      <User className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{c.name}</span>
                        {c.email !== null && (
                          <span className="text-muted-foreground text-xs">{c.email}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {filtered.companies.length > 0 && (
                <CommandGroup heading="Aziende">
                  {filtered.companies.map((co) => (
                    <CommandItem
                      key={co.id}
                      onSelect={() => {
                        handleSelect(`/companies/${co.id}`);
                      }}
                    >
                      <Building2 className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{co.name}</span>
                        {co.sector !== null && (
                          <span className="text-muted-foreground text-xs">{co.sector}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {filtered.deals.length > 0 && (
                <CommandGroup heading="Deal">
                  {filtered.deals.map((d) => (
                    <CommandItem
                      key={d.id}
                      onSelect={() => {
                        handleSelect(`/deals/${d.id}`);
                      }}
                    >
                      <Handshake className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{d.title}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatEUR(parseFloat(d.value))}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
