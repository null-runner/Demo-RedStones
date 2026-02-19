import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { deals } from "./deals";
import { users } from "./users";

export const timelineEntryTypeEnum = pgEnum("timeline_entry_type", ["note", "stage_change"]);

export const timelineEntries = pgTable(
  "timeline_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    type: timelineEntryTypeEnum("type").notNull(),
    content: text("content"),
    previousStage: text("previous_stage"),
    newStage: text("new_stage"),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_timeline_entries_deal_id").on(t.dealId)],
);

export type TimelineEntry = typeof timelineEntries.$inferSelect;
export type NewTimelineEntry = typeof timelineEntries.$inferInsert;
