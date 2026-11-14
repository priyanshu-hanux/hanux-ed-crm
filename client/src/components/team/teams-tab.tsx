import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableStateView } from "@/components/table";
import * as identityApi from "@/apis/identity-api";
import { useAuth } from "@/hooks/use-auth";
import type { Branch, Member, Team } from "@/types/identity";
import { useIdentityAction, useMembers } from "./use-identity";

const NO_MANAGER = "none";

/** Teams are managed by their home branch's Admin, or a Super Admin. */
function useCanManageTeam() {
    const { can, activeAssignment } = useAuth();
    return (homeBranchId: string) =>
        can("teams:manage") &&
        (activeAssignment?.role === "SUPER_ADMIN" || activeAssignment?.branch?.id === homeBranchId);
}

/** Active members with the Manager role in a branch: who can manage its teams. */
function managersIn(members: Member[], branchId: string) {
    return members.filter(
        (m) => m.status === "ACTIVE" && m.roles.some((r) => r.role === "MANAGER" && r.branch?.id === branchId)
    );
}

export function TeamsTab({ teams, branches, loading }: { teams: Team[]; branches: Branch[]; loading: boolean }) {
    const { can, activeAssignment } = useAuth();
    const canManage = useCanManageTeam();
    const [editing, setEditing] = useState<Team | "new" | null>(null);
    const [membersOf, setMembersOf] = useState<string | null>(null);
    const remove = useIdentityAction(identityApi.deleteTeam, "Team deleted");

    // Branches this role can create teams in.
    const creatableBranches = branches.filter((b) => canManage(b.id));
    const multiBranch = branches.length > 1;

    if (loading) return <p className="p-4 text-sm text-muted-foreground">Loading teams…</p>;

    return (
        <div className="space-y-4">
            {can("teams:manage") && creatableBranches.length > 0 && (
                <div className="flex justify-end">
                    <Button onClick={() => setEditing("new")}>
                        <Plus /> New team
                    </Button>
                </div>
            )}

            {teams.length === 0 ? (
                <TableStateView
                    icon={UsersRound}
                    title="No teams yet"
                    description={
                        activeAssignment?.role === "EXECUTIVE"
                            ? "Teams your organization creates will appear here."
                            : "A team groups people under a manager. Members can come from any branch."
                    }
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {teams.map((team) => (
                        <Card key={team.id}>
                            <CardHeader className="flex flex-row items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <CardTitle className="truncate">{team.name}</CardTitle>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {team.manager ? `Managed by ${team.manager.name}` : "No manager"}
                                        {multiBranch && ` · ${team.homeBranch.name}`}
                                    </p>
                                </div>
                                {canManage(team.homeBranch.id) && (
                                    <div className="flex shrink-0">
                                        <Button variant="ghost" size="icon-sm" aria-label="Edit team" onClick={() => setEditing(team)}>
                                            <Pencil />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label="Delete team"
                                            className="text-destructive"
                                            onClick={() => remove.mutate([team.id])}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {team.members.length === 0 && (
                                        <span className="text-sm text-muted-foreground">No members yet</span>
                                    )}
                                    {team.members.map((m) => (
                                        <Badge key={m.id} variant="secondary" title={m.email}>
                                            {m.name}
                                            {multiBranch && m.homeBranch.id !== team.homeBranch.id && (
                                                <span className="text-muted-foreground"> · {m.homeBranch.name}</span>
                                            )}
                                        </Badge>
                                    ))}
                                </div>
                                {canManage(team.homeBranch.id) && (
                                    <Button variant="outline" size="sm" onClick={() => setMembersOf(team.id)}>
                                        Edit members
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {editing && (
                <TeamDialog
                    team={editing === "new" ? null : editing}
                    branches={creatableBranches}
                    onClose={() => setEditing(null)}
                />
            )}
            {membersOf && (
                <TeamMembersDialog team={teams.find((t) => t.id === membersOf)!} onClose={() => setMembersOf(null)} />
            )}
        </div>
    );
}

function TeamDialog({ team, branches, onClose }: { team: Team | null; branches: Branch[]; onClose: () => void }) {
    const members = useMembers();
    const [name, setName] = useState(team?.name ?? "");
    const [homeBranchId, setHomeBranchId] = useState(team?.homeBranch.id ?? branches[0]?.id ?? "");
    const [managerId, setManagerId] = useState(team?.manager?.id ?? NO_MANAGER);

    const create = useIdentityAction(identityApi.createTeam, (t) => `Team ${t.name} created`);
    const update = useIdentityAction(identityApi.updateTeam, "Team updated");
    const managers = managersIn(members.data ?? [], homeBranchId);
    const pending = create.isPending || update.isPending;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const manager = managerId === NO_MANAGER ? null : managerId;
        if (team) update.mutate([team.id, { name, managerId: manager }], { onSuccess: onClose });
        else create.mutate([{ name, homeBranchId, managerId: manager }], { onSuccess: onClose });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{team ? "Edit team" : "New team"}</DialogTitle>
                    <DialogDescription>The manager needs the Manager role in the team's branch.</DialogDescription>
                </DialogHeader>
                <form id="team-form" onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="team-name">Name</Label>
                        <Input id="team-name" required value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    {!team && branches.length > 1 && (
                        <div className="grid gap-1.5">
                            <Label>Home branch</Label>
                            <Select
                                value={homeBranchId}
                                onValueChange={(v) => {
                                    setHomeBranchId(v);
                                    setManagerId(NO_MANAGER);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="grid gap-1.5">
                        <Label>Manager</Label>
                        <Select value={managerId} onValueChange={setManagerId}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_MANAGER}>No manager</SelectItem>
                                {managers.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {managers.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No one has the Manager role in this branch yet. Give someone the role from Members.
                            </p>
                        )}
                    </div>
                </form>
                <DialogFooter>
                    <Button type="submit" form="team-form" disabled={pending || !name.trim()}>
                        {team ? "Save" : "Create team"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** Pick the team's members, from any branch. */
function TeamMembersDialog({ team, onClose }: { team: Team; onClose: () => void }) {
    const members = useMembers();
    const [selected, setSelected] = useState(() => new Set(team.members.map((m) => m.id)));
    const [search, setSearch] = useState("");
    const save = useIdentityAction(identityApi.setTeamMembers, "Team members updated");

    const candidates = (members.data ?? [])
        .filter((m) => m.status === "ACTIVE" && m.id !== team.manager?.id)
        .filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(search.toLowerCase()));

    const toggle = (id: string, on: boolean) =>
        setSelected((current) => {
            const next = new Set(current);
            if (on) next.add(id);
            else next.delete(id);
            return next;
        });

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Members of {team.name}</DialogTitle>
                    <DialogDescription>
                        People can come from any branch. Someone already in another team moves to this one.
                    </DialogDescription>
                </DialogHeader>
                <Input placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="max-h-72 space-y-1 overflow-auto">
                    {candidates.map((m) => (
                        <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted">
                            <Checkbox checked={selected.has(m.id)} onCheckedChange={(on) => toggle(m.id, on === true)} />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm">{m.name}</span>
                                <span className="block truncate text-xs text-muted-foreground">
                                    {m.homeBranch.name}
                                    {m.team && m.team.id !== team.id && ` · now in ${m.team.name}`}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
                <DialogFooter>
                    <Button disabled={save.isPending} onClick={() => save.mutate([team.id, [...selected]], { onSuccess: onClose })}>
                        Save members
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
