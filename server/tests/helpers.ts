import { randomBytes } from "node:crypto"
import request from "supertest"
import { createApp } from "@/app.js"
import { prisma } from "@/lib/prisma.js"

export const app = createApp()

const createdEmails = new Set<string>()

export function uniqueEmail(): string {
  const email = `test-${randomBytes(6).toString("hex")}@example.test`
  createdEmails.add(email)
  return email
}

export const PASSWORD = "Str0ngPassw0rd"

/** Signs up a new org and returns an agent that keeps the session cookie. */
export async function signupAgent(overrides: Record<string, string> = {}) {
  const agent = request.agent(app)
  const email = uniqueEmail()
  const res = await agent.post("/v1/auth/signup").send({
    orgName: "Test Org",
    name: "Test Owner",
    email,
    password: PASSWORD,
    timezone: "Asia/Kolkata",
    ...overrides,
  })
  if (res.status !== 201) {
    throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`)
  }
  const session = await agent.get("/v1/auth/session")
  return { agent, email, session: session.body.data }
}

/** Deletes every user and organization the tests created. */
export async function cleanup() {
  const emails = [...createdEmails]
  const orgs = await prisma.membership.findMany({
    where: { user: { email: { in: emails } } },
    select: { orgId: true },
  })
  await prisma.organization.deleteMany({
    where: { id: { in: orgs.map((m) => m.orgId) } },
  })
  await prisma.user.deleteMany({ where: { email: { in: emails } } })
  createdEmails.clear()
}
