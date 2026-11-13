import { z } from "zod";

/** UK postcode (incl. GIR 0AA), space optional, case-insensitive. */
export const UK_POSTCODE_RE = /^(GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?[0-9][0-9A-HJKMNPR-Y]? ?[0-9][ABD-HJLNP-UW-Z]{2})$/i;

/** "m11ae" -> "M1 1AE". Returns the trimmed upper-cased input when it is not a valid postcode. */
export function formatPostcode(raw: string): string {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!UK_POSTCODE_RE.test(v)) return raw.trim().toUpperCase();
  return `${v.slice(0, -3)} ${v.slice(-3)}`;
}

export function isUkPostcode(raw: string): boolean {
  return UK_POSTCODE_RE.test(raw.trim());
}

/** Luhn checksum on a digits-only string. */
export function luhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return digits.length > 0 && sum % 10 === 0;
}

/** Card brand from the leading digits (display only). */
export function detectCardBrand(raw: string): "visa" | "mastercard" | undefined {
  const d = raw.replace(/\D/g, "");
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "mastercard";
  return undefined;
}

const EXPIRY_RE = /^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/;

/** True when "MM / YY" is a real month that has not ended yet. */
export function isExpiryValid(raw: string, now = new Date()): boolean {
  const m = EXPIRY_RE.exec(raw.trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  // First day of the month AFTER expiry must be in the future.
  return new Date(year, month, 1).getTime() > now.getTime();
}

const required = (msg: string) => z.string().trim().min(1, msg);

/** Contact details (always required). Phone: spaces allowed, removed before the regex check. */
export const contactDetailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: required("Email is required").pipe(z.email("Enter a valid email address")),
  phone: required("Phone number is required")
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\+?[0-9]{10,14}$/, "Enter a valid phone number")),
});

/** Delivery address (delivery only). */
export const deliveryAddressSchema = z.object({
  postcode: required("Postcode is required")
    .refine(isUkPostcode, "Enter a valid UK postcode")
    .transform(formatPostcode),
  line1: z.string().trim().min(3, "Enter the first line of your address"),
  line2: z.string().trim().max(100, "Keep this under 100 characters"),
  city: z.string().trim().min(2, "Enter your town or city"),
  instructions: z.string().trim().max(200, "Keep instructions under 200 characters"),
});

/** Card fields. Validated in memory only: never stored or logged. */
export const cardSchema = z.object({
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(
      z
        .string()
        .min(1, "Card number is required")
        .regex(/^[0-9]{16}$/, "Card number must be 16 digits")
        .refine(luhn, "Check your card number"),
    ),
  expiry: required("Expiry date is required")
    .regex(EXPIRY_RE, "Use MM / YY")
    .refine((v) => isExpiryValid(v), "This card has expired"),
  cvc: required("Security code is required").regex(/^[0-9]{3,4}$/, "CVC must be 3 or 4 digits"),
  saveCard: z.boolean(),
});

export const DELIVERY_TIME_MODES = ["asap", "later"] as const;

/**
 * Full checkout form. Address fields are only checked when `fulfilment` is "delivery",
 * and `slot` is only required when the time mode is "later".
 */
export const checkoutFormSchema = z
  .object({
    fulfilment: z.enum(["delivery", "collection"]),
    timeMode: z.enum(DELIVERY_TIME_MODES),
    slot: z.string().trim(),
    // Address raw strings (checked conditionally below).
    postcode: z.string(),
    line1: z.string(),
    line2: z.string(),
    city: z.string(),
    instructions: z.string(),
  })
  .extend(contactDetailsSchema.shape)
  .extend(cardSchema.shape)
  .superRefine((v, ctx) => {
    if (v.fulfilment === "delivery") {
      const res = deliveryAddressSchema.safeParse(v);
      if (!res.success) {
        for (const issue of res.error.issues) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
      }
    }
    if (v.timeMode === "later" && !v.slot) {
      ctx.addIssue({ code: "custom", path: ["slot"], message: "Choose a delivery time" });
    }
  });

export type ContactDetails = z.infer<typeof contactDetailsSchema>;
export type DeliveryAddress = z.infer<typeof deliveryAddressSchema>;
export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
