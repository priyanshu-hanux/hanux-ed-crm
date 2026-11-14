import request from "supertest"
import { afterAll, describe, expect, it } from "vitest"
import { sha256 } from "@/lib/crypto.js"
import { prisma } from "@/lib/prisma.js"
import { app, cleanup, PASSWORD, signupAgent, uniqueEmail } from "./helpers.js"

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

/** Finds the session row behind an agent's cookie. */
async function sessionOf(agent: ReturnType<typeof request.agent>) {
  const cookie = agent.jar.getCookie("session", {
    domain: "127.0.0.1",
    path: "/",
    secure: false,
    script: false,
  })
  if (!cookie) throw new Error("no session cookie")
  return prisma.session.findUniqueOrThrow({
    where: { tokenHash: sha256(cookie.value) },
  })
}

describe("signup", () => {
  it("creates org, Main branch and owner as Super Admin, and signs in", async () => {
    const agent = request.agent(app)
    const email = uniqueEmail()
    const res = await agent.post("/v1/auth/signup").send({
      orgName: "Acme Academy",
      name: "Priya",
      email: email.toUpperCase(),
      password: PASSWORD,
      timezone: "Asia/Kolkata",
    })

    expect(res.status).toBe(201)
    const setCookie = String(res.headers["set-cookie"])
    expect(setCookie).toMatch(/session=/)
    expect(setCookie).toMatch(/HttpOnly/i)
    expect(setCookie).toMatch(/SameSite=Lax/i)

    const session = await agent.get("/v1/auth/session")
    expect(session.status).toBe(200)
    expect(session.headers["x-authz-version"]).toBe("1")

    const data = session.body.data
    expect(data.user.email).toBe(email) // stored lowercase
    expect(data.organization.name).toBe("Acme Academy")
    expect(data.organization.slug).toMatch(/^acme-academy/)
    expect(data.organization.timezone).toBe("Asia/Kolkata")
    expect(data.branches).toHaveLength(1)
    expect(data.branches[0]).toMatchObject({ name: "Main", isDefault: true })
    expect(data.membership.isOwner).toBe(true)
    expect(data.assignments).toEqual([
      expect.objectContaining({ role: "SUPER_ADMIN", branch: null }),
    ])
    expect(data.activeAssignmentId).toBe(data.assignments[0].id)

    // Only the hash is stored.
    const row = await sessionOf(agent)
    expect(row.tokenHash).toHaveLength(64)
  })

  it("rejects an email that already has an account", async () => {
    const { email } = await signupAgent()
    const res = await request(app).post("/v1/auth/signup").send({
      orgName: "Other",
      name: "Someone",
      email,
      password: PASSWORD,
    })
    expect(res.status).toBe(409)
    expect(res.body.code).toBe("EMAIL_IN_USE")
  })

  it("enforces the password rules", async () => {
    const res = await request(app).post("/v1/auth/signup").send({
      orgName: "Org",
      name: "Someone",
      email: uniqueEmail(),
      password: "alllowercase1",
    })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe("VALIDATION_ERROR")
    expect(res.body.error.fieldErrors.password[0]).toMatch(/uppercase/)
  })

  it("gives a second org with the same name its own slug", async () => {
    const a = await signupAgent({ orgName: "Same Name" })
    const b = await signupAgent({ orgName: "Same Name" })
    expect(a.session.organization.slug).not.toBe(b.session.organization.slug)
  })
})

describe("login and logout", () => {
  it("signs in case-insensitively and replaces the browser's old session", async () => {
    const { agent, email } = await signupAgent()
    const before = await sessionOf(agent)

    const res = await agent
      .post("/v1/auth/login")
      .send({ email: email.toUpperCase(), password: PASSWORD })
    expect(res.status).toBe(200)

    const after = await sessionOf(agent)
    expect(after.id).not.toBe(before.id)
    const old = await prisma.session.findUniqueOrThrow({
      where: { id: before.id },
    })
    expect(old.revokedReason).toBe("SIGNED_OUT")
    expect((await agent.get("/v1/auth/session")).status).toBe(200)
  })

  it("gives the same answer for a wrong password and an unknown email", async () => {
    const { email } = await signupAgent()
    const wrong = await request(app)
      .post("/v1/auth/login")
      .send({ email, password: "Wr0ngPassword" })
    const unknown = await request(app)
      .post("/v1/auth/login")
      .send({ email: uniqueEmail(), password: PASSWORD })

    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401)
      expect(res.body.code).toBe("INVALID_CREDENTIALS")
      expect(res.body.message).toBe("Incorrect email or password")
    }
  })

  it("logout revokes the session and clears the cookie", async () => {
    const { agent } = await signupAgent()
    const row = await sessionOf(agent)

    const res = await agent.post("/v1/auth/logout")
    expect(res.status).toBe(200)
    expect(String(res.headers["set-cookie"])).toMatch(/session=;/)

    const revoked = await prisma.session.findUniqueOrThrow({
      where: { id: row.id },
    })
    expect(revoked.revokedReason).toBe("SIGNED_OUT")
    expect((await agent.get("/v1/auth/session")).body.code).toBe(
      "UNAUTHENTICATED"
    )
  })
})

describe("every request is checked against the database", () => {
  it("rejects requests without a session", async () => {
    const res = await request(app).get("/v1/me")
    expect(res.status).toBe(401)
    expect(res.body.code).toBe("UNAUTHENTICATED")
  })

  it("ends access immediately when the member is deactivated", async () => {
    const { agent, session } = await signupAgent()
    expect((await agent.get("/v1/me")).status).toBe(200)

    await prisma.membership.update({
      where: { id: session.membership.id },
      data: { status: "DEACTIVATED" },
    })

    const res = await agent.get("/v1/me")
    expect(res.status).toBe(401)
    expect(res.body.code).toBe("SESSION_REVOKED")
    expect(String(res.headers["set-cookie"])).toMatch(/session=;/)
  })

  it("ends access immediately when the organization is suspended", async () => {
    const { agent, session } = await signupAgent()
    await prisma.organization.update({
      where: { id: session.organization.id },
      data: { status: "SUSPENDED" },
    })
    const res = await agent.get("/v1/me")
    expect(res.status).toBe(401)
    expect(res.body.code).toBe("SESSION_REVOKED")
  })

  it("rejects a session idle for more than 7 days", async () => {
    const { agent } = await signupAgent()
    const row = await sessionOf(agent)
    await prisma.session.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    })
    const res = await agent.get("/v1/me")
    expect(res.status).toBe(401)
    expect(res.body.code).toBe("SESSION_EXPIRED")
  })

  it("moves to another role when the active one is removed", async () => {
    const { agent, session } = await signupAgent()
    const superAdmin = session.assignments[0]
    const admin = await prisma.roleAssignment.create({
      data: {
        membershipId: session.membership.id,
        role: "ADMIN",
        branchId: session.branches[0].id,
      },
    })
    await prisma.roleAssignment.delete({ where: { id: superAdmin.id } })

    const changed = await agent.get("/v1/me")
    expect(changed.status).toBe(403)
    expect(changed.body.code).toBe("PERMISSIONS_CHANGED")

    const reloaded = await agent.get("/v1/auth/session")
    expect(reloaded.status).toBe(200)
    expect(reloaded.body.data.activeAssignmentId).toBe(admin.id)
  })

  it("signs out when no role is left", async () => {
    const { agent, session } = await signupAgent()
    const before = await sessionOf(agent)
    await prisma.roleAssignment.deleteMany({
      where: { membershipId: session.membership.id },
    })
    const res = await agent.get("/v1/me")
    expect(res.status).toBe(401)
    expect(res.body.code).toBe("SESSION_REVOKED")
    const row = await prisma.session.findUniqueOrThrow({
      where: { id: before.id },
    })
    expect(row.revokedReason).toBe("NO_ROLES_LEFT")
  })
})

describe("security guards", () => {
  it("refuses state-changing requests that aren't JSON (CSRF)", async () => {
    const res = await request(app)
      .post("/v1/auth/login")
      .type("form")
      .send({ email: "a@b.c", password: "x" })
    expect(res.status).toBe(415)
  })

  it("the database refuses a branch on Super Admin and a missing branch on Admin", async () => {
    const { session } = await signupAgent()
    const membershipId = session.membership.id
    await expect(
      prisma.roleAssignment.create({
        data: {
          membershipId,
          role: "SUPER_ADMIN",
          branchId: session.branches[0].id,
        },
      })
    ).rejects.toThrow(/role_assignments_branch_matches_role/)
    await expect(
      prisma.roleAssignment.create({ data: { membershipId, role: "ADMIN" } })
    ).rejects.toThrow(/role_assignments_branch_matches_role/)
  })
})
