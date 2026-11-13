"use client";

import { useEffect, useState } from "react";
import type { PlacedOrder } from "@/store/order-store";

/** The 4 pipeline stages from the Figma tracking design. */
export const TRACKING_STAGES = [
  { id: "received", title: "Order Received", description: "Your transaction has settled and sourdough formula has been dispatched to our kitchens." },
  { id: "preparing", title: "Preparing Your Pizza", description: "Hand-stretching organic sourdough base, laying San Marzano DOP tomatoes and fior di latte." },
  { id: "transit", title: "Out for Delivery", description: "Your pies are locked in our patented hotbox and are route-optimizing with dynamic GPS." },
  { id: "delivered", title: "Delivered", description: "Charred Neapolitan gold arrives at your domestic threshold." },
] as const;

/** Collection orders reuse the stages with different wording for the last two. */
export const COLLECTION_STAGE_TEXT: Record<"transit" | "delivered", { title: string; description: string }> = {
  transit: { title: "Ready for Collection", description: "Your pies are boxed, hot and waiting at the collection counter." },
  delivered: { title: "Collected", description: "Enjoy your sourdough. See you again soon!" },
};

/** Minutes after the order was placed at which each stage starts (delivery / collection). */
const DELIVERY_OFFSETS = [0, 7, 17, 32];
const COLLECTION_OFFSETS = [0, 5, 15, 25];

export type TrackingState = {
  /** Index of the active stage (0..3). 3 means delivered/collected: every earlier stage is complete. */
  active: number;
  /** Timestamp each stage started (null when it has not started yet). */
  startedAt: (Date | null)[];
  /** Whole minutes until arrival (0 when done). */
  etaMinutes: number;
  /** 0..1 progress through the whole pipeline, for a progress bar or the map. */
  progress: number;
  done: boolean;
};

export function getTrackingState(order: Pick<PlacedOrder, "placedAt" | "fulfilment">, now: Date = new Date()): TrackingState {
  const offsets = order.fulfilment === "collection" ? COLLECTION_OFFSETS : DELIVERY_OFFSETS;
  const placed = new Date(order.placedAt).getTime();
  const minutes = Math.max(0, (now.getTime() - placed) / 60000);
  let active = 0;
  offsets.forEach((o, i) => {
    if (minutes >= o) active = i;
  });
  const total = offsets[offsets.length - 1];
  return {
    active,
    startedAt: offsets.map((o, i) => (i <= active ? new Date(placed + o * 60000) : null)),
    etaMinutes: Math.max(0, Math.ceil(total - minutes)),
    progress: Math.min(1, minutes / total),
    done: active === offsets.length - 1,
  };
}

/** Re-renders every `ms` milliseconds with the current time (null on the server/first render). */
export function useNow(ms = 30000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** "12:05 PM" */
export function formatClock(d: Date | null): string {
  return d ? d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase() : "--";
}
