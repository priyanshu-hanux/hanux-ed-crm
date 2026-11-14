import express from "express"
import cookieParser from "cookie-parser"
import request from "supertest"
import { afterAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/prisma.js"
import { authenticate } from "@/middleware/authenticate.js"
import { errorHandler } from "@/middleware/error-handler.js"
import {
  requirePermission,
  scopeWhere,
} from "@/modules/identity/permissions/access.js"
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  permissionsFor,
} from "@/modules/identity/permissions/catalog.js"
import type { AuthContext } from "@/modules/identity/sessions/auth-context.js"
import {
  addBranch,
  addMember,
  app,
  cleanup,
  cookieOf,
  signupAgent,
} from "./helpers.js"

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

describe("catalog", () => {
  it("only lists known permissions", () => {
    for (const map of Object.values(ROLE_PERMISSIONS)) {
      for (const permission of Object.keys(map)) {
        expect(PERMISSIONS).toContain(permission)
      }
    }
  })

  it("widens the leads scope from Executive to Super Admin", () => {
    expect(permissionsFor("EXECUTIVE")["leads:read"]).toBe("own")
    expect(permissionsFor("MANAGER")["leads:read"]).toBe("team")
    expect(permissionsFor("ADMIN")["leads:read"]).toBe("branch")
    expect(permissionsFor("SUPER_ADMIN")["leads:read"]).toBe("org")
  })

  it("keeps org and branch management for Super Admins", () => {
    for (const role of ["EXECUTIVE", "MANAGER", "ADMIN"] as const) {
      expect(permissionsFor(role)["org:manage"]).toBeUndefined()
      expect(permissionsFor(role)["branches:manage"]).toBeUndefined()
    }
    expect(permissionsFor("SUPER_ADMIN")["org:manage"]).toBe(true)
  })
})

describe("switch role", () => {
  it("returns the active role's permissions in the session", async () => {
    const { session } = await signupAgent()
    expect(session.permissions["leads:read"]).toBe("org")
    expect(session.permissions["org:manage"]).toBe(true)
  })

  it("switches to another role, rotates the token and changes permissions", async () => {
    const { agent, session } = await signupAgent()
    const admin = await prisma.roleAssignment.create({
      data: {
        membershipId: session.membership.id,
        role: "ADMIN",
        branchId: session.branches[0].id,
      },
    })
    const oldToken = cookieOf(agent)

    const res = await agent
      .post("/v1/auth/switch-role")
      .send({ assignmentId: admin.id })
    expect(res.status).toBe(200)
    expect(res.body.data.activeAssignmentId).toBe(admin.id)
    expect(res.body.data.permissions["leads:read"]).toBe("branch")
    expect(res.body.data.permissions["org:manage"]).toBeUndefined()

    // New token works; the old one doesn't.
    expect(cookieOf(agent)).not.toBe(oldToken)
    expect(
      (await agent.get("/v1/auth/session")).body.data.activeAssignmentId
    ).toBe(admin.id)
    const old = await request(app)
      .get("/v1/auth/session")
      .set("Cookie", `session=${oldToken}`)
    expect(old.status).toBe(401)
  })

  it("refuses a role that belongs to someone else", async () => {
    const a = await signupAgent()
    const b = await signupAgent()
    const res = await a.agent
      .post("/v1/auth/switch-role")
      .send({ assignmentId: b.session.assignments[0].id })
    expect(res.status).toBe(404)
  })

  it("validates the assignment id", async () => {
    const { agent } = await signupAgent()
    const res = await agent
      .post("/v1/auth/switch-role")
      .send({ assignmentId: "not-a-uuid" })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe("VALIDATION_ERROR")
  })
})

describe("requirePermission", () => {
  // A small app with one route that needs org:manage.
  const guarded = express()
  guarded.use(cookieParser())
  guarded.get(
    "/org-settings",
    authenticate,
    requirePermission("org:manage"),
    (_req, res) => {
      res.json({ success: true })
    }
  )
  guarded.use(errorHandler)

  it("allows Super Admin and refuses Admin", async () => {
    const { agent, session } = await signupAgent()
    const token = () => `session=${cookieOf(agent)}`

    const allowed = await request(guarded)
      .get("/org-settings")
      .set("Cookie", token())
    expect(allowed.status).toBe(200)

    const admin = await prisma.roleAssignment.create({
      data: {
        membershipId: session.membership.id,
        role: "ADMIN",
        branchId: session.branches[0].id,
      },
    })
    await agent.post("/v1/auth/switch-role").send({ assignmentId: admin.id })

    const refused = await request(guarded)
      .get("/org-settings")
      .set("Cookie", token())
    expect(refused.status).toBe(403)
    expect(refused.body.code).toBe("FORBIDDEN")
  })
})

describe("scopeWhere", () => {
  /** An auth context for a member acting in a given role. */
  function actingAs(
    member: { id: string; orgId: string },
    role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EXECUTIVE",
    branchId: string | null
  ): AuthContext {
    return {
      sessionId: "test",
      userId: "test",
      orgId: member.orgId,
      membershipId: member.id,
      isOwner: false,
      assignmentId: "test",
      role,
      branchId,
      isPlatformAdmin: false,
      authzVersion: 1,
      permissions: permissionsFor(role),
    }
  }

  it("filters by owner, team, branch or org", async () => {
    // New York manager with a team of one New York and one Bangalore executive.
    const { session } = await signupAgent()
    const orgId = session.organization.id
    const newYork = session.branches[0]
    const bangalore = await addBranch(orgId, "Bangalore")

    const manager = await addMember(orgId, newYork.id, [
      { role: "MANAGER", branchId: newYork.id },
    ])
    const nyExec = await addMember(orgId, newYork.id, [
      { role: "EXECUTIVE", branchId: newYork.id },
    ])
    const blrExec = await addMember(orgId, bangalore.id, [
      { role: "EXECUTIVE", branchId: bangalore.id },
    ])
    const outsider = await addMember(orgId, bangalore.id, [
      { role: "EXECUTIVE", branchId: bangalore.id },
    ])
    const team = await prisma.team.create({
      data: {
        orgId,
        homeBranchId: newYork.id,
        name: "Cross-region",
        managerId: manager.id,
      },
    })
    await prisma.membership.updateMany({
      where: { id: { in: [nyExec.id, blrExec.id] } },
      data: { teamId: team.id },
    })

    // Executive: only their own records.
    expect(
      await scopeWhere(
        actingAs(blrExec, "EXECUTIVE", bangalore.id),
        "leads:read"
      )
    ).toEqual({ orgId, ownerId: { in: [blrExec.id] } })

    // Manager: themselves and both team members, across branches.
    const teamScope = await scopeWhere(
      actingAs(manager, "MANAGER", newYork.id),
      "leads:read"
    )
    expect(teamScope).toMatchObject({ orgId })
    const ids = (teamScope as { ownerId: { in: string[] } }).ownerId.in
    expect(ids.sort()).toEqual([manager.id, nyExec.id, blrExec.id].sort())
    expect(ids).not.toContain(outsider.id)

    // Admin of Bangalore: that branch's records.
    const admin = await addMember(orgId, bangalore.id, [
      { role: "ADMIN", branchId: bangalore.id },
    ])
    expect(
      await scopeWhere(actingAs(admin, "ADMIN", bangalore.id), "leads:read")
    ).toEqual({ orgId, branchId: bangalore.id })

    // Super Admin: the whole org.
    expect(
      await scopeWhere(
        actingAs({ id: session.membership.id, orgId }, "SUPER_ADMIN", null),
        "leads:read"
      )
    ).toEqual({ orgId })

    // No grant: refused.
    await expect(
      scopeWhere(actingAs(nyExec, "EXECUTIVE", newYork.id), "leads:delete")
    ).rejects.toMatchObject({ status: 403 })
  })
})
