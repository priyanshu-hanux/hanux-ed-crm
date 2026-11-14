import { z } from "zod"

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone })
    return true
  } catch {
    return false
  }
}

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254))

/** Same rule as the client's sign-up hint. */
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")

export const signupSchema = z.object({
  orgName: z.string().trim().min(2).max(100),
  name: z.string().trim().min(1).max(100),
  email,
  password: newPassword,
  timezone: z.string().refine(isValidTimeZone, "Unknown time zone").optional(),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
