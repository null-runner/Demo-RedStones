"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { createStage, deleteStage, renameStage } from "../_lib/pipeline-stages.actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PipelineStageRow } from "@/server/db/schema";

type PipelineStageListProps = {
  stages: PipelineStageRow[];
  isAdmin: boolean;
};

export function PipelineStageList({ stages, isAdmin }: PipelineStageListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const nonProtectedStages = stages.filter((s) => !s.isProtected);
  const protectedStages = stages.filter((s) => s.isProtected);

  const handleStartRename = (stage: PipelineStageRow) => {
    setEditingId(stage.id);
    setEditingName(stage.name);
  };

  const handleConfirmRename = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await renameStage(id, trimmed);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setEditingId(null);
      router.refresh();
      toast.success("Stage rinominato");
    });
  };

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const result = await deleteStage(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success(`Stage "${name}" eliminato`);
    });
  };

  const handleAddStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createStage(trimmed);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setNewStageName("");
      setShowAddForm(false);
      router.refresh();
      toast.success(`Stage "${trimmed}" creato`);
    });
  };

  return (
    <div className="space-y-3">
      {/* Non-protected stages */}
      {nonProtectedStages.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuno stage personalizzato.</p>
      ) : (
        <ul className="space-y-2">
          {nonProtectedStages.map((stage) => (
            <li key={stage.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
              {isAdmin && editingId === stage.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => {
                      setEditingName(e.target.value);
                    }}
                    className="h-7 flex-1 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleConfirmRename(stage.id);
                      }
                      if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      handleConfirmRename(stage.id);
                    }}
                    disabled={isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingId(null);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{stage.name}</span>
                  {isAdmin && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        aria-label="Rinomina"
                        onClick={() => {
                          handleStartRename(stage);
                        }}
                        disabled={isPending}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive h-7 w-7"
                        aria-label="Elimina"
                        onClick={() => {
                          handleDelete(stage.id, stage.name);
                        }}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Protected stages (read-only) */}
      <ul className="space-y-2">
        {protectedStages.map((stage) => (
          <li
            key={stage.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2 opacity-70"
          >
            <span className="flex-1 text-sm">{stage.name}</span>
            <Badge variant="outline" className="gap-1 text-xs">
              <Lock className="h-3 w-3" />
              Protetto
            </Badge>
          </li>
        ))}
      </ul>

      {/* Add new stage — admin only */}
      {isAdmin &&
        (showAddForm ? (
          <div className="flex items-center gap-2">
            <Input
              value={newStageName}
              onChange={(e) => {
                setNewStageName(e.target.value);
              }}
              placeholder="Nome nuovo stage..."
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddStage();
                }
                if (e.key === "Escape") {
                  setShowAddForm(false);
                  setNewStageName("");
                }
              }}
            />
            <Button size="sm" onClick={handleAddStage} disabled={!newStageName.trim() || isPending}>
              <Check className="mr-1 h-3.5 w-3.5" />
              Salva
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setNewStageName("");
              }}
            >
              Annulla
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAddForm(true);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Aggiungi stage
          </Button>
        ))}
    </div>
  );
}
