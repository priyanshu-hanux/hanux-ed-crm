import { type Request, Router } from "express"
import { audit } from "@/modules/identity/audit/audit.service.js"
import { z } from "zod"
import { authenticate, getAuth } from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import { requirePermission } from "@/modules/identity/permissions/access.js"
import {
  createInvite,
  inviteInputSchema,
  listInvites,
  resendInvite,
  revokeInvite,
  type InviteInput,
} from "@/modules/identity/invites/invites.service.js"
import { idParam } from "@/modules/identity/shared.js"
import { sendSuccess } from "@/utils/api-response.js"
import { HttpError } from "@/utils/http-error.js"

/** Rows are validated one by one, so one bad row doesn't fail the rest. */
const bulkSchema = z.object({ invites: z.array(z.unknown()).min(1).max(200) })

/** Audit entry about an invite, visible to the invite branch's Admins. */
function inviteAudit(
  req: Request,
  action: string,
  invite: { id: string; email: string; role: string; branch: { id: string } }
) {
  return audit(req, {
    action,
    branchId: invite.branch.id,
    targetType: "invite",
    targetId: invite.id,
    metadata: { email: invite.email, role: invite.role },
  })
}

export const invitesRouter = Router()
invitesRouter.use(authenticate, requirePermission("members:invite"))

invitesRouter.get(
  "/",
  validate({ query: z.object({ all: z.stringbool().default(false) }) }),
  async (req, res) => {
    const { all } = req.query as unknown as { all: boolean }
    sendSuccess(res, await listInvites(getAuth(req), all))
  }
)

invitesRouter.post(
  "/",
  validate({ body: inviteInputSchema }),
  async (req, res) => {
    const invite = await createInvite(getAuth(req), req.body as InviteInput)
    await inviteAudit(req, "invite.sent", invite)
    sendSuccess(res, invite, { status: 201, message: "Invitation sent" })
  }
)

/** e.g. rows from a CSV upload. Reports the outcome of each row. */
invitesRouter.post(
  "/bulk",
  validate({ body: bulkSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    const rows = (req.body as z.infer<typeof bulkSchema>).invites
    const results = []
    for (const [index, row] of rows.entries()) {
      const parsed = inviteInputSchema.safeParse(row)
      const email =
        typeof row === "object" && row && "email" in row
          ? String(row.email)
          : ""
      if (!parsed.success) {
        results.push({
          row: index + 1,
          email,
          ok: false,
          error: z.prettifyError(parsed.error),
        })
        continue
      }
      try {
        const invite = await createInvite(auth, parsed.data)
        await inviteAudit(req, "invite.sent", invite)
        results.push({ row: index + 1, email: invite.email, ok: true, invite })
      } catch (err) {
        if (!(err instanceof HttpError)) throw err
        results.push({ row: index + 1, email, ok: false, error: err.message })
      }
    }
    const sent = results.filter((r) => r.ok).length
    sendSuccess(
      res,
      { sent, failed: results.length - sent, results },
      { message: `${sent} of ${results.length} invitations sent` }
    )
  }
)

invitesRouter.post(
  "/:id/resend",
  validate({ params: idParam }),
  async (req, res) => {
    const invite = await resendInvite(getAuth(req), req.params.id as string)
    await inviteAudit(req, "invite.resent", invite)
    sendSuccess(res, invite, { message: "Invitation sent again" })
  }
)

invitesRouter.delete(
  "/:id",
  validate({ params: idParam }),
  async (req, res) => {
    const revoked = await revokeInvite(getAuth(req), req.params.id as string)
    await inviteAudit(req, "invite.revoked", revoked)
    sendSuccess(res, null, { message: "Invitation revoked" })
  }
)
