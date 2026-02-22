import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";

import { contacts } from "./contacts";
import { tags } from "./tags";

export const contactsToTags = pgTable(
  "contacts_to_tags",
  {
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.contactId, t.tagId] }),
    index("idx_contacts_to_tags_contact_id").on(t.contactId),
  ],
);
