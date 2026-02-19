"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createCompanySchema, type CreateCompanyInput } from "../_lib/companies.schema";

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
import { Textarea } from "@/components/ui/textarea";
import type { Company } from "@/server/db/schema";

type CompanyFormProps = {
  initialData?: Company | null;
  onSubmit: (data: CreateCompanyInput) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export function CompanyForm({ initialData, onSubmit, onCancel, isLoading }: CompanyFormProps) {
  const form = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      domain: initialData?.domain ?? "",
      sector: initialData?.sector ?? "",
      description: initialData?.description ?? "",
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="RedStones Srl" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dominio</FormLabel>
              <FormControl>
                <Input
                  placeholder="redstones.it"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sector"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Settore</FormLabel>
              <FormControl>
                <Input
                  placeholder="SaaS, Retail, Pharma..."
                  {...field}
                  value={field.value ?? ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Breve descrizione dell'azienda..."
                  {...field}
                  value={field.value ?? ""}
                  disabled={isLoading}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Annulla
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvataggio..." : initialData ? "Aggiorna" : "Crea Azienda"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
