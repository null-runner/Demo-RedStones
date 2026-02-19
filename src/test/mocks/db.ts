// Mock for '@/server/db' in Vitest test environment
import { vi } from "vitest";

export const db = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: {},
};
