import { useMemo, useState, type FormEvent } from "react";
import { Archive, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as identityApi from "@/apis/identity-api";
import { useAuth } from "@/hooks/use-auth";
import type { Branch } from "@/types/identity";
import { useIdentityAction } from "./use-identity";

export function BranchesTab({ branches, loading }: { branches: Branch[]; loading: boolean }) {
    const { can, activeAssignment } = useAuth();
    const [editing, setEditing] = useState<Branch | "new" | null>(null);
    const archive = useIdentityAction(identityApi.archiveBranch, "Branch archived");

    const isSuperAdmin = activeAssignment?.role === "SUPER_ADMIN";
    // Super Admins edit any branch; Admins their own.
    const canEdit = (b: Branch) => can("branches:update") && (isSuperAdmin || activeAssignment?.branch?.id === b.id);

    if (loading) return <p className="p-4 text-sm text-muted-foreground">Loading branches…</p>;

    return (
        <div className="space-y-4">
            {can("branches:manage") && (
                <div className="flex justify-end">
                    <Button onClick={() => setEditing("new")}>
                        <Plus /> New branch
                    </Button>
                </div>
            )}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Branch</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Time zone</TableHead>
                            <TableHead className="text-right">Members</TableHead>
                            <TableHead className="text-right">Teams</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branches.map((b) => (
                            <TableRow key={b.id}>
                                <TableCell className="font-medium">
                                    {b.name} {b.isDefault && <Badge variant="outline">Default</Badge>}
                                </TableCell>
                                <TableCell>{b.code ?? "—"}</TableCell>
                                <TableCell>{b.timezone}</TableCell>
                                <TableCell className="text-right">{b.memberCount}</TableCell>
                                <TableCell className="text-right">{b.teamCount}</TableCell>
                                <TableCell className="text-right">
                                    {canEdit(b) && (
                                        <Button variant="ghost" size="sm" onClick={() => setEditing(b)}>
                                            <Pencil /> Edit
                                        </Button>
                                    )}
                                    {can("branches:manage") && !b.isDefault && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            disabled={archive.isPending}
                                            onClick={() => archive.mutate([b.id])}
                                        >
                                            <Archive /> Archive
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {editing && <BranchDialog branch={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
        </div>
    );
}

function BranchDialog({ branch, onClose }: { branch: Branch | null; onClose: () => void }) {
    const { session } = useAuth();
    const [name, setName] = useState(branch?.name ?? "");
    const [code, setCode] = useState(branch?.code ?? "");
    const [timezone, setTimezone] = useState(branch?.timezone ?? session?.organization.timezone ?? "UTC");
    const [address, setAddress] = useState(branch?.address ?? "");
    const timeZones = useMemo(() => Intl.supportedValuesOf("timeZone"), []);

    const create = useIdentityAction(identityApi.createBranch, (b) => `Branch ${b.name} created`);
    const update = useIdentityAction(identityApi.updateBranch, "Branch updated");

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const input = { name, code: code || null, timezone, address: address || null };
        if (branch) update.mutate([branch.id, input], { onSuccess: onClose });
        else create.mutate([input], { onSuccess: onClose });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{branch ? `Edit ${branch.name}` : "New branch"}</DialogTitle>
                    <DialogDescription>A branch is an office or center. Members, teams and leads belong to one.</DialogDescription>
                </DialogHeader>
                <form id="branch-form" onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                        <div className="grid gap-1.5">
                            <Label htmlFor="branch-name">Name</Label>
                            <Input id="branch-name" required value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="branch-code">Code</Label>
                            <Input
                                id="branch-code"
                                maxLength={10}
                                placeholder="BLR"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="branch-tz">Time zone</Label>
                        <Input
                            id="branch-tz"
                            list="branch-timezones"
                            required
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                        />
                        <datalist id="branch-timezones">
                            {timeZones.map((tz) => (
                                <option key={tz} value={tz} />
                            ))}
                        </datalist>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="branch-address">Address</Label>
                        <Input id="branch-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="submit" form="branch-form" disabled={create.isPending || update.isPending}>
                        {branch ? "Save" : "Create branch"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
