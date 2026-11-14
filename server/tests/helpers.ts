import { randomBytes } from "node:crypto"
import request from "supertest"
import { createApp } from "@/app.js"
import { testOutbox } from "@/lib/mailer.js"
import { prisma } from "@/lib/prisma.js"

export const app = createApp()

const createdEmails = new Set<string>()

export function uniqueEmail(): string {
  const email = `test-${randomBytes(6).toString("hex")}@example.test`
  createdEmails.add(email)
  return email
}

export const PASSWORD = "Str0ngPassw0rd"

/**
 * Signs up a new org and returns an agent that keeps the session cookie.
 * The owner's email is marked verified (so they can invite) unless
 * `verified: false`; security.test.ts covers the real verification flow.
 */
export async function signupAgent(
  overrides: Record<string, string> = {},
  { verified = true }: { verified?: boolean } = {}
) {
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
  if (verified) {
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    })
  }
  const session = await agent.get("/v1/auth/session")
  return { agent, email, session: session.body.data }
}

/** The raw session token in an agent's cookie jar. */
export function cookieOf(agent: ReturnType<typeof request.agent>): string {
  const cookie = agent.jar.getCookie("session", {
    domain: "127.0.0.1",
    path: "/",
    secure: false,
    script: false,
  })
  if (!cookie) throw new Error("no session cookie")
  return cookie.value
}

export async function addBranch(orgId: string, name: string) {
  return prisma.branch.create({
    data: { orgId, name, timezone: "UTC" },
  })
}

type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EXECUTIVE"

/** Adds a user to an org with the given role assignments. */
export async function addMember(
  orgId: string,
  homeBranchId: string,
  assignments: { role: Role; branchId?: string }[]
) {
  const user = await prisma.user.create({
    data: { email: uniqueEmail(), name: "Member", passwordHash: "x" },
  })
  return prisma.membership.create({
    data: {
      userId: user.id,
      orgId,
      homeBranchId,
      roleAssignments: {
        create: assignments.map((a) => ({
          role: a.role,
          branchId: a.branchId ?? null,
        })),
      },
    },
    include: { roleAssignments: true },
  })
}

/** The token from the latest invitation email sent to `email`. */
export function inviteTokenFor(email: string): string {
  const mail = [...testOutbox].reverse().find((m) => m.to === email)
  const token = mail?.text.match(/\/auth\/invite\/([A-Za-z0-9_-]+)/)?.[1]
  if (!token) throw new Error(`no invitation email for ${email}`)
  return token
}

type Agent = ReturnType<typeof request.agent>

/** Invites a new person through the API, accepts as them, returns their agent. */
export async function inviteAndAccept(
  inviter: Agent,
  input: { role: Role; branchId?: string; teamId?: string }
) {
  const email = uniqueEmail()
  const res = await inviter.post("/v1/invites").send({ email, ...input })
  if (res.status !== 201) {
    throw new Error(`invite failed: ${res.status} ${JSON.stringify(res.body)}`)
  }
  const agent = request.agent(app)
  const accepted = await agent
    .post(`/v1/auth/invites/${inviteTokenFor(email)}/accept`)
    .send({ name: `${input.role} person`, password: PASSWORD })
  if (accepted.status !== 201) {
    throw new Error(
      `accept failed: ${accepted.status} ${JSON.stringify(accepted.body)}`
    )
  }
  const session = (await agent.get("/v1/auth/session")).body.data
  return { agent, email, session, id: session.membership.id as string }
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
  // Entries without an org (e.g. a Platform Admin with no org of their own).
  await prisma.auditLog.deleteMany({
    where: { orgId: null, actor: { email: { in: emails } } },
  })
  await prisma.user.deleteMany({ where: { email: { in: emails } } })
  createdEmails.clear()
}
