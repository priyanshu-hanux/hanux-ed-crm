import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  DATABASE_URL: z.url(),
  /** Production: e.g. ".yourdomain.com" so app. and api. share the cookie. */
  COOKIE_DOMAIN: z.string().optional(),
  /** Number of reverse proxies in front of the app (1 on Railway/Render). */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  /** The client app, for links in emails. */
  APP_URL: z.url().default("http://localhost:5173"),
  /** Sends real email through Resend when set; otherwise emails are logged. */
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Hanux CRM <no-reply@example.com>"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid environment variables:")
  console.error(z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data
export const isProduction = env.NODE_ENV === "production"
