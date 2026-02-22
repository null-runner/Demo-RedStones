import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    DATABASE_URL_UNPOOLED: z.url(),
    AUTH_SECRET: z.string().min(32),
    AUTH_URL: z.url(),
    GEMINI_API_KEY: z.string().min(1),
    PUSHER_APP_ID: z.string().min(1).optional().default(""),
    PUSHER_SECRET: z.string().min(1).optional().default(""),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_PUSHER_KEY: z.string().min(1).optional().default(""),
    NEXT_PUBLIC_PUSHER_CLUSTER: z.string().min(1).optional().default(""),
  },
  runtimeEnv: {
    DATABASE_URL: process.env["DATABASE_URL"],
    DATABASE_URL_UNPOOLED: process.env["DATABASE_URL_UNPOOLED"],
    AUTH_SECRET: process.env["AUTH_SECRET"],
    AUTH_URL: process.env["AUTH_URL"],
    GEMINI_API_KEY: process.env["GEMINI_API_KEY"],
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
    PUSHER_APP_ID: process.env["PUSHER_APP_ID"],
    PUSHER_SECRET: process.env["PUSHER_SECRET"],
    NEXT_PUBLIC_PUSHER_KEY: process.env["NEXT_PUBLIC_PUSHER_KEY"],
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env["NEXT_PUBLIC_PUSHER_CLUSTER"],
  },
  skipValidation: process.env["SKIP_ENV_VALIDATION"] === "1" && process.env["NODE_ENV"] === "test",
});
