import "server-only";

import Pusher from "pusher";

import { env } from "./env";

const isConfigured =
  env.PUSHER_APP_ID !== "" &&
  env.PUSHER_SECRET !== "" &&
  env.NEXT_PUBLIC_PUSHER_KEY !== "" &&
  env.NEXT_PUBLIC_PUSHER_CLUSTER !== "";

const pusherInstance = isConfigured
  ? new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.NEXT_PUBLIC_PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    })
  : null;

export async function triggerEvent(channel: string, event: string, data: unknown): Promise<void> {
  if (!pusherInstance) return;
  await pusherInstance.trigger(channel, event, data);
}
