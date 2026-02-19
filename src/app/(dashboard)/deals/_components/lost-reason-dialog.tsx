"use client";

import { useState } from "react";

import { LOST_REASONS } from "@/lib/constants/lost-reasons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type LostReasonDialogProps = {
  open: boolean;
  dealTitle: string;
  onConfirm: (reason: string, notes: string | null) => void;
  onCancel: () => void;
};

export function LostReasonDialog({ open, dealTitle, onConfirm, onCancel }: LostReasonDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!reason) {
      setError("Seleziona un motivo di perdita");
      return;
    }
    onConfirm(reason, notes.trim() || null);
    setReason("");
    setNotes("");
    setError(null);
  };

  const handleCancel = () => {
    setReason("");
    setNotes("");
    setError(null);
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Motivo di perdita</DialogTitle>
          <DialogDescription>
            Perché è andato perso il deal <strong>{dealTitle}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="lost-reason-select">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={reason}
              onValueChange={(val) => {
                setReason(val);
                setError(null);
              }}
            >
              <SelectTrigger id="lost-reason-select">
                <SelectValue placeholder="Seleziona un motivo..." />
              </SelectTrigger>
              <SelectContent>
                {LOST_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lost-reason-notes">Note (opzionale)</Label>
            <Textarea
              id="lost-reason-notes"
              placeholder="Aggiungi dettagli..."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
              }}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Conferma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
