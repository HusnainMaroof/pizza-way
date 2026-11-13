export type StoreService = "collection" | "delivery";

export type Store = {
  id: string;
  name: string;
  /** Short area name used on the map label, e.g. "Salford (1.2m)". */
  area: string;
  status: string;
  distanceMiles: number;
  address: string;
  postcode: string;
  services: StoreService[];
  /** Marker centre on the stylised map as literal Tailwind classes (% of the 752x700 Figma map box). */
  mapClass: string;
};

export const STORES: Store[] = [
  {
    id: "manchester",
    name: "Pizzaway Manchester",
    area: "Manchester",
    status: "Open now until 11pm",
    distanceMiles: 0.3,
    address: "123 Oxford Road, Manchester",
    postcode: "M1 5QA",
    services: ["collection", "delivery"],
    mapClass: "left-[46.5%] top-[34%]",
  },
  {
    id: "salford",
    name: "Pizzaway Salford",
    area: "Salford",
    status: "Open now until 10pm",
    distanceMiles: 1.2,
    address: "45 Chapel Street, Salford",
    postcode: "M3 6AF",
    services: ["collection", "delivery"],
    mapClass: "left-[22.3%] top-[52.9%]",
  },
  {
    id: "stockport",
    name: "Pizzaway Stockport",
    area: "Stockport",
    status: "Opens at 11am tomorrow",
    distanceMiles: 2.8,
    address: "12 Great Underbank, Stockport",
    postcode: "SK1 1PD",
    services: ["collection"],
    mapClass: "left-[62.2%] top-[24.3%]",
  },
];

const compact = (s: string) => s.toLowerCase().replace(/\s+/g, "");

/** Case-insensitive match on name / address, or postcode prefix ("m1", "SK1 1"). */
export function storeMatches(store: Store, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    store.name.toLowerCase().includes(q) ||
    store.address.toLowerCase().includes(q) ||
    compact(store.postcode).startsWith(compact(q))
  );
}
