import { z } from "zod/v3";

const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const createCompanySchema = z.object({
  name: z.string().min(1, "Nome obbligatorio").max(200, "Nome troppo lungo"),
  domain: z
    .string()
    .regex(domainRegex, "Dominio non valido")
    .optional()
    .nullable()
    .or(z.literal("")),
  sector: z.string().max(100, "Settore troppo lungo").optional().nullable(),
  description: z.string().max(2000, "Descrizione troppo lunga").optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().uuid("ID non valido"),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
