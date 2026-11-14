import request from "supertest"
import { afterAll, describe, expect, it } from "vitest"
import { testOutbox } from "@/lib/mailer.js"
import { prisma } from "@/lib/prisma.js"
import {
  grantPlatformAdmin,
  revokePlatformAdmin,
} from "@/modules/platform/platform.service.js"
import { app, cleanup, PASSWORD, signupAgent, uniqueEmail } from "./helpers.js"

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

/** A Platform Admin with no organization, signed in. */
async function platformOnlyAdmin() {
  const email = uniqueEmail()
  expect((await grantPlatformAdmin(email, "Hanux Staff")).created).toBe(true)

  // New staff set their password from the emailed link.
  const mail = testOutbox.findLast((m) => m.to === email)
  const token = mail?.text.match(/reset-password\/([A-Za-z0-9_-]+)/)?.[1]
  await request(app)
    .post("/v1/auth/password/reset")
    .send({ token, password: PASSWORD })
    .expect(200)

  const agent = request.agent(app)
  await agent
    .post("/v1/auth/login")
    .send({ email, password: PASSWORD })
    .expect(200)
  return { agent, email }
}

describe("Platform Admin without an organization", () => {
  it("signs in to platform mode and can't use org routes", async () => {
    const { agent } = await platformOnlyAdmin()

    const session = (await agent.get("/v1/auth/session")).body.data
    expect(session).toMatchObject({
      mode: "platform",
      organization: null,
      activeAssignmentId: null,
      permissions: {},
      user: { isPlatformAdmin: true, name: "Hanux Staff" },
    })

    const members = await agent.get("/v1/members")
    expect(members.status).toBe(403)
    expect(members.body.code).toBe("PLATFORM_MODE")

    expect((await agent.get("/v1/platform/stats")).status).toBe(200)
    expect((await agent.get("/v1/me")).status).toBe(200) // own account still works
  })

  it("loses access on the next request when revoked", async () => {
    const { agent, email } = await platformOnlyAdmin()
    await revokePlatformAdmin(email)
    const res = await agent.get("/v1/platform/stats")
    expect(res.status).toBe(401)
    expect(res.body.code).toBe("SESSION_REVOKED")
  })
})

describe("platform routes", () => {
  it("are refused to org users, even Super Admins", async () => {
    const { agent } = await signupAgent()
    const res = await agent.get("/v1/platform/organizations")
    expect(res.status).toBe(403)
    expect(res.body.code).toBe("FORBIDDEN")
  })

  it("suspending an org cuts its members off at once; restoring lets them back", async () => {
    const { agent: platform } = await platformOnlyAdmin()
    const owner = await signupAgent({ orgName: "Suspend Me Academy" })
    const orgId = owner.session.organization.id

    const list = await platform.get(
      "/v1/platform/organizations?search=Suspend%20Me"
    )
    const listed = list.body.data.find((o: { id: string }) => o.id === orgId)
    expect(listed).toMatchObject({
      name: "Suspend Me Academy",
      status: "ACTIVE",
      memberCount: 1,
      owner: { email: owner.email },
    })

    await platform
      .post(`/v1/platform/organizations/${orgId}/suspend`)
      .send({ reason: "Unpaid invoice" })
      .expect(200)

    const cutOff = await owner.agent.get("/v1/me")
    expect(cutOff.status).toBe(401)
    expect(cutOff.body.code).toBe("SESSION_REVOKED")
    const login = await request(app)
      .post("/v1/auth/login")
      .send({ email: owner.email, password: PASSWORD })
    expect(login.body.code).toBe("ORGANIZATION_SUSPENDED")

    const detail = (await platform.get(`/v1/platform/organizations/${orgId}`))
      .body.data
    expect(detail).toMatchObject({
      status: "SUSPENDED",
      suspendedReason: "Unpaid invoice",
    })

    await platform
      .post(`/v1/platform/organizations/${orgId}/restore`)
      .expect(200)
    const back = request.agent(app)
    await back
      .post("/v1/auth/login")
      .send({ email: owner.email, password: PASSWORD })
      .expect(200)

    // The org's Super Admin can see who suspended it and why.
    const log = (await back.get("/v1/audit-log?action=platform.")).body.data
    expect(log.map((e: { action: string }) => e.action)).toEqual([
      "platform.org_restored",
      "platform.org_suspended",
    ])
    expect(log[1]).toMatchObject({
      actorName: "Hanux Staff",
      metadata: { reason: "Unpaid invoice" },
    })

    const platformLog = (await platform.get("/v1/platform/audit-log")).body.data
    expect(platformLog[0]).toMatchObject({
      action: "platform.org_restored",
      organization: { id: orgId },
    })
  })
})

describe("Platform Admin who also belongs to an organization", () => {
  it("signs in to their org role and switches to platform and back", async () => {
    const { agent, email, session } = await signupAgent()
    await grantPlatformAdmin(email)
    await agent
      .post("/v1/auth/login")
      .send({ email, password: PASSWORD })
      .expect(200)

    const org = (await agent.get("/v1/auth/session")).body.data
    expect(org.mode).toBe("org")
    expect(org.user.isPlatformAdmin).toBe(true)

    const toPlatform = await agent
      .post("/v1/auth/switch-role")
      .send({ platform: true })
    expect(toPlatform.body.data.mode).toBe("platform")
    expect(toPlatform.body.data.assignments).toHaveLength(1) // can switch back
    expect((await agent.get("/v1/members")).body.code).toBe("PLATFORM_MODE")

    const back = await agent
      .post("/v1/auth/switch-role")
      .send({ assignmentId: session.assignments[0].id })
    expect(back.body.data.mode).toBe("org")
    expect((await agent.get("/v1/members")).status).toBe(200)
  })

  it("falls back to their org role when platform access is revoked", async () => {
    const { agent, email } = await signupAgent()
    await grantPlatformAdmin(email)
    await agent
      .post("/v1/auth/login")
      .send({ email, password: PASSWORD })
      .expect(200)
    await agent
      .post("/v1/auth/switch-role")
      .send({ platform: true })
      .expect(200)

    await revokePlatformAdmin(email)
    const res = await agent.get("/v1/platform/stats")
    expect(res.status).toBe(403)
    expect(res.body.code).toBe("PERMISSIONS_CHANGED")
    expect((await agent.get("/v1/auth/session")).body.data.mode).toBe("org")
  })

  it("people who aren't Platform Admins can't switch to it", async () => {
    const { agent } = await signupAgent()
    const res = await agent
      .post("/v1/auth/switch-role")
      .send({ platform: true })
    expect(res.status).toBe(403)
  })
})

it("the database refuses an org session without an org", async () => {
  const { session } = await signupAgent()
  await expect(
    prisma.session.create({
      data: {
        tokenHash: `test-${Date.now()}`,
        userId: session.user.id,
        membershipId: null,
        orgId: null,
        expiresAt: new Date(Date.now() + 60_000),
      },
    })
  ).rejects.toThrow(/sessions_org_unless_platform/)
})

describe("platform team", () => {
  it("lists every Platform Admin with their org and actions; activity filters by person", async () => {
    const { agent: hana, email: hanaEmail } = await platformOnlyAdmin()
    const withOrg = await signupAgent({ orgName: "Staff Own Academy" })
    await grantPlatformAdmin(withOrg.email)
    const target = await signupAgent({ orgName: "Team Target Org" })
    const orgId = target.session.organization.id

    await hana
      .post(`/v1/platform/organizations/${orgId}/suspend`)
      .send({ reason: "Team page test" })
      .expect(200)

    const admins = (await hana.get("/v1/platform/admins")).body.data
    const me = admins.find((a: { email: string }) => a.email === hanaEmail)
    const other = admins.find(
      (a: { email: string }) => a.email === withOrg.email
    )
    expect(me).toMatchObject({
      isYou: true,
      organization: null,
      actionCount: 1,
    })
    expect(me.lastActionAt).not.toBeNull()
    expect(other).toMatchObject({
      isYou: false,
      organization: { name: "Staff Own Academy" },
      actionCount: 0,
      lastActionAt: null,
    })

    const mine = (await hana.get(`/v1/platform/audit-log?actorId=${me.id}`))
      .body.data
    expect(mine.map((e: { action: string }) => e.action)).toEqual([
      "platform.org_suspended",
    ])
    const theirs = (
      await hana.get(`/v1/platform/audit-log?actorId=${other.id}`)
    ).body.data
    expect(theirs).toEqual([])

    // Org users can't see the platform team.
    expect((await target.agent.get("/v1/platform/admins")).status).toBe(401) // suspended
    expect((await withOrg.agent.get("/v1/platform/admins")).status).toBe(403) // org mode
  })
})
