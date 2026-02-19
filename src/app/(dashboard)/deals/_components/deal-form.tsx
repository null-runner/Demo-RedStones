"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createDealSchema, type CreateDealInput } from "../_lib/deals.schema";

import { LOST_REASONS } from "@/lib/constants/lost-reasons";
import { PIPELINE_STAGES } from "@/lib/constants/pipeline";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Deal } from "@/server/db/schema";

export type DealFormSubmitData = CreateDealInput & { lostReason?: string | null };

type DealFormProps = {
  initialData?: Deal | null;
  companies: Array<{ id: string; name: string }>;
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  users: Array<{ id: string; name: string }>;
  onSubmit: (data: DealFormSubmitData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export function DealForm({
  initialData,
  companies,
  contacts,
  users,
  onSubmit,
  onCancel,
  isLoading,
}: DealFormProps) {
  // Parse stored "reason: notes" format back into separate fields
  const storedLostReason = initialData?.lostReason ?? "";
  const matchedReason = LOST_REASONS.find((r) => storedLostReason.startsWith(r));
  const [lostReason, setLostReason] = useState<string>(matchedReason ?? "");
  const [lostReasonNotes, setLostReasonNotes] = useState<string>(
    matchedReason && storedLostReason.startsWith(`${matchedReason}: `)
      ? storedLostReason.slice(matchedReason.length + 2)
      : "",
  );
  const [lostReasonError, setLostReasonError] = useState<string | null>(null);

  const form = useForm<CreateDealInput>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      value: initialData?.value !== undefined ? parseFloat(initialData.value) : 0,
      stage: initialData?.stage ?? "Lead",
      contactId: initialData?.contactId ?? null,
      companyId: initialData?.companyId ?? null,
      ownerId: initialData?.ownerId ?? null,
    },
  });

  const watchedStage = form.watch("stage");

  const handleFormSubmit = (data: CreateDealInput) => {
    if (data.stage === "Chiuso Perso" && !lostReason) {
      setLostReasonError("Seleziona un motivo di perdita");
      return;
    }
    const trimmedNotes = lostReasonNotes.trim();
    const fullLostReason = trimmedNotes ? `${lostReason}: ${trimmedNotes}` : lostReason;
    void onSubmit({
      ...data,
      lostReason: data.stage === "Chiuso Perso" ? fullLostReason : null,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          void form.handleSubmit(handleFormSubmit)(e);
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titolo *</FormLabel>
              <FormControl>
                <Input
                  placeholder="CRM Custom per Cliente X"
                  {...field}
                  disabled={isLoading ?? false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valore (EUR) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="5000"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.valueAsNumber);
                  }}
                  disabled={isLoading ?? false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage *</FormLabel>
              <Select
                onValueChange={(val) => {
                  field.onChange(val);
                  // Reset lostReason fields when leaving "Chiuso Perso"
                  if (val !== "Chiuso Perso") {
                    setLostReason("");
                    setLostReasonNotes("");
                    setLostReasonError(null);
                  }
                }}
                defaultValue={field.value}
                disabled={isLoading ?? false}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedStage === "Chiuso Perso" && (
          <div className="space-y-1.5">
            <Label htmlFor="deal-form-lost-reason">
              Motivo perdita <span className="text-destructive">*</span>
            </Label>
            <Select
              value={lostReason}
              onValueChange={(val) => {
                setLostReason(val);
                setLostReasonError(null);
              }}
              disabled={isLoading ?? false}
            >
              <SelectTrigger id="deal-form-lost-reason">
                <SelectValue placeholder="Seleziona motivo..." />
              </SelectTrigger>
              <SelectContent>
                {LOST_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lostReasonError && <p className="text-destructive text-sm">{lostReasonError}</p>}
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="deal-form-lost-notes">Note (opzionale)</Label>
              <Textarea
                id="deal-form-lost-notes"
                placeholder="Aggiungi dettagli..."
                value={lostReasonNotes}
                onChange={(e) => {
                  setLostReasonNotes(e.target.value);
                }}
                rows={3}
                disabled={isLoading ?? false}
              />
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="contactId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contatto</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v === "_none" ? null : v);
                }}
                defaultValue={field.value ?? "_none"}
                disabled={isLoading ?? false}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Nessun contatto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="_none">Nessun contatto</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Azienda</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v === "_none" ? null : v);
                }}
                defaultValue={field.value ?? "_none"}
                disabled={isLoading ?? false}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Nessuna azienda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="_none">Nessuna azienda</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ownerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v === "_none" ? null : v);
                }}
                defaultValue={field.value ?? "_none"}
                disabled={isLoading ?? false}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Nessun owner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="_none">Nessun owner</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading ?? false}>
            Annulla
          </Button>
          <Button type="submit" disabled={isLoading ?? false}>
            {isLoading ? "Salvataggio..." : initialData ? "Aggiorna Deal" : "Crea Deal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
