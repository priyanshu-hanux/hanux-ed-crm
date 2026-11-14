import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableStateView } from "@/components/table";
import * as platformApi from "@/apis/platform-api";
import type { PlatformAuditEntry } from "@/apis/platform-api";

function describe(entry: PlatformAuditEntry) {
    const org = entry.organization?.name ?? String(entry.metadata?.name ?? "an organization");
    switch (entry.action) {
        case "platform.org_suspended":
            return `suspended ${org}: “${String(entry.metadata?.reason ?? "")}”`;
        case "platform.org_restored":
            return `restored ${org}`;
        case "platform.mode_entered":
            return "started working as Platform Admin";
        default:
            return entry.action;
    }
}

/** What Platform Admins have done, across all organizations. `?actor=<id>` shows one admin. */
export default function PlatformActivityPage() {
    const [searchParams] = useSearchParams();
    const actor = searchParams.get("actor") ?? undefined;
    // The page number belongs to one filter; a new filter starts at page 1.
    const [paging, setPaging] = useState({ actor, page: 1 });
    const page = paging.actor === actor ? paging.page : 1;
    const setPage = (update: (page: number) => number) => setPaging({ actor, page: update(page) });

    const log = useQuery({
        queryKey: ["platform", "activity", actor ?? "all", page],
        queryFn: () => platformApi.listPlatformActivity(page, actor),
    });
    const admins = useQuery({ queryKey: ["platform", "admins"], queryFn: platformApi.listPlatformAdmins, enabled: !!actor });
    const actorName = admins.data?.find((a) => a.id === actor)?.name;

    return (
        <div className="w-full min-w-0 space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Platform activity</h1>
                <p className="text-sm text-muted-foreground">What Platform Admins have done. Suspensions also appear in the organization's own log.</p>
            </div>

            {actor && (
                <div className="flex items-center gap-2 text-sm">
                    <span>
                        Showing actions by <strong>{actorName ?? "one admin"}</strong>
                    </span>
                    <Link to="/platform/activity" className="text-primary hover:underline">
                        Show everyone
                    </Link>
                </div>
            )}

            {log.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !log.data?.data.length ? (
                <TableStateView icon={History} title="No platform activity yet" />
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
                                            <span className="font-medium">{entry.actorName ?? "Someone"}</span> {describe(entry)}
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
