"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";

import { createContactSchema, type CreateContactInput } from "../_lib/contacts.schema";
import type { ContactWithCompany } from "../_lib/contacts.service";

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

type ContactFormProps = {
  initialData?: ContactWithCompany | null;
  companies: Array<{ id: string; name: string }>;
  onSubmit: (data: CreateContactInput) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ContactForm({
  initialData,
  companies,
  onSubmit,
  onCancel,
  isLoading = false,
}: ContactFormProps) {
  const form = useForm<CreateContactInput>({
    resolver: standardSchemaResolver(createContactSchema),
    defaultValues: initialData
      ? {
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          email: initialData.email ?? "",
          phone: initialData.phone ?? "",
          role: initialData.role ?? "",
          companyId: initialData.companyId ?? null,
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: "",
          companyId: null,
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
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="firstName">Nome</FormLabel>
              <FormControl>
                <Input id="firstName" placeholder="Mario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="lastName">Cognome</FormLabel>
              <FormControl>
                <Input id="lastName" placeholder="Rossi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="email">Email</FormLabel>
              <FormControl>
                <Input id="email" placeholder="mario@esempio.com" {...field} value={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="phone">Telefono</FormLabel>
              <FormControl>
                <Input id="phone" placeholder="+39 02 1234567" {...field} value={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="role">Ruolo</FormLabel>
              <FormControl>
                <Input
                  id="role"
                  placeholder="es. CEO, Sales Manager"
                  {...field}
                  value={field.value}
                />
              </FormControl>
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
                onValueChange={(val) => {
                  field.onChange(val === "none" ? null : val);
                }}
                value={field.value ?? "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona azienda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nessuna azienda</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Annulla
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
