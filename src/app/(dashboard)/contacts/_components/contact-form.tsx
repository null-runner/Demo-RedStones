"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { checkDuplicateContact } from "../_lib/contacts.actions";
import { createContactSchema, type CreateContactInput } from "../_lib/contacts.schema";
import type { ContactWithCompanyAndTags } from "../_lib/contacts.service";
import { TagInput } from "./tag-input";

import { CompanyForm } from "@/app/(dashboard)/companies/_components/company-form";
import type { CreateCompanyInput } from "@/app/(dashboard)/companies/_lib/companies.schema";
import { createCompany } from "@/app/(dashboard)/companies/_lib/companies.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  defaultCompanyId?: string;
};

export function ContactForm({
  initialData,
  companies,
  allTags,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultCompanyId,
}: ContactFormProps) {
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [localCompanies, setLocalCompanies] = useState(companies);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [isCreatingCompany, startCompanyTransition] = useTransition();

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
          companyId: defaultCompanyId ?? null,
          tagNames: [],
        },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
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

  const handleCreateCompany = (data: CreateCompanyInput) => {
    startCompanyTransition(async () => {
      const result = await createCompany(data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const newCompany = { id: result.data.id, name: result.data.name };
      setLocalCompanies((prev) =>
        [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name)),
      );
      form.setValue("companyId", newCompany.id);
      setCompanyDialogOpen(false);
      toast.success("Azienda creata");
    });
  };

  return (
    <>
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
                  <Input
                    id="email"
                    placeholder="mario@esempio.com"
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
                    field.onChange(val === "_none" ? null : val);
                  }}
                  value={field.value ?? "_none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona azienda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Nessuna azienda</SelectItem>
                    {localCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto px-0 text-xs"
                  onClick={() => {
                    setCompanyDialogOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Nuova Azienda
                </Button>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tagNames"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Tag
                  <span title="I tag permettono di categorizzare i contatti per facilitare ricerche e segmentazione. Esempi: decision-maker, tecnico, marketing, partner, VIP">
                    <Info className="text-muted-foreground h-3.5 w-3.5" />
                  </span>
                </FormLabel>
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

      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuova Azienda</DialogTitle>
            <DialogDescription>Crea una nuova azienda da associare al contatto.</DialogDescription>
          </DialogHeader>
          <CompanyForm
            key={companyDialogOpen ? "open" : "closed"}
            onSubmit={handleCreateCompany}
            onCancel={() => {
              setCompanyDialogOpen(false);
            }}
            isLoading={isCreatingCompany}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
