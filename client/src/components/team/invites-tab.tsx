import { formatDistanceToNow } from "date-fns";
import { MailPlus, RotateCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableStateView } from "@/components/table";
import * as identityApi from "@/apis/identity-api";
import type { Branch, InviteStatus } from "@/types/identity";
import { roleLabel } from "./people-rules";
import { useIdentityAction, useInvites } from "./use-identity";

const STATUS: Record<InviteStatus, { label: string; variant: "outline" | "secondary" | "destructive" }> = {
    PENDING: { label: "Pending", variant: "outline" },
    EXPIRED: { label: "Expired", variant: "destructive" },
    ACCEPTED: { label: "Accepted", variant: "secondary" },
    REVOKED: { label: "Revoked", variant: "secondary" },
};

/** Open invitations the active role can see: all (Super Admin), their branch (Admin) or their own (Manager). */
export function InvitesTab({ branches, onInvite }: { branches: Branch[]; onInvite: () => void }) {
    const invites = useInvites(true);
    const resend = useIdentityAction(identityApi.resendInvite, (i) => `Invitation sent again to ${i.email}`);
    const revoke = useIdentityAction(identityApi.revokeInvite, "Invitation revoked");

    if (invites.isLoading) return <p className="p-4 text-sm text-muted-foreground">Loading invitations…</p>;
    if (!invites.data?.length) {
        return (
            <TableStateView
                icon={MailPlus}
                title="No open invitations"
                description="People you invite appear here until they accept."
                actions={[{ label: "Invite people", onClick: onInvite, variant: "default" }]}
            />
        );
    }

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Invited by</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invites.data.map((invite) => {
                        const status = STATUS[invite.status];
                        return (
                            <TableRow key={invite.id}>
                                <TableCell className="font-medium">{invite.email}</TableCell>
                                <TableCell>
                                    {roleLabel(invite.role, invite.role === "SUPER_ADMIN" ? null : invite.branch, branches.length)}
                                </TableCell>
                                <TableCell>{invite.team?.name ?? "—"}</TableCell>
                                <TableCell>{invite.invitedBy?.name ?? "—"}</TableCell>
                                <TableCell>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                    {invite.status === "PENDING" && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={resend.isPending}
                                        onClick={() => resend.mutate([invite.id])}
                                    >
                                        <RotateCw /> Resend
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive"
                                        disabled={revoke.isPending}
                                        onClick={() => revoke.mutate([invite.id])}
                                    >
                                        <X /> Revoke
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
