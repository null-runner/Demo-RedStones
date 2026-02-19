import { relations } from "drizzle-orm";

import { companies, enrichmentStatusEnum } from "./companies";
import { contactsToTags } from "./contacts-to-tags";
import { contacts } from "./contacts";
import { deals } from "./deals";
import { tags } from "./tags";
import { timelineEntries, timelineEntryTypeEnum } from "./timeline-entries";
import { userRoleEnum, users } from "./users";

// Re-export tables and enums
export {
  companies,
  enrichmentStatusEnum,
  contactsToTags,
  contacts,
  deals,
  tags,
  timelineEntries,
  timelineEntryTypeEnum,
  userRoleEnum,
  users,
};

// Re-export types
export type { Company, NewCompany } from "./companies";
export type { Contact, NewContact } from "./contacts";
export type { Deal, NewDeal } from "./deals";
export type { NewTag, Tag } from "./tags";
export type { NewTimelineEntry, TimelineEntry } from "./timeline-entries";
export type { NewUser, User } from "./users";

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  deals: many(deals),
  timelineEntries: many(timelineEntries),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  deals: many(deals),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  deals: many(deals),
  tags: many(contactsToTags),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  company: one(companies, {
    fields: [deals.companyId],
    references: [companies.id],
  }),
  owner: one(users, {
    fields: [deals.ownerId],
    references: [users.id],
  }),
  timelineEntries: many(timelineEntries),
}));

export const timelineEntriesRelations = relations(timelineEntries, ({ one }) => ({
  deal: one(deals, {
    fields: [timelineEntries.dealId],
    references: [deals.id],
  }),
  author: one(users, {
    fields: [timelineEntries.authorId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  contacts: many(contactsToTags),
}));

export const contactsToTagsRelations = relations(contactsToTags, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactsToTags.contactId],
    references: [contacts.id],
  }),
  tag: one(tags, {
    fields: [contactsToTags.tagId],
    references: [tags.id],
  }),
}));
