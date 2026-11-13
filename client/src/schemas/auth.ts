import { z } from "zod";

export const emailSchema = z.string().trim().min(1, "Email is required").email("Enter a valid email address");

/** Sign in: any valid email + a password of at least 8 characters (no backend yet: nothing is verified). */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: emailSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
