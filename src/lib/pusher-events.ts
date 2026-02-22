import type { Deal } from "@/server/db/schema";

export const DEALS_CHANNEL = "deals";

export type DealEvent =
  | { type: "deal:created"; deal: Deal }
  | { type: "deal:updated"; deal: Deal }
  | { type: "deal:deleted"; dealId: string };
