-- Composite indexes for deals queries filtered by stage + date
CREATE INDEX IF NOT EXISTS "idx_deals_stage_created" ON "deals" ("stage","created_at");
CREATE INDEX IF NOT EXISTS "idx_deals_stage_updated" ON "deals" ("stage","updated_at");

-- Timeline entries: faster lookups by deal_id (used in dashboard NBA, deal detail)
CREATE INDEX IF NOT EXISTS "idx_timeline_entries_deal_id" ON "timeline_entries" ("deal_id");

-- Contacts-to-tags: faster tag lookups per contact (PK is contactId+tagId, but explicit index helps)
CREATE INDEX IF NOT EXISTS "idx_contacts_to_tags_contact_id" ON "contacts_to_tags" ("contact_id");
