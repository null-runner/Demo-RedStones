import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull(),
  isProtected: boolean("is_protected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PipelineStageRow = typeof pipelineStages.$inferSelect;
export type NewPipelineStageRow = typeof pipelineStages.$inferInsert;
