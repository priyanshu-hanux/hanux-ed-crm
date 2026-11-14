import request from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { testOutbox } from "@/lib/mailer.js"
import { prisma } from "@/lib/prisma.js"
import {
  app,
  cleanup,
  inviteAndAccept,
  inviteTokenFor,
  PASSWORD,
  signupAgent,
  uniqueEmail,
} from "./helpers.js"

type Agent = ReturnType<typeof request.agent>
type Person = Awaited<ReturnType<typeof inviteAndAccept>>

// One org shared by the tests below:
//   owner (Super Admin, Main)
//   Bangalore: admin, manager; Main: executive
let owner: { agent: Agent; session: { membership: { id: string } } }
let mainId: string
let blrId: string
let blrAdmin: Person
let blrManager: Person
let mainExec: Person

beforeAll(async () => {
  const signedUp = await signupAgent({ orgName: "People Test Org" })
  owner = signedUp
  mainId = signedUp.session.branches[0].id
  const branch = await owner.agent
    .post("/v1/branches")
    .send({ name: "Bangalore", code: "BLR", timezone: "Asia/Kolkata" })
  expect(branch.status).toBe(201)
  blrId = branch.body.data.id

  blrAdmin = await inviteAndAccept(owner.agent, {
    role: "ADMIN",
    branchId: blrId,
  })
  blrManager = await inviteAndAccept(owner.agent, {
    role: "MANAGER",
    branchId: blrId,
  })
  mainExec = await inviteAndAccept(owner.agent, {
    role: "EXECUTIVE",
    branchId: mainId,
  })
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe("invitations", () => {
  it("emails a link, shows it, and creates a signed-in member on accept", async () => {
    const email = uniqueEmail()
    const sent = await owner.agent
      .post("/v1/invites")
      .send({ email, role: "EXECUTIVE", branchId: blrId })
    expect(sent.status).toBe(201)
    expect(sent.body.data).toMatchObject({
      status: "PENDING",
      role: "EXECUTIVE",
    })

    const mail = testOutbox.findLast((m) => m.to === email)
    expect(mail?.subject).toMatch(/invited you to People Test Org/)
    const token = inviteTokenFor(email)

    const view = await request(app).get(`/v1/auth/invites/${token}`)
    expect(view.status).toBe(200)
    expect(view.body.data).toMatchObject({
      email,
      role: "EXECUTIVE",
      organization: { name: "People Test Org" },
      branch: { name: "Bangalore" },
      accountExists: false,
    })

    const agent = request.agent(app)
    const accepted = await agent
      .post(`/v1/auth/invites/${token}/accept`)
      .send({ name: "New Person", password: PASSWORD })
    expect(accepted.status).toBe(201)

    const session = (await agent.get("/v1/auth/session")).body.data
    expect(session.user.email).toBe(email)
    expect(session.user.emailVerifiedAt).not.toBeNull()
    expect(session.membership.homeBranchId).toBe(blrId)
    expect(session.assignments[0]).toMatchObject({
      role: "EXECUTIVE",
      branch: { id: blrId },
    })

    // The link works once.
    const again = await request(app)
      .post(`/v1/auth/invites/${token}/accept`)
      .send({ name: "Again", password: PASSWORD })
    expect(again.status).toBe(404)
    expect(again.body.code).toBe("INVITE_INVALID")
  })

  it("refuses people who are already members", async () => {
    const res = await owner.agent
      .post("/v1/invites")
      .send({ email: mainExec.email, role: "EXECUTIVE", branchId: mainId })
    expect(res.status).toBe(409)
    expect(res.body.code).toBe("ALREADY_MEMBER")
  })

  it("resend replaces the link; revoke closes it", async () => {
    const email = uniqueEmail()
    const sent = await owner.agent
      .post("/v1/invites")
      .send({ email, role: "EXECUTIVE", branchId: mainId })
    const firstToken = inviteTokenFor(email)

    await owner.agent
      .post(`/v1/invites/${sent.body.data.id}/resend`)
      .expect(200)
    const secondToken = inviteTokenFor(email)
    expect(secondToken).not.toBe(firstToken)
    expect(
      (await request(app).get(`/v1/auth/invites/${firstToken}`)).status
    ).toBe(404)
    expect(
      (await request(app).get(`/v1/auth/invites/${secondToken}`)).status
    ).toBe(200)

    await owner.agent.delete(`/v1/invites/${sent.body.data.id}`).expect(200)
    expect(
      (await request(app).get(`/v1/auth/invites/${secondToken}`)).status
    ).toBe(404)
  })

  it("bulk invites report each row", async () => {
    const good = uniqueEmail()
    const res = await owner.agent.post("/v1/invites/bulk").send({
      invites: [
        { email: good, role: "EXECUTIVE", branchId: mainId },
        { email: "not-an-email", role: "EXECUTIVE", branchId: mainId },
        { email: mainExec.email, role: "EXECUTIVE", branchId: mainId },
      ],
    })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ sent: 1, failed: 2 })
    expect(res.body.data.results.map((r: { ok: boolean }) => r.ok)).toEqual([
      true,
      false,
      false,
    ])
  })

  it("Admins invite Managers and Executives into their own branch only", async () => {
    const admin = blrAdmin.agent
    const asAdmin = (body: object) =>
      admin.post("/v1/invites").send({ email: uniqueEmail(), ...body })

    expect((await asAdmin({ role: "MANAGER", branchId: blrId })).status).toBe(
      201
    )
    expect((await asAdmin({ role: "ADMIN", branchId: blrId })).status).toBe(403)
    expect(
      (await asAdmin({ role: "EXECUTIVE", branchId: mainId })).status
    ).toBe(403)
  })

  it("Managers invite Executives into their team; Executives can't invite", async () => {
    const noTeam = await blrManager.agent
      .post("/v1/invites")
      .send({ email: uniqueEmail(), role: "EXECUTIVE" })
    expect(noTeam.status).toBe(400)

    const team = await owner.agent.post("/v1/teams").send({
      name: "Invite Team",
      homeBranchId: blrId,
      managerId: blrManager.id,
    })
    expect(team.status).toBe(201)

    const invited = await inviteAndAccept(blrManager.agent, {
      role: "EXECUTIVE",
    })
    const member = await prisma.membership.findUniqueOrThrow({
      where: { id: invited.id },
    })
    expect(member.teamId).toBe(team.body.data.id)
    expect(member.homeBranchId).toBe(blrId)

    const manager = await blrManager.agent
      .post("/v1/invites")
      .send({ email: uniqueEmail(), role: "MANAGER", branchId: blrId })
    expect(manager.status).toBe(403)

    const exec = await mainExec.agent
      .post("/v1/invites")
      .send({ email: uniqueEmail(), role: "EXECUTIVE", branchId: mainId })
    expect(exec.status).toBe(403)
  })
})

describe("members", () => {
  it("everyone can read the directory, with roles", async () => {
    const res = await mainExec.agent.get("/v1/members?limit=100")
    expect(res.status).toBe(200)
    const admin = res.body.data.find(
      (m: { id: string }) => m.id === blrAdmin.id
    )
    expect(admin.roles[0]).toMatchObject({
      role: "ADMIN",
      branch: { name: "Bangalore" },
    })
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(4)
  })

  it("Admins manage their branch's non-admins only", async () => {
    const blrExec = await inviteAndAccept(owner.agent, {
      role: "EXECUTIVE",
      branchId: blrId,
    })
    const admin = blrAdmin.agent

    // Another branch, a peer Admin, and themselves: no.
    expect(
      (await admin.post(`/v1/members/${mainExec.id}/deactivate`)).status
    ).toBe(403)
    expect(
      (await admin.post(`/v1/members/${blrAdmin.id}/deactivate`)).status
    ).toBe(403)

    // Their branch's Executive: yes, and access ends at once.
    expect((await blrExec.agent.get("/v1/me")).status).toBe(200)
    expect(
      (await admin.post(`/v1/members/${blrExec.id}/deactivate`)).status
    ).toBe(200)
    const after = await blrExec.agent.get("/v1/me")
    expect(after.status).toBe(401)
    expect(after.body.code).toBe("SESSION_REVOKED")

    const reactivated = await admin.post(`/v1/members/${blrExec.id}/reactivate`)
    expect(reactivated.body.data.status).toBe("ACTIVE")
  })

  it("Executives can't manage anyone", async () => {
    const res = await mainExec.agent.post(
      `/v1/members/${blrManager.id}/deactivate`
    )
    expect(res.status).toBe(403)
  })

  it("protects the owner and the last Super Admin", async () => {
    const ownerId = owner.session.membership.id
    const otherSuper = await inviteAndAccept(owner.agent, {
      role: "SUPER_ADMIN",
    })
    expect(
      (await otherSuper.agent.post(`/v1/members/${ownerId}/deactivate`)).status
    ).toBe(409)

    const ownerRoles = (await owner.agent.get(`/v1/members/${ownerId}`)).body
      .data.roles
    const removeOwnerSuper = await otherSuper.agent.delete(
      `/v1/members/${ownerId}/roles/${ownerRoles[0].id}`
    )
    expect(removeOwnerSuper.status).toBe(409)

    expect(
      (await owner.agent.post(`/v1/members/${ownerId}/deactivate`)).status
    ).toBe(403)
  })

  it("role grants follow 'no one grants more than they have'", async () => {
    const target = await inviteAndAccept(owner.agent, {
      role: "EXECUTIVE",
      branchId: blrId,
    })
    const admin = blrAdmin.agent
    const grant = (body: object) =>
      admin.post(`/v1/members/${target.id}/roles`).send(body)

    expect((await grant({ role: "MANAGER", branchId: blrId })).status).toBe(201)
    expect((await grant({ role: "ADMIN", branchId: blrId })).status).toBe(403)
    expect((await grant({ role: "EXECUTIVE", branchId: mainId })).status).toBe(
      403
    )
    expect((await grant({ role: "MANAGER", branchId: blrId })).status).toBe(409)

    // Removing their only role is refused; removing one of two is fine.
    const roles = (await admin.get(`/v1/members/${target.id}`)).body.data.roles
    const manager = roles.find((r: { role: string }) => r.role === "MANAGER")
    const removed = await admin.delete(
      `/v1/members/${target.id}/roles/${manager.id}`
    )
    expect(removed.status).toBe(200)
    const [only] = removed.body.data.roles
    expect(
      (await admin.delete(`/v1/members/${target.id}/roles/${only.id}`)).status
    ).toBe(409)
  })
})

describe("teams", () => {
  it("Admins create teams in their branch; members may come from any branch", async () => {
    const created = await blrAdmin.agent.post("/v1/teams").send({
      name: "Cross Region",
      homeBranchId: blrId,
      managerId: blrManager.id,
    })
    expect(created.status).toBe(201)
    const teamId = created.body.data.id

    const before = await prisma.membership.findUniqueOrThrow({
      where: { id: mainExec.id },
    })
    const set = await blrAdmin.agent
      .put(`/v1/teams/${teamId}/members`)
      .send({ membershipIds: [mainExec.id] }) // a Main-branch member
    expect(set.status).toBe(200)
    expect(set.body.data.members[0]).toMatchObject({
      id: mainExec.id,
      homeBranch: { name: "Main" },
    })
    const after = await prisma.membership.findUniqueOrThrow({
      where: { id: mainExec.id },
    })
    expect(after.authzVersion).toBe(before.authzVersion + 1)

    const elsewhere = await blrAdmin.agent
      .post("/v1/teams")
      .send({ name: "Main Team", homeBranchId: mainId })
    expect(elsewhere.status).toBe(403)
  })

  it("requires the manager to be a Manager in the team's branch", async () => {
    const res = await owner.agent.post("/v1/teams").send({
      name: "Bad Manager",
      homeBranchId: mainId,
      managerId: blrManager.id, // Manager in Bangalore, not Main
    })
    expect(res.status).toBe(400)
  })
})

describe("branches", () => {
  it("only Super Admins create branches; Admins edit their own", async () => {
    expect(
      (
        await blrAdmin.agent
          .post("/v1/branches")
          .send({ name: "Pune", timezone: "Asia/Kolkata" })
      ).status
    ).toBe(403)
    expect(
      (await blrAdmin.agent.patch(`/v1/branches/${blrId}`).send({ code: "BL" }))
        .status
    ).toBe(200)
    expect(
      (
        await blrAdmin.agent
          .patch(`/v1/branches/${mainId}`)
          .send({ code: "MN" })
      ).status
    ).toBe(403)
  })

  it("archives only empty, non-default branches", async () => {
    expect(
      (await owner.agent.post(`/v1/branches/${mainId}/archive`)).status
    ).toBe(409)
    expect(
      (await owner.agent.post(`/v1/branches/${blrId}/archive`)).status
    ).toBe(409)

    const empty = await owner.agent
      .post("/v1/branches")
      .send({ name: "Empty", timezone: "UTC" })
    expect(
      (await owner.agent.post(`/v1/branches/${empty.body.data.id}/archive`))
        .status
    ).toBe(200)
    const list = await owner.agent.get("/v1/branches")
    expect(list.body.data.map((b: { name: string }) => b.name)).not.toContain(
      "Empty"
    )
  })
})

describe("ownership", () => {
  it("only the owner transfers it, and only to a Super Admin", async () => {
    const other = await inviteAndAccept(owner.agent, { role: "SUPER_ADMIN" })
    expect(
      (
        await other.agent
          .post("/v1/organization/transfer-ownership")
          .send({ membershipId: other.id })
      ).status
    ).toBe(403)
    expect(
      (
        await owner.agent
          .post("/v1/organization/transfer-ownership")
          .send({ membershipId: mainExec.id })
      ).status
    ).toBe(400)
    expect(
      (
        await owner.agent
          .post("/v1/organization/transfer-ownership")
          .send({ membershipId: other.id })
      ).status
    ).toBe(200)
    const now = (await other.agent.get("/v1/auth/session")).body.data
    expect(now.membership.isOwner).toBe(true)
  })
})
