import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    DATABASE_URL_UNPOOLED: z.url(),
    AUTH_SECRET: z.string().min(32),
    AUTH_URL: z.url(),
    GEMINI_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env["DATABASE_URL"],
    DATABASE_URL_UNPOOLED: process.env["DATABASE_URL_UNPOOLED"],
    AUTH_SECRET: process.env["AUTH_SECRET"],
    AUTH_URL: process.env["AUTH_URL"],
    GEMINI_API_KEY: process.env["GEMINI_API_KEY"],
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
  },
  skipValidation: process.env["SKIP_ENV_VALIDATION"] === "1" && process.env["NODE_ENV"] === "test",
});
