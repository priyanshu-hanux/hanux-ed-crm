import type { Request } from "express"
import { logger } from "@/lib/logger.js"
import { prisma } from "@/lib/prisma.js"
import type { Prisma } from "@/generated/prisma/client.js"

export interface AuditEvent {
  /** e.g. "auth.login", "member.role_assigned" */
  action: string
  /** Defaults to the signed-in user's org. */
  orgId?: string | null
  /** The branch the event concerns, so that branch's Admins can see it. */
  branchId?: string | null
  /** Defaults to the signed-in user. */
  actorId?: string | null
  targetType?:
    | "user"
    | "member"
    | "invite"
    | "team"
    | "branch"
    | "organization"
    | "session"
  targetId?: string | null
  metadata?: Prisma.InputJsonObject
}

/**
 * Records an event. Never throws: a failed audit write is logged, not shown
 * to the user.
 */
export async function audit(req: Request, event: AuditEvent): Promise<void> {
  try {
    const actorId = event.actorId ?? req.auth?.userId ?? null
    const actor = actorId
      ? await prisma.user.findUnique({
          where: { id: actorId },
          select: {
            name: true,
            // For events without a signed-in user (e.g. password reset), file
            // the entry under the actor's org and home branch.
            memberships: {
              orderBy: { joinedAt: "asc" },
              take: 1,
              select: { orgId: true, homeBranchId: true },
            },
          },
        })
      : null
    const home = actor?.memberships[0]
    const orgId = event.orgId ?? req.auth?.orgId ?? home?.orgId ?? null
    await prisma.auditLog.create({
      data: {
        action: event.action,
        orgId,
        branchId:
          event.branchId ??
          (!req.auth && home?.orgId === orgId ? home?.homeBranchId : null) ??
          null,
        actorId: actor ? actorId : null,
        actorName: actor?.name ?? null,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        metadata: event.metadata,
        ip: req.ip ?? null,
        userAgent: req.get("user-agent")?.slice(0, 512) ?? null,
      },
    })
  } catch (err) {
    logger.error({ err, action: event.action }, "Writing the audit log failed")
  }
}
