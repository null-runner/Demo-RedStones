"use client";

import { useEffect, useRef } from "react";
import PusherClient from "pusher-js";

import type { DealEvent } from "@/lib/pusher-events";

const PUSHER_KEY = process.env["NEXT_PUBLIC_PUSHER_KEY"] ?? "";
const PUSHER_CLUSTER = process.env["NEXT_PUBLIC_PUSHER_CLUSTER"] ?? "";

let pusherInstance: PusherClient | null = null;

function getPusherClient(): PusherClient | null {
  if (!PUSHER_KEY || !PUSHER_CLUSTER) return null;
  if (!pusherInstance) {
    pusherInstance = new PusherClient(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
  }
  return pusherInstance;
}

export function useBoardSync(channel: string, onEvent: (event: DealEvent) => void): void {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const ch = pusher.subscribe(channel);

    const handler = (data: DealEvent) => {
      onEventRef.current(data);
    };

    ch.bind("deal:created", handler);
    ch.bind("deal:updated", handler);
    ch.bind("deal:deleted", handler);

    return () => {
      ch.unbind("deal:created", handler);
      ch.unbind("deal:updated", handler);
      ch.unbind("deal:deleted", handler);
      pusher.unsubscribe(channel);
    };
  }, [channel]);
}
