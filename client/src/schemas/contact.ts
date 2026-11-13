import { z } from "zod";

export const CONTACT_SUBJECTS = [
  { value: "general", label: "General inquiry" },
  { value: "order", label: "Order or delivery issue" },
  { value: "feedback", label: "Feedback" },
  { value: "catering", label: "Catering and events" },
  { value: "franchise", label: "Franchise opportunities" },
] as const;

const subjectValues = CONTACT_SUBJECTS.map((s) => s.value) as [
  (typeof CONTACT_SUBJECTS)[number]["value"],
  ...(typeof CONTACT_SUBJECTS)[number]["value"][],
];

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  // Optional. Spaces are allowed while typing ("07123 456789"), then removed before the regex check.
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^\+?[0-9]{10,14}$/, "Invalid phone number")]))
    .optional(),
  subject: z.enum(subjectValues, { error: "Please choose a subject" }),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be 1000 characters or less"),
});

export type Contact = z.infer<typeof contactSchema>;
export type ContactInput = z.input<typeof contactSchema>;
