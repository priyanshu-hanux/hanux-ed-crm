import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as platformApi from "@/apis/platform-api";

const ago = (date: string | null, never = "Never") =>
    date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : never;

/**
 * Everyone with Platform Admin access. Read-only on purpose: if the app could
 * grant it, a single taken-over staff account could hand it out.
 */
export default function PlatformTeamPage() {
    const admins = useQuery({ queryKey: ["platform", "admins"], queryFn: platformApi.listPlatformAdmins });

    return (
        <div className="w-full min-w-0 space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Platform team</h1>
                <p className="text-sm text-muted-foreground">
                    Everyone with Platform Admin access. If you see a name you don't expect, revoke it and tell the team.
                </p>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Admin</TableHead>
                            <TableHead>Own organization</TableHead>
                            <TableHead>Last sign-in</TableHead>
                            <TableHead>Platform actions</TableHead>
                            <TableHead>Admin since</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins.isLoading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground">
                                    Loading…
                                </TableCell>
                            </TableRow>
                        )}
                        {admins.data?.map((admin) => (
                            <TableRow key={admin.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2 font-medium">
                                        {admin.name}
                                        {admin.isYou && <span className="text-xs text-muted-foreground">(you)</span>}
                                        {admin.status !== "ACTIVE" && <Badge variant="destructive">Disabled</Badge>}
                                        {!admin.emailVerifiedAt && <Badge variant="outline">Email not verified</Badge>}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{admin.email}</div>
                                </TableCell>
                                <TableCell>{admin.organization?.name ?? "—"}</TableCell>
                                <TableCell className="text-muted-foreground">{ago(admin.lastLoginAt)}</TableCell>
                                <TableCell>
                                    {admin.actionCount > 0 ? (
                                        <Link
                                            to={`/platform/activity?actor=${admin.id}`}
                                            className="text-primary hover:underline"
                                        >
                                            {admin.actionCount} {admin.actionCount === 1 ? "action" : "actions"}, last{" "}
                                            {ago(admin.lastActionAt)}
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground">None yet</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{ago(admin.createdAt)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
                <Terminal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="space-y-1.5">
                    <p className="font-medium">Adding or removing Platform Admins</p>
                    <p className="text-muted-foreground">
                        This can't be done from the app, on purpose. Someone with access to the server runs:
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-xs">
                        {"npm run platform:admin -- grant name@hanux.com \"Their Name\"\nnpm run platform:admin -- revoke name@hanux.com"}
                    </pre>
                </div>
            </div>
        </div>
    );
}
