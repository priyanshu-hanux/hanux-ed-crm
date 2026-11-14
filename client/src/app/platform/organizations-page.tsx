import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Building2, CirclePause, CirclePlay, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { customColumn, DataTable, numberColumn, textColumn, type ColumnDef, type DataTableAction } from "@/components/table";
import * as platformApi from "@/apis/platform-api";
import type { PlatformOrganization } from "@/apis/platform-api";
import { isApiError } from "@/types/app-error";

const ago = (date: string | null) => (date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : "—");

/** Hanux staff: every organization, with suspend and restore. No CRM data. */
export default function OrganizationsPage() {
    const queryClient = useQueryClient();
    const stats = useQuery({ queryKey: ["platform", "stats"], queryFn: platformApi.getStats });
    const orgs = useQuery({ queryKey: ["platform", "organizations"], queryFn: () => platformApi.listOrganizations() });
    const [suspending, setSuspending] = useState<PlatformOrganization | null>(null);
    const [reason, setReason] = useState("");

    const refresh = () => void queryClient.invalidateQueries({ queryKey: ["platform"] });
    const onError = (error: unknown) => toast.error(isApiError(error) ? error.message : "Something went wrong");

    const suspend = useMutation({
        mutationFn: ({ id, why }: { id: string; why: string }) => platformApi.suspendOrganization(id, why),
        onSuccess: () => {
            toast.success(`${suspending?.name} was suspended`);
            setSuspending(null);
            setReason("");
            refresh();
        },
        onError,
    });
    const restore = useMutation({
        mutationFn: (org: PlatformOrganization) => platformApi.restoreOrganization(org.id),
        onSuccess: (_r, org) => {
            toast.success(`${org.name} was restored`);
            refresh();
        },
        onError,
    });

    const columns = useMemo<ColumnDef<PlatformOrganization>[]>(
        () => [
            customColumn<PlatformOrganization>({
                id: "organization",
                title: "Organization",
                icon: Building2,
                size: 260,
                hideable: false,
                value: (o) => `${o.name} ${o.slug}`,
                sortFn: (a, b) => a.original.name.localeCompare(b.original.name),
                render: (o) => (
                    <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium">{o.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{o.slug}</div>
                    </div>
                ),
            }),
            textColumn<PlatformOrganization>({
                id: "status",
                title: "Status",
                value: (o) => (o.status === "ACTIVE" ? "Active" : "Suspended"),
                filter: { type: "select" },
                render: (value, o) => (
                    <span title={o.suspendedReason ?? undefined}>
                        <Badge variant={value === "Active" ? "outline" : "destructive"}>{value}</Badge>
                    </span>
                ),
            }),
            textColumn<PlatformOrganization>({
                id: "owner",
                title: "Owner",
                value: (o) => (o.owner ? `${o.owner.name} (${o.owner.email})` : undefined),
            }),
            numberColumn<PlatformOrganization>({ id: "members", title: "Members", icon: Users, value: (o) => o.memberCount }),
            numberColumn<PlatformOrganization>({ id: "branches", title: "Branches", value: (o) => o.branchCount }),
            customColumn<PlatformOrganization>({
                id: "lastActivity",
                title: "Last activity",
                value: (o) => o.lastActivityAt ?? "",
                render: (o) => <span className="text-[13px] text-muted-foreground">{ago(o.lastActivityAt)}</span>,
            }),
            customColumn<PlatformOrganization>({
                id: "created",
                title: "Created",
                value: (o) => o.createdAt,
                render: (o) => <span className="text-[13px] text-muted-foreground">{ago(o.createdAt)}</span>,
            }),
        ],
        []
    );

    const actions: DataTableAction<PlatformOrganization>[] = [
        {
            label: "Suspend",
            icon: CirclePause,
            variant: "destructive",
            onClick: (org) => setSuspending(org),
            show: (org) => org.status === "ACTIVE",
        },
        {
            label: "Restore",
            icon: CirclePlay,
            onClick: (org) => restore.mutate(org),
            show: (org) => org.status === "SUSPENDED",
        },
    ];

    const tiles = [
        { label: "Organizations", value: stats.data?.organizations },
        { label: "Suspended", value: stats.data?.suspended },
        { label: "Active users", value: stats.data?.users },
        { label: "Sessions in the last 24 h", value: stats.data?.activeSessions },
    ];

    return (
        <div className="w-full min-w-0 space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Organizations</h1>
                <p className="text-sm text-muted-foreground">
                    Every organization on Hanux CRM. You manage accounts here; their CRM data stays private to them.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {tiles.map((tile) => (
                    <Card key={tile.label}>
                        <CardHeader>
                            <CardDescription>{tile.label}</CardDescription>
                            <CardTitle className="text-2xl tabular-nums">{tile.value ?? "—"}</CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={orgs.data?.data ?? []}
                isLoading={orgs.isLoading}
                error={orgs.error}
                onRefresh={refresh}
                isRefreshing={orgs.isFetching}
                itemName="organization"
                searchColumns={["organization", "owner"]}
                searchPlaceholder="Search by name, address or owner"
                persistKey="platform-organizations"
                actions={actions}
                cardFields={{ title: "name", subtitle: "slug" }}
            />

            <Dialog open={suspending !== null} onOpenChange={(open) => !open && setSuspending(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Suspend {suspending?.name}?</DialogTitle>
                        <DialogDescription>
                            Its {suspending?.memberCount} member{suspending?.memberCount === 1 ? "" : "s"} lose access on their next
                            request and can't sign in until you restore it. Their Super Admins can see the reason in their
                            activity log.
                        </DialogDescription>
                    </DialogHeader>
                    <CardContent className="grid gap-1.5 px-0">
                        <Label htmlFor="suspend-reason">Reason</Label>
                        <Textarea
                            id="suspend-reason"
                            rows={3}
                            placeholder="e.g. Unpaid invoice since 1 November"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </CardContent>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspending(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={reason.trim().length < 3 || suspend.isPending}
                            onClick={() => suspending && suspend.mutate({ id: suspending.id, why: reason.trim() })}
                        >
                            Suspend organization
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
