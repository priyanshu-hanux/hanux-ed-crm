import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { BadgeCheck, Laptop, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as accountApi from "@/apis/account-api";
import { useAuth } from "@/hooks/use-auth";
import { isApiError } from "@/types/app-error";

const errorText = (error: unknown) => (isApiError(error) ? error.message : "Something went wrong");
const PASSWORD_RULE = "At least 8 characters with uppercase, lowercase, and a number";
const passwordOk = (p: string) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);

function Section({ id, title, description, children }: { id?: string; title: string; description: string; children: ReactNode }) {
    return (
        <Card id={id}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

export function ProfileSection() {
    const { session, refreshSession } = useAuth();
    const [name, setName] = useState(session?.user.name ?? "");
    const save = useMutation({
        mutationFn: () => accountApi.updateProfile({ name: name.trim() }),
        onSuccess: async () => {
            await refreshSession();
            toast.success("Profile updated");
        },
        onError: (e) => toast.error(errorText(e)),
    });

    return (
        <Section title="Profile" description="How you appear to others in your organization.">
            <form
                className="flex flex-wrap items-end gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    save.mutate();
                }}
            >
                <div className="grid min-w-60 flex-1 gap-1.5">
                    <Label htmlFor="profile-name">Name</Label>
                    <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <Button type="submit" disabled={save.isPending || !name.trim() || name.trim() === session?.user.name}>
                    Save
                </Button>
            </form>
        </Section>
    );
}

export function EmailSection() {
    const { session, refreshSession } = useAuth();
    const [code, setCode] = useState("");
    const [codeSent, setCodeSent] = useState(false);

    const send = useMutation({
        mutationFn: accountApi.sendVerificationCode,
        onSuccess: () => {
            setCodeSent(true);
            toast.success(`We sent a code to ${session?.user.email}`);
        },
        onError: (e) => toast.error(errorText(e)),
    });
    const verify = useMutation({
        mutationFn: () => accountApi.verifyEmail(code),
        onSuccess: async () => {
            await refreshSession();
            toast.success("Email verified");
        },
        onError: (e) => toast.error(errorText(e)),
    });

    const verified = Boolean(session?.user.emailVerifiedAt);
    return (
        <Section
            id="email"
            title="Email"
            description="Verifying your email lets you invite people and keeps your account recoverable."
        >
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{session?.user.email}</span>
                {verified ? (
                    <Badge variant="secondary" className="gap-1">
                        <BadgeCheck className="size-3.5" /> Verified
                    </Badge>
                ) : (
                    <Badge variant="destructive">Not verified</Badge>
                )}
            </div>
            {!verified && (
                <div className="mt-4 grid gap-3">
                    <p className="text-sm text-muted-foreground">
                        {codeSent
                            ? "Enter the 6-digit code from the email. It expires in 10 minutes."
                            : "We'll email you a 6-digit code."}
                    </p>
                    <form
                        className="flex flex-wrap items-center gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            verify.mutate();
                        }}
                    >
                        <Input
                            aria-label="Verification code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="123456"
                            maxLength={6}
                            className="w-32 font-mono tracking-widest"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        />
                        <Button type="submit" disabled={code.length !== 6 || verify.isPending}>
                            Verify
                        </Button>
                        <Button type="button" variant="outline" disabled={send.isPending} onClick={() => send.mutate()}>
                            {codeSent ? "Send a new code" : "Send code"}
                        </Button>
                    </form>
                </div>
            )}
        </Section>
    );
}

export function PasswordSection() {
    const queryClient = useQueryClient();
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);

    const change = useMutation({
        mutationFn: () => accountApi.changePassword(current, next),
        onSuccess: () => {
            setCurrent("");
            setNext("");
            setConfirm("");
            void queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast.success("Password changed. Your other devices were signed out.");
        },
        onError: (e) => setError(errorText(e)),
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!passwordOk(next)) return setError(PASSWORD_RULE);
        if (next !== confirm) return setError("The new passwords don't match");
        setError(null);
        change.mutate();
    };

    return (
        <Section title="Password" description="Changing it signs you out on your other devices.">
            <form onSubmit={submit} noValidate className="grid max-w-md gap-3">
                <div className="grid gap-1.5">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{PASSWORD_RULE}</p>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                </div>
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
                <Button type="submit" className="w-fit" disabled={!current || !next || change.isPending}>
                    Change password
                </Button>
            </form>
        </Section>
    );
}

/** "Chrome on Windows" from a user-agent string; good enough to recognize a device. */
function describeDevice(userAgent: string | null) {
    if (!userAgent) return "Unknown device";
    const browser =
        /Edg\//.test(userAgent)
            ? "Edge"
            : /Chrome\//.test(userAgent)
              ? "Chrome"
              : /Firefox\//.test(userAgent)
                ? "Firefox"
                : /Safari\//.test(userAgent)
                  ? "Safari"
                  : "Browser";
    const os = /Windows/.test(userAgent)
        ? "Windows"
        : /Android/.test(userAgent)
          ? "Android"
          : /iPhone|iPad/.test(userAgent)
            ? "iOS"
            : /Mac OS X/.test(userAgent)
              ? "macOS"
              : /Linux/.test(userAgent)
                ? "Linux"
                : "";
    return os ? `${browser} on ${os}` : browser;
}

export function SessionsSection() {
    const queryClient = useQueryClient();
    const sessions = useQuery({ queryKey: ["sessions"], queryFn: accountApi.listSessions });
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ["sessions"] });

    const revoke = useMutation({
        mutationFn: accountApi.revokeSession,
        onSuccess: () => {
            refresh();
            toast.success("Signed out of that device");
        },
        onError: (e) => toast.error(errorText(e)),
    });
    const revokeOthers = useMutation({
        mutationFn: accountApi.revokeOtherSessions,
        onSuccess: (r) => {
            refresh();
            toast.success(r.revoked ? `Signed out of ${r.revoked} other device${r.revoked === 1 ? "" : "s"}` : "No other devices");
        },
        onError: (e) => toast.error(errorText(e)),
    });

    const others = sessions.data?.filter((s) => !s.current).length ?? 0;
    return (
        <Section title="Where you're signed in" description="Sign out of any device you don't recognize.">
            {sessions.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            <ul className="divide-y">
                {sessions.data?.map((s) => {
                    const mobile = /Mobile|Android|iPhone/.test(s.userAgent ?? "");
                    const Icon = mobile ? Smartphone : Laptop;
                    return (
                        <li key={s.id} className="flex items-center gap-3 py-3">
                            <Icon className="size-5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    {describeDevice(s.userAgent)}
                                    {s.current && <Badge variant="secondary">This device</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {s.ip ?? "Unknown IP"} · active{" "}
                                    {formatDistanceToNow(new Date(s.lastUsedAt), { addSuffix: true })} · signed in{" "}
                                    {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                                </div>
                            </div>
                            {!s.current && (
                                <Button variant="ghost" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>
                                    Sign out
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ul>
            {others > 0 && (
                <Button
                    variant="outline"
                    className="mt-3"
                    disabled={revokeOthers.isPending}
                    onClick={() => revokeOthers.mutate()}
                >
                    Sign out of all other devices
                </Button>
            )}
        </Section>
    );
}
