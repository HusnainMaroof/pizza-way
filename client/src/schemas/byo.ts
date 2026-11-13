import { z } from "zod";

export const byoSelectionSchema = z.object({
  size: z.enum(["7", "9", "12", "15"]),
  sauce: z.enum(["tomato", "bbq"]),
  crust: z.enum(["thin", "deep-pan", "stone-baked"]),
  toppings: z.array(z.string()).max(18),
  qty: z.number().int().min(1).max(20),
});

export type ByoSelection = z.infer<typeof byoSelectionSchema>;
