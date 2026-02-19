"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createDealSchema, type CreateDealInput } from "../_lib/deals.schema";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Deal } from "@/server/db/schema";

type DealFormProps = {
  initialData?: Deal | null;
  companies: Array<{ id: string; name: string }>;
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  users: Array<{ id: string; name: string }>;
  onSubmit: (data: CreateDealInput) => void | Promise<void>;
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

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          void form.handleSubmit(onSubmit)(e);
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
                onValueChange={field.onChange}
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
