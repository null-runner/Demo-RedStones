import { index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { contacts } from "./contacts";
import { users } from "./users";

import type { PipelineStage } from "@/lib/constants/pipeline";

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    value: numeric("value", { precision: 12, scale: 2 }).notNull().default("0"),
    stage: text("stage").notNull().$type<PipelineStage>(),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    lostReason: text("lost_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_deals_company_id").on(t.companyId),
    index("idx_deals_owner_id").on(t.ownerId),
    index("idx_deals_stage").on(t.stage),
  ],
);

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
