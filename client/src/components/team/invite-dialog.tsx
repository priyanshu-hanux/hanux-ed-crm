import { useMemo, useState, type FormEvent } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import * as identityApi from "@/apis/identity-api";
import { useAuth } from "@/hooks/use-auth";
import type { Branch, BulkInviteResult, InviteInput, Team } from "@/types/identity";
import { ROLE_LABELS, type OrgRole } from "@/types/session";
import { grantableRoles } from "./people-rules";
import { useIdentityAction } from "./use-identity";

const NO_TEAM = "none";

/** Accepts "Executive", "executive", "EXECUTIVE", "super admin"... */
function parseRole(value: string): OrgRole | undefined {
    const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    return (Object.keys(ROLE_LABELS) as OrgRole[]).find((role) => role === key);
}

export function InviteDialog({
    open,
    onOpenChange,
    branches,
    teams,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branches: Branch[];
    teams: Team[];
}) {
    const { activeAssignment, session } = useAuth();
    const roles = grantableRoles(activeAssignment).map((g) => g.role);
    const isSuperAdmin = activeAssignment?.role === "SUPER_ADMIN";
    const isManager = activeAssignment?.role === "MANAGER";

    // Teams this role can invite into.
    const myTeams = useMemo(
        () =>
            teams.filter((team) =>
                isSuperAdmin
                    ? true
                    : isManager
                      ? team.manager?.id === session?.membership.id
                      : team.homeBranch.id === activeAssignment?.branch?.id
            ),
        [teams, isSuperAdmin, isManager, session, activeAssignment]
    );

    const [email, setEmail] = useState("");
    const [role, setRole] = useState<OrgRole>(roles.at(-1) ?? "EXECUTIVE");
    const [branchId, setBranchId] = useState(activeAssignment?.branch?.id ?? branches[0]?.id ?? "");
    const [teamId, setTeamId] = useState(isManager && myTeams.length === 1 ? myTeams[0].id : NO_TEAM);
    const [csv, setCsv] = useState("");
    const [bulkResult, setBulkResult] = useState<BulkInviteResult | null>(null);

    const invite = useIdentityAction(identityApi.createInvite, (i) => `Invitation sent to ${i.email}`);
    const bulk = useIdentityAction(identityApi.bulkInvite, (r) => `${r.sent} of ${r.sent + r.failed} invitations sent`);

    // Super Admins pick any branch; Admins and Managers invite into their own.
    const showBranch = isSuperAdmin && branches.length > 1;
    const teamOptions = myTeams.filter((team) => role !== "SUPER_ADMIN" && (!showBranch || team.homeBranch.id === branchId));

    const reset = () => {
        setEmail("");
        setCsv("");
        setBulkResult(null);
    };

    const submitOne = (event: FormEvent) => {
        event.preventDefault();
        const input: InviteInput = {
            email: email.trim(),
            role,
            branchId: isManager ? null : branchId,
            teamId: teamId === NO_TEAM ? null : teamId,
        };
        invite.mutate([input], {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    const submitCsv = () => {
        const { data } = Papa.parse<Record<string, string>>(csv.trim(), {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim().toLowerCase(),
        });
        const findBranch = (name?: string) =>
            branches.find((b) => [b.name, b.code].some((v) => v?.toLowerCase() === name?.trim().toLowerCase()));
        const rows: InviteInput[] = data.map((row) => ({
            email: (row.email ?? "").trim(),
            role: parseRole(row.role ?? "") ?? ("" as OrgRole),
            branchId: isManager ? null : (findBranch(row.branch)?.id ?? (row.branch ? "unknown" : branchId)),
            teamId: myTeams.find((t) => t.name.toLowerCase() === row.team?.trim().toLowerCase())?.id ?? null,
        }));
        bulk.mutate([rows], { onSuccess: setBulkResult });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) reset();
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Invite people</DialogTitle>
                    <DialogDescription>They'll get an email with a link to join. Links expire after 7 days.</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="one">
                    <TabsList>
                        <TabsTrigger value="one">One person</TabsTrigger>
                        <TabsTrigger value="csv">Several (CSV)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="one">
                        <form id="invite-one" onSubmit={submitOne} className="grid gap-4 pt-2">
                            <div className="grid gap-1.5">
                                <Label htmlFor="invite-email">Email</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    required
                                    autoFocus
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label>Role</Label>
                                    <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r} value={r}>
                                                    {ROLE_LABELS[r]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {showBranch && (
                                    <div className="grid gap-1.5">
                                        <Label>{role === "SUPER_ADMIN" ? "Home branch" : "Branch"}</Label>
                                        <Select value={branchId} onValueChange={setBranchId}>
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
                            </div>

                            {teamOptions.length > 0 && (
                                <div className="grid gap-1.5">
                                    <Label>Team</Label>
                                    <Select value={teamId} onValueChange={setTeamId}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {!isManager && <SelectItem value={NO_TEAM}>No team</SelectItem>}
                                            {teamOptions.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </form>
                        <DialogFooter className="mt-4">
                            <Button type="submit" form="invite-one" disabled={invite.isPending}>
                                {invite.isPending ? "Sending…" : "Send invitation"}
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="csv">
                        <div className="grid gap-3 pt-2">
                            <p className="text-sm text-muted-foreground">
                                Paste rows with the columns <code>email</code>, <code>role</code>
                                {!isManager && (
                                    <>
                                        , <code>branch</code>
                                    </>
                                )}{" "}
                                and optionally <code>team</code>. Up to 200 rows.
                            </p>
                            <Textarea
                                rows={7}
                                className="font-mono text-xs"
                                placeholder={"email,role,branch,team\npriya@acme.com,Executive,Main,North Sales"}
                                value={csv}
                                onChange={(e) => setCsv(e.target.value)}
                            />
                            <Input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setCsv(await file.text());
                                }}
                            />
                            {bulkResult && (
                                <div className="max-h-40 overflow-auto rounded-md border p-2 text-xs">
                                    <p className="mb-1 font-medium">
                                        {bulkResult.sent} sent, {bulkResult.failed} failed
                                    </p>
                                    {bulkResult.results
                                        .filter((r) => !r.ok)
                                        .map((r) => (
                                            <p key={r.row} className="text-destructive">
                                                Row {r.row} {r.email && `(${r.email})`}: {r.error}
                                            </p>
                                        ))}
                                </div>
                            )}
                        </div>
                        <DialogFooter className="mt-4">
                            <Button onClick={submitCsv} disabled={!csv.trim() || bulk.isPending}>
                                {bulk.isPending ? "Sending…" : "Send invitations"}
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
