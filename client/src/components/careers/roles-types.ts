/** Shared shape for an open role (Open Roles page). Data lives in roles-data.ts. */
export type Role = {
  id: string;
  title: string;
  department: string; // e.g. "Kitchen", "Delivery", "Management", "Corporate"
  location: string; // e.g. "London Soho"
  type: string; // e.g. "Full-time", "Part-time", "Flexible"
  summary: string;
  /** Optional extras shown in the card exactly as in the design (pay, tags ...). */
  pay?: string;
  tags?: string[];
  /** When the role was posted, shown in the card footer (e.g. "2 days ago"). */
  posted?: string;
};
