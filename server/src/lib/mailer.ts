import { env } from "@/config/env.js"
import { logger } from "@/lib/logger.js"

export interface Email {
  to: string
  subject: string
  text: string
  html?: string
}

/** Emails "sent" while NODE_ENV=test, for assertions. */
export const testOutbox: Email[] = []

/**
 * Sends an email. With RESEND_API_KEY set it goes through Resend; otherwise
 * it is written to the log (development) or kept in testOutbox (tests).
 */
export async function sendEmail(email: Email): Promise<void> {
  if (env.NODE_ENV === "test") {
    testOutbox.push(email)
    return
  }

  if (!env.RESEND_API_KEY) {
    logger.info(
      { to: email.to, subject: email.subject },
      `Email (not sent, no RESEND_API_KEY):\n${email.text}`
    )
    return
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      ...(email.html && { html: email.html }),
    }),
  })
  if (!response.ok) {
    logger.error(
      { status: response.status, body: await response.text() },
      "Sending email failed"
    )
    throw new Error("Sending email failed")
  }
}
