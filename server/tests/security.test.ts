import cookieParser from "cookie-parser"
import express from "express"
import request from "supertest"
import { afterAll, describe, expect, it } from "vitest"
import { testOutbox } from "@/lib/mailer.js"
import { prisma } from "@/lib/prisma.js"
import { rateLimiter } from "@/lib/rate-limit.js"
import { errorHandler } from "@/middleware/error-handler.js"
import { MAX_FAILED_LOGINS } from "@/modules/identity/auth/auth.service.js"
import {
  app,
  cleanup,
  inviteAndAccept,
  PASSWORD,
  signupAgent,
  uniqueEmail,
} from "./helpers.js"

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

/** The latest email to an address, waiting briefly for background sends. */
async function lastEmailTo(email: string) {
  for (let i = 0; i < 20; i++) {
    const mail = testOutbox.findLast((m) => m.to === email)
    if (mail) return mail
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error(`no email to ${email}`)
}

const codeIn = (text: string) => text.match(/\b(\d{6})\b/)?.[1] ?? ""
const resetTokenIn = (text: string) =>
  text.match(/\/auth\/reset-password\/([A-Za-z0-9_-]+)/)?.[1] ?? ""

describe("email verification", () => {
  it("sends a code at sign-up; inviting needs a verified email", async () => {
    const { agent, email, session } = await signupAgent({}, { verified: false })
    expect(session.user.emailVerifiedAt).toBeNull()
    const code = codeIn((await lastEmailTo(email)).text)
    expect(code).toHaveLength(6)

    const blocked = await agent.post("/v1/invites").send({
      email: uniqueEmail(),
      role: "EXECUTIVE",
      branchId: session.branches[0].id,
    })
    expect(blocked.status).toBe(403)
    expect(blocked.body.code).toBe("EMAIL_NOT_VERIFIED")

    const wrong = await agent
      .post("/v1/auth/email/verify")
      .send({ code: code === "000000" ? "111111" : "000000" })
    expect(wrong.status).toBe(400)
    expect(wrong.body.code).toBe("CODE_INVALID")
    expect(wrong.body.message).toMatch(/4 tries left/)

    expect(
      (await agent.post("/v1/auth/email/verify").send({ code })).status
    ).toBe(200)
    const after = (await agent.get("/v1/auth/session")).body.data
    expect(after.user.emailVerifiedAt).not.toBeNull()

    const allowed = await agent.post("/v1/invites").send({
      email: uniqueEmail(),
      role: "EXECUTIVE",
      branchId: session.branches[0].id,
    })
    expect(allowed.status).toBe(201)

    expect((await agent.post("/v1/auth/email/send-code")).status).toBe(409)
  })

  it("a code stops working after 5 wrong attempts", async () => {
    const { agent, email } = await signupAgent({}, { verified: false })
    const code = codeIn((await lastEmailTo(email)).text)
    const wrong = code === "000000" ? "111111" : "000000"
    for (let i = 0; i < 5; i++) {
      await agent.post("/v1/auth/email/verify").send({ code: wrong })
    }
    const res = await agent.post("/v1/auth/email/verify").send({ code })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/Request a new one/)
  })
})

describe("password reset", () => {
  it("answers the same for unknown emails", async () => {
    const res = await request(app)
      .post("/v1/auth/password/forgot")
      .send({ email: uniqueEmail() })
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/If an account exists/)
  })

  it("resets once, signs out everywhere, and the old password stops working", async () => {
    const { agent, email } = await signupAgent()
    await request(app)
      .post("/v1/auth/password/forgot")
      .send({ email })
      .expect(200)
    const token = resetTokenIn((await lastEmailTo(email)).text)
    expect(token).not.toBe("")

    const weak = await request(app)
      .post("/v1/auth/password/reset")
      .send({ token, password: "weak" })
    expect(weak.status).toBe(400)

    const newPassword = "N3wPassword!"
    expect(
      (
        await request(app)
          .post("/v1/auth/password/reset")
          .send({ token, password: newPassword })
      ).status
    ).toBe(200)

    // The existing session was revoked.
    expect((await agent.get("/v1/me")).body.code).toBe("SESSION_REVOKED")

    const old = await request(app)
      .post("/v1/auth/login")
      .send({ email, password: PASSWORD })
    expect(old.body.code).toBe("INVALID_CREDENTIALS")
    const fresh = await request(app)
      .post("/v1/auth/login")
      .send({ email, password: newPassword })
    expect(fresh.status).toBe(200)

    const reused = await request(app)
      .post("/v1/auth/password/reset")
      .send({ token, password: "An0therPassword" })
    expect(reused.body.code).toBe("TOKEN_INVALID")
  })
})

describe("sign-in lockout", () => {
  it(`locks after ${MAX_FAILED_LOGINS} wrong passwords, even for the right one; a reset unlocks`, async () => {
    const { email } = await signupAgent()
    const attempt = (password: string) =>
      request(app).post("/v1/auth/login").send({ email, password })

    for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
      expect((await attempt("Wr0ngPassword")).body.code).toBe(
        "INVALID_CREDENTIALS"
      )
    }
    const locking = await attempt("Wr0ngPassword")
    expect(locking.status).toBe(429)
    expect(locking.body.code).toBe("ACCOUNT_LOCKED")
    expect((await attempt(PASSWORD)).body.code).toBe("ACCOUNT_LOCKED")

    await request(app).post("/v1/auth/password/forgot").send({ email })
    const token = resetTokenIn((await lastEmailTo(email)).text)
    await request(app)
      .post("/v1/auth/password/reset")
      .send({ token, password: "Unl0ckedPassword" })
      .expect(200)
    expect((await attempt("Unl0ckedPassword")).status).toBe(200)
  })
})

describe("account", () => {
  it("changing the password signs out other devices and keeps this one", async () => {
    const { agent, email } = await signupAgent()
    const laptop = request.agent(app)
    await laptop
      .post("/v1/auth/login")
      .send({ email, password: PASSWORD })
      .expect(200)

    const wrong = await agent
      .post("/v1/me/password")
      .send({ currentPassword: "Wr0ngPassword", newPassword: "N3wPassword1" })
    expect(wrong.body.code).toBe("INVALID_PASSWORD")

    const ok = await agent
      .post("/v1/me/password")
      .send({ currentPassword: PASSWORD, newPassword: "N3wPassword1" })
    expect(ok.status).toBe(200)
    expect(String(ok.headers["set-cookie"])).toMatch(/session=/)

    expect((await agent.get("/v1/me")).status).toBe(200)
    expect((await laptop.get("/v1/me")).body.code).toBe("SESSION_REVOKED")
  })

  it("lists sessions and signs out other devices", async () => {
    const { agent, email } = await signupAgent()
    const phone = request.agent(app)
    await phone
      .post("/v1/auth/login")
      .send({ email, password: PASSWORD })
      .expect(200)

    const list = (await agent.get("/v1/me/sessions")).body.data
    expect(list).toHaveLength(2)
    const current = list.find((s: { current: boolean }) => s.current)
    const other = list.find((s: { current: boolean }) => !s.current)

    expect((await agent.delete(`/v1/me/sessions/${current.id}`)).status).toBe(
      400
    )
    expect((await agent.delete(`/v1/me/sessions/${other.id}`)).status).toBe(200)
    expect((await phone.get("/v1/me")).status).toBe(401)
    expect((await agent.get("/v1/me/sessions")).body.data).toHaveLength(1)
  })

  it("updates the profile name", async () => {
    const { agent } = await signupAgent()
    const res = await agent.patch("/v1/me").send({ name: "Renamed Person" })
    expect(res.body.data.name).toBe("Renamed Person")
  })
})

describe("audit log", () => {
  it("records actions; Admins see their branch, Executives nothing", async () => {
    const { agent: owner, session } = await signupAgent()
    const main = session.branches[0].id
    const blr = (
      await owner
        .post("/v1/branches")
        .send({ name: "Bangalore", timezone: "Asia/Kolkata" })
    ).body.data.id

    const blrAdmin = await inviteAndAccept(owner, {
      role: "ADMIN",
      branchId: blr,
    })
    const blrExec = await inviteAndAccept(owner, {
      role: "EXECUTIVE",
      branchId: blr,
    })
    const mainExec = await inviteAndAccept(owner, {
      role: "EXECUTIVE",
      branchId: main,
    })
    await owner.post(`/v1/members/${blrExec.id}/deactivate`).expect(200)
    await owner.post(`/v1/members/${mainExec.id}/deactivate`).expect(200)

    const all = (await owner.get("/v1/audit-log?limit=100")).body.data
    const actions = all.map((e: { action: string }) => e.action)
    expect(actions).toEqual(
      expect.arrayContaining([
        "auth.signup",
        "branch.created",
        "invite.sent",
        "invite.accepted",
        "member.deactivated",
      ])
    )
    const deactivated = all.find(
      (e: { action: string; targetId: string }) =>
        e.action === "member.deactivated" && e.targetId === blrExec.id
    )
    expect(deactivated.actorName).toBe("Test Owner")

    // The Bangalore Admin sees Bangalore's entries only.
    const branchView = (await blrAdmin.agent.get("/v1/audit-log?limit=100"))
      .body.data
    const targets = branchView.map((e: { targetId: string }) => e.targetId)
    expect(targets).toContain(blrExec.id)
    expect(targets).not.toContain(mainExec.id)

    expect((await mainExec.agent.get("/v1/audit-log")).status).toBe(401) // deactivated
  })

  it("records failed sign-ins", async () => {
    const { agent, email } = await signupAgent()
    await request(app)
      .post("/v1/auth/login")
      .send({ email, password: "Wr0ngPassword" })
    const entries = (await agent.get("/v1/audit-log?action=auth.login_failed"))
      .body.data
    expect(entries[0]).toMatchObject({
      action: "auth.login_failed",
      metadata: { failures: 1 },
    })
  })
})

describe("rate limiting", () => {
  it("refuses requests over the limit with RATE_LIMITED", async () => {
    const limited = express()
    limited.use(express.json(), cookieParser())
    limited.post(
      "/try",
      rateLimiter({
        windowMs: 60_000,
        limit: 2,
        by: "email",
        enabledInTests: true,
      }),
      (_req, res) => {
        res.json({ ok: true })
      }
    )
    limited.use(errorHandler)

    const send = (email: string) =>
      request(limited).post("/try").send({ email })
    expect((await send("a@example.test")).status).toBe(200)
    expect((await send("A@example.test")).status).toBe(200) // same email, any case
    const third = await send("a@example.test")
    expect(third.status).toBe(429)
    expect(third.body.code).toBe("RATE_LIMITED")
    expect((await send("b@example.test")).status).toBe(200) // counted per email
  })
})
