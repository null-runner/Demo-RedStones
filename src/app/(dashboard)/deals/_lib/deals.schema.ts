import { z } from "zod/v3";

export const createDealSchema = z.object({
  title: z.string().min(1, "Titolo obbligatorio").max(200, "Titolo troppo lungo"),
  value: z.coerce
    .number({ invalid_type_error: "Il valore deve essere >= 0" })
    .min(0, "Il valore deve essere >= 0"),
  stage: z.string().min(1, "Stage obbligatorio"),
  contactId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().uuid("ID non valido"),
  lostReason: z.string().nullable().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
