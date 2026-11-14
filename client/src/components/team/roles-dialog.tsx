import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as identityApi from "@/apis/identity-api";
import { useAuth } from "@/hooks/use-auth";
import type { Branch, Member } from "@/types/identity";
import { ROLE_LABELS, type OrgRole } from "@/types/session";
import { canAssign, grantableRoles, roleLabel } from "./people-rules";
import { useIdentityAction } from "./use-identity";

/** See and change one member's roles. */
export function RolesDialog({
    member,
    branches,
    onOpenChange,
}: {
    member: Member | null;
    branches: Branch[];
    onOpenChange: (open: boolean) => void;
}) {
    const { activeAssignment } = useAuth();
    const grantable = grantableRoles(activeAssignment);
    const isSuperAdmin = activeAssignment?.role === "SUPER_ADMIN";

    const [role, setRole] = useState<OrgRole | "">("");
    const [branchId, setBranchId] = useState(activeAssignment?.branch?.id ?? branches[0]?.id ?? "");

    const add = useIdentityAction(identityApi.addMemberRole, "Role added");
    const remove = useIdentityAction(identityApi.removeMemberRole, "Role removed");

    if (!member) return null;
    const needsBranch = role !== "" && role !== "SUPER_ADMIN";
    const targetBranch = needsBranch ? (isSuperAdmin ? branchId : (activeAssignment?.branch?.id ?? "")) : null;

    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Roles for {member.name}</DialogTitle>
                    <DialogDescription>
                        Their permissions change on their next request. They can switch between roles from the sidebar.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap gap-2">
                    {member.roles.map((r) => {
                        const removable =
                            member.roles.length > 1 &&
                            !(member.isOwner && r.role === "SUPER_ADMIN") &&
                            canAssign(activeAssignment, r.role, r.branch?.id ?? null);
                        return (
                            <Badge key={r.id} variant="secondary" className="gap-1 py-1 pr-1">
                                {roleLabel(r.role, r.branch, branches.length)}
                                {removable && (
                                    <button
                                        type="button"
                                        aria-label={`Remove ${roleLabel(r.role, r.branch, branches.length)}`}
                                        className="rounded-sm p-0.5 hover:bg-muted"
                                        disabled={remove.isPending}
                                        onClick={() => remove.mutate([member.id, r.id])}
                                    >
                                        <X className="size-3" />
                                    </button>
                                )}
                            </Badge>
                        );
                    })}
                </div>

                {grantable.length > 0 && member.status === "ACTIVE" && (
                    <div className="grid gap-3 border-t pt-4">
                        <Label>Add a role</Label>
                        <div className="flex flex-wrap gap-2">
                            <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {grantable.map((g) => (
                                        <SelectItem key={g.role} value={g.role}>
                                            {ROLE_LABELS[g.role]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {needsBranch && isSuperAdmin && branches.length > 1 && (
                                <Select value={branchId} onValueChange={setBranchId}>
                                    <SelectTrigger className="w-40">
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
                            )}
                            <Button
                                disabled={!role || add.isPending}
                                onClick={() =>
                                    role &&
                                    add.mutate([member.id, role, targetBranch], {
                                        onSuccess: () => setRole(""),
                                    })
                                }
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
