import { z } from "zod";

export const orderItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  qty: z.number().int().min(1).max(20),
  /** Optional display extras for the basket: short description line and image path. */
  meta: z.string().optional(),
  image: z.string().optional(),
});

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  phone: z.string().regex(/^\+?[0-9]{10,14}$/, "Invalid phone number"),
  address: z.string().trim().min(5, "Address is too short"),
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type Checkout = z.infer<typeof checkoutSchema>;
