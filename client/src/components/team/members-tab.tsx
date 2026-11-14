import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { LogOut, ShieldCheck, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { customColumn, DataTable, textColumn, type ColumnDef, type DataTableAction } from "@/components/table";
import * as identityApi from "@/apis/identity-api";
import { useAuth } from "@/hooks/use-auth";
import type { Branch, Member, Team } from "@/types/identity";
import { canManageMember, roleLabel } from "./people-rules";
import { InviteDialog } from "./invite-dialog";
import { RolesDialog } from "./roles-dialog";
import { useIdentityAction, useMembers } from "./use-identity";

export function MembersTab({ branches, teams }: { branches: Branch[]; teams: Team[] }) {
    const { can, activeAssignment, session } = useAuth();
    const members = useMembers();
    const [inviting, setInviting] = useState(false);
    const [rolesFor, setRolesFor] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<{ member: Member; kind: "deactivate" | "signout" } | null>(null);

    const deactivate = useIdentityAction(identityApi.deactivateMember, (m) => `${m.name} was deactivated`);
    const reactivate = useIdentityAction(identityApi.reactivateMember, (m) => `${m.name} was reactivated`);
    const signOut = useIdentityAction(identityApi.revokeMemberSessions, "Signed out everywhere");

    const myId = session?.membership.id;
    const manageable = (m: Member) => can("members:manage") && canManageMember(activeAssignment, myId, m);
    const multiBranch = branches.length > 1;

    const columns = useMemo<ColumnDef<Member>[]>(
        () => [
            customColumn<Member>({
                id: "member",
                title: "Member",
                icon: Users,
                size: 280,
                hideable: false,
                value: (m) => `${m.name} ${m.email}`,
                sortFn: (a, b) => a.original.name.localeCompare(b.original.name),
                render: (m) => (
                    <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar className="size-8">
                            {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
                            <AvatarFallback>{m.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate text-[13px] font-medium">
                                {m.name}
                                {m.isOwner && <Badge variant="outline">Owner</Badge>}
                                {m.id === myId && <span className="text-xs text-muted-foreground">(you)</span>}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                        </div>
                    </div>
                ),
            }),
            customColumn<Member>({
                id: "roles",
                title: "Roles",
                icon: ShieldCheck,
                size: 240,
                value: (m) => m.roles.map((r) => roleLabel(r.role, r.branch, branches.length)),
                filter: { type: "select", multiple: true },
                render: (m) => (
                    <div className="flex flex-wrap gap-1">
                        {m.roles.map((r) => (
                            <Badge key={r.id} variant="secondary">
                                {roleLabel(r.role, r.branch, branches.length)}
                            </Badge>
                        ))}
                    </div>
                ),
            }),
            // Only once there's more than one branch (a column of "Main" says nothing).
            ...(multiBranch
                ? [
                      textColumn<Member>({
                          id: "branch",
                          title: "Home branch",
                          value: (m) => m.homeBranch.name,
                          filter: { type: "select" },
                      }),
                  ]
                : []),
            textColumn<Member>({
                id: "team",
                title: "Team",
                value: (m) => m.team?.name,
                filter: { type: "select" },
            }),
            textColumn<Member>({
                id: "status",
                title: "Status",
                value: (m) => (m.status === "ACTIVE" ? "Active" : "Deactivated"),
                filter: { type: "select" },
                render: (value) => <Badge variant={value === "Active" ? "outline" : "destructive"}>{value}</Badge>,
            }),
            customColumn<Member>({
                id: "lastLogin",
                title: "Last sign-in",
                value: (m) => m.lastLoginAt ?? "",
                render: (m) => (
                    <span className="text-[13px] text-muted-foreground">
                        {m.lastLoginAt ? formatDistanceToNow(new Date(m.lastLoginAt), { addSuffix: true }) : "Never"}
                    </span>
                ),
            }),
        ],
        [branches.length, multiBranch, myId]
    );

    const actions: DataTableAction<Member>[] = [
        {
            label: "Manage roles",
            icon: ShieldCheck,
            onClick: (m) => setRolesFor(m.id),
            show: (m) => m.status === "ACTIVE" && (manageable(m) || (m.id === myId && can("members:manage"))),
        },
        {
            label: "Sign out everywhere",
            icon: LogOut,
            onClick: (member) => setConfirm({ member, kind: "signout" }),
            show: (m) => m.status === "ACTIVE" && manageable(m),
        },
        {
            label: "Reactivate",
            icon: UserCheck,
            onClick: (m) => reactivate.mutate([m.id]),
            show: (m) => m.status === "DEACTIVATED" && manageable(m),
        },
        {
            label: "Deactivate",
            icon: UserX,
            variant: "destructive",
            onClick: (member) => setConfirm({ member, kind: "deactivate" }),
            show: (m) => m.status === "ACTIVE" && !m.isOwner && manageable(m),
        },
    ];

    const rolesMember = members.data?.find((m) => m.id === rolesFor) ?? null;

    return (
        <>
            <DataTable
                columns={columns}
                data={members.data ?? []}
                isLoading={members.isLoading}
                error={members.error}
                onRefresh={() => void members.refetch()}
                isRefreshing={members.isFetching}
                itemName="member"
                searchColumns={["member"]}
                searchPlaceholder="Search by name or email"
                persistKey="team-members"
                actions={actions}
                toolbarActions={
                    can("members:invite")
                        ? [{ id: "invite", label: "Invite people", icon: UserPlus, placement: "toolbar", onSelect: () => setInviting(true) }]
                        : []
                }
                cardFields={{ title: "name", subtitle: "email" }}
            />

            {inviting && <InviteDialog open={inviting} onOpenChange={setInviting} branches={branches} teams={teams} />}
            {rolesMember && (
                <RolesDialog member={rolesMember} branches={branches} onOpenChange={(open) => !open && setRolesFor(null)} />
            )}

            <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm?.kind === "deactivate"
                                ? `Deactivate ${confirm.member.name}?`
                                : `Sign ${confirm?.member.name} out everywhere?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm?.kind === "deactivate"
                                ? "They lose access immediately and are signed out on every device. You can reactivate them later."
                                : "Every device they're signed in on is signed out on its next request. They can sign in again."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant={confirm?.kind === "deactivate" ? "destructive" : "default"}
                            onClick={() => {
                                if (!confirm) return;
                                (confirm.kind === "deactivate" ? deactivate : signOut).mutate([confirm.member.id]);
                                setConfirm(null);
                            }}
                        >
                            {confirm?.kind === "deactivate" ? "Deactivate" : "Sign out"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
