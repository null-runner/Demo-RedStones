"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { addNote } from "../_lib/timeline.actions";
import type { TimelineEntryWithAuthor } from "../_lib/timeline.service";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeDate } from "@/lib/format";

type TimelineFeedProps = {
  dealId: string;
  entries: TimelineEntryWithAuthor[];
};

export type TimelineFeedRef = {
  focusTextarea: () => void;
  setNoteText: (text: string) => void;
};

export const TimelineFeed = forwardRef<TimelineFeedRef, TimelineFeedProps>(function TimelineFeed(
  { dealId, entries },
  ref,
) {
  const [noteText, setNoteText] = useState("");
  const [optimistic, setOptimistic] = useState<TimelineEntryWithAuthor[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayEntries = [...optimistic, ...entries];

  useImperativeHandle(ref, () => ({
    focusTextarea: () => {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      textareaRef.current?.focus();
    },
    setNoteText: (text: string) => {
      setNoteText(text);
    },
  }));

  const handleAddNote = () => {
    const content = noteText.trim();
    if (!content) return;

    const tempEntry: TimelineEntryWithAuthor = {
      id: crypto.randomUUID(),
      dealId,
      type: "note",
      content,
      previousStage: null,
      newStage: null,
      authorId: null,
      createdAt: new Date(),
      author: null,
    };

    setOptimistic((prev) => [tempEntry, ...prev]);
    const savedText = noteText;
    setNoteText("");

    startTransition(async () => {
      const result = await addNote(dealId, content);
      if (!result.success) {
        setOptimistic((prev) => prev.filter((e) => e.id !== tempEntry.id));
        setNoteText(savedText);
        toast.error(result.error);
        return;
      }
      toast.success("Nota aggiunta");
      router.refresh();
      setOptimistic((prev) => prev.filter((e) => e.id !== tempEntry.id));
    });
  };

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          placeholder="Aggiungi una nota..."
          value={noteText}
          onChange={(e) => {
            setNoteText(e.target.value);
          }}
          rows={3}
          disabled={isPending}
        />
        <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim() || isPending}>
          Aggiungi nota
        </Button>
      </div>

      {/* Timeline entries */}
      {displayEntries.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          Nessuna attività registrata ancora.
        </p>
      ) : (
        <div className="relative space-y-3">
          {displayEntries.map((entry) => (
            <TimelineEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
});

function TimelineEntry({ entry }: { entry: TimelineEntryWithAuthor }) {
  const authorName = entry.author?.name ?? "Sistema";
  const relativeDate = formatRelativeDate(entry.createdAt);

  if (entry.type === "note") {
    return (
      <div className="flex gap-3 text-sm">
        <div className="bg-muted flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full">
          <MessageSquare className="text-muted-foreground h-3.5 w-3.5" />
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="text-foreground leading-snug">{entry.content}</p>
          <p className="text-muted-foreground text-xs">
            <span>{authorName}</span>
            {" · "}
            <span>{relativeDate}</span>
          </p>
        </div>
      </div>
    );
  }

  // stage_change
  return (
    <div className="flex gap-3 text-sm">
      <div className="bg-muted flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full">
        <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-muted-foreground">
          Stage cambiato da{" "}
          <span className="text-foreground font-medium">{entry.previousStage}</span>
          {" → "}
          <span className="text-foreground font-medium">{entry.newStage}</span>
        </p>
        <p className="text-muted-foreground text-xs">
          <span>{authorName}</span>
          {" · "}
          <span>{relativeDate}</span>
        </p>
      </div>
    </div>
  );
}
