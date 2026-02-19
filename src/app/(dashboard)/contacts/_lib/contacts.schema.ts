import { z } from "zod/v3";

export const createContactSchema = z.object({
  firstName: z.string().min(1, "Nome obbligatorio").max(100),
  lastName: z.string().min(1, "Cognome obbligatorio").max(100),
  email: z.string().refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Email non valida",
  }),
  phone: z.string().refine((val) => val === "" || /^[+\d\s\-()]{7,20}$/.test(val), {
    message: "Telefono non valido",
  }),
  role: z.string().max(100),
  companyId: z.string().uuid("ID azienda non valido").optional().nullable(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().uuid("ID non valido"),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;
