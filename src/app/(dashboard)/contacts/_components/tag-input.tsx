"use client";

import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";

type TagInputProps = {
  value: string[];
  allTags: Array<{ id: string; name: string }>;
  onAdd: (tagName: string) => void;
  onRemove: (tagName: string) => void;
  disabled?: boolean;
};

export function TagInput({ value, allTags, onAdd, onRemove, disabled }: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTags = allTags.filter(
    (t) =>
      !value.includes(t.name) && (inputValue === "" || t.name.includes(inputValue.toLowerCase())),
  );

  function handleAdd(tagName: string) {
    const trimmed = tagName.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onAdd(trimmed);
    setInputValue("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !value.includes(trimmed)) {
        onAdd(trimmed);
        setInputValue("");
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && (filteredTags.length > 0 || inputValue.trim().length > 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="border-input bg-background flex min-h-[40px] flex-wrap items-center gap-1 rounded-md border p-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              aria-label={`Rimuovi ${tag}`}
              className="hover:bg-muted ml-1 rounded-sm"
              disabled={disabled}
              onClick={() => {
                onRemove(tag);
              }}
            >
              ×
            </button>
          </Badge>
        ))}
        <input
          className="placeholder:text-muted-foreground min-w-[120px] flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
          placeholder="Aggiungi tag..."
          value={inputValue}
          disabled={disabled}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onBlur={() => {
            // Delay to allow click on dropdown items
            setTimeout(() => {
              setOpen(false);
            }, 150);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {showDropdown && (
        <div
          role="listbox"
          className="bg-popover absolute z-50 mt-1 w-full rounded-md border p-1 shadow-md"
        >
          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              role="option"
              aria-selected={false}
              className="hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                handleAdd(tag.name);
              }}
            >
              {tag.name}
            </button>
          ))}
          {inputValue.trim() && !value.includes(inputValue.trim()) && (
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground text-muted-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAdd(inputValue.trim());
              }}
            >
              Crea tag &ldquo;{inputValue.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
