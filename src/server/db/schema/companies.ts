import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const enrichmentStatusEnum = pgEnum("enrichment_status", [
  "not_enriched",
  "enriched",
  "partial",
  "processing",
]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain"),
  sector: text("sector"),
  description: text("description"),
  address: text("address"),
  enrichmentDescription: text("enrichment_description"),
  enrichmentSector: text("enrichment_sector"),
  enrichmentSize: text("enrichment_size"),
  enrichmentPainPoints: text("enrichment_pain_points"),
  enrichmentStatus: enrichmentStatusEnum("enrichment_status").notNull().default("not_enriched"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
