"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { checkDuplicateContact } from "../_lib/contacts.actions";
import { createContactSchema, type CreateContactInput } from "../_lib/contacts.schema";
import type { ContactWithCompanyAndTags } from "../_lib/contacts.service";
import { TagInput } from "./tag-input";

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
  initialData?: ContactWithCompanyAndTags | null;
  companies: Array<{ id: string; name: string }>;
  allTags: Array<{ id: string; name: string }>;
  onSubmit: (data: CreateContactInput) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ContactForm({
  initialData,
  companies,
  allTags,
  onSubmit,
  onCancel,
  isLoading = false,
}: ContactFormProps) {
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const form = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: initialData
      ? {
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          email: initialData.email ?? "",
          phone: initialData.phone ?? "",
          role: initialData.role ?? "",
          companyId: initialData.companyId ?? null,
          tagNames: initialData.tags.map((t) => t.name),
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: "",
          companyId: null,
          tagNames: [],
        },
  });

  const watchedCompanyId = form.watch("companyId");
  const watchedEmail = form.watch("email");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchedCompanyId && watchedEmail && watchedEmail.includes("@")) {
        void checkDuplicateContact(watchedCompanyId, watchedEmail, initialData?.id).then(
          (result) => {
            if (result.success && result.data.isDuplicate) {
              setDuplicateWarning(
                `Possibile duplicato trovato: ${result.data.duplicateName ?? ""}`,
              );
            } else {
              setDuplicateWarning(null);
            }
          },
        );
      } else {
        setDuplicateWarning(null);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [watchedCompanyId, watchedEmail, initialData?.id]);

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

        <FormField
          control={form.control}
          name="tagNames"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value}
                  allTags={allTags}
                  onAdd={(name) => {
                    field.onChange([...field.value, name]);
                  }}
                  onRemove={(name) => {
                    field.onChange(field.value.filter((t) => t !== name));
                  }}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {duplicateWarning && (
          <div
            role="alert"
            className="rounded-md border border-yellow-400 bg-yellow-50 px-3 py-2 text-sm text-yellow-800"
          >
            ⚠ {duplicateWarning}
          </div>
        )}

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
