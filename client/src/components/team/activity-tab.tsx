import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableStateView } from "@/components/table";
import * as accountApi from "@/apis/account-api";
import type { AuditEntry } from "@/apis/account-api";
import type { Branch } from "@/types/identity";
import { ROLE_LABELS, type OrgRole } from "@/types/session";

const FILTERS = [
    { value: "all", label: "All activity" },
    { value: "auth.", label: "Sign-ins and passwords" },
    { value: "member.", label: "Members and roles" },
    { value: "invite.", label: "Invitations" },
    { value: "team.", label: "Teams" },
    { value: "branch.", label: "Branches" },
    { value: "org.", label: "Organization" },
];

/** Plain-language description of an audit entry. */
function describe(entry: AuditEntry, branchName: (id: unknown) => string): string {
    const m = entry.metadata ?? {};
    const name = typeof m.name === "string" ? m.name : "someone";
    const role = (r: unknown, b: unknown) =>
        `${ROLE_LABELS[r as OrgRole] ?? String(r)}${b ? ` · ${branchName(b)}` : ""}`;
    switch (entry.action) {
        case "auth.signup": return "created the organization";
        case "auth.login": return "signed in";
        case "auth.logout": return "signed out";
        case "auth.login_failed": return `failed to sign in (attempt ${String(m.failures ?? "?")})`;
        case "auth.locked": return "was locked out after too many failed sign-ins";
        case "auth.login_blocked": return "tried to sign in while locked out";
        case "auth.email_verified": return "verified their email";
        case "auth.password_changed": return "changed their password";
        case "auth.password_reset_requested": return "asked for a password reset link";
        case "auth.password_reset": return "reset their password";
        case "session.revoked": return "signed out one of their devices";
        case "session.revoked_others": return "signed out of their other devices";
        case "member.role_assigned": return `gave ${name} the role ${role(m.role, m.branchId)}`;
        case "member.role_removed": return `removed ${role(m.role, m.branchId)} from ${name}`;
        case "member.deactivated": return `deactivated ${name}`;
        case "member.reactivated": return `reactivated ${name}`;
        case "member.sessions_revoked": return `signed ${name} out everywhere`;
        case "member.home_branch_changed": return `moved ${name} to ${branchName(m.to)}`;
        case "member.team_joined": return `added ${name} to the ${String(m.team)} team`;
        case "member.team_left": return `removed ${name} from the ${String(m.team)} team`;
        case "invite.sent": return `invited ${String(m.email)} as ${role(m.role, null)}`;
        case "invite.resent": return `re-sent the invitation to ${String(m.email)}`;
        case "invite.revoked": return `revoked the invitation to ${String(m.email)}`;
        case "invite.accepted": return "joined from an invitation";
        case "team.created": return `created the ${name} team`;
        case "team.updated": return "updated a team";
        case "team.deleted": return `deleted the ${name} team`;
        case "team.members_changed": return `changed the members of ${name}`;
        case "branch.created": return `created the ${name} branch`;
        case "branch.updated": return "updated a branch";
        case "branch.archived": return `archived the ${name} branch`;
        case "branch.restored": return `restored the ${name} branch`;
        case "org.updated": return "updated organization settings";
        case "org.ownership_transferred": return "transferred ownership of the organization";
        default: return entry.action;
    }
}

/** Audit log: the whole org for Super Admins, their branch for Admins. */
export function ActivityTab({ branches }: { branches: Branch[] }) {
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const log = useQuery({
        queryKey: ["audit-log", filter, page],
        queryFn: () => accountApi.listAuditLog({ page, action: filter === "all" ? undefined : filter }),
    });
    const branchName = (id: unknown) => branches.find((b) => b.id === id)?.name ?? "another branch";

    return (
        <div className="space-y-3">
            <Select
                value={filter}
                onValueChange={(v) => {
                    setFilter(v);
                    setPage(1);
                }}
            >
                <SelectTrigger className="w-60">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {FILTERS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                            {f.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {log.isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading activity…</p>
            ) : !log.data?.data.length ? (
                <TableStateView icon={History} title="No activity yet" description="Changes to people, teams and sign-ins appear here." />
            ) : (
                <>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-44">When</TableHead>
                                    <TableHead>What happened</TableHead>
                                    <TableHead className="w-36">IP address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {log.data.data.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(entry.createdAt), "d MMM yyyy, HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{entry.actorName ?? "Someone"}</span>{" "}
                                            {describe(entry, branchName)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{entry.ip ?? "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                        Page {log.data.pagination.page} of {log.data.pagination.totalPages}
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= log.data.pagination.totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
