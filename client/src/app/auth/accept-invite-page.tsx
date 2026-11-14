import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as identityApi from "@/apis/identity-api";
import { useAuth } from "@/hooks/use-auth";
import { isApiError } from "@/types/app-error";
import { ROLE_LABELS } from "@/types/session";

const PASSWORD_RULE = "At least 8 characters with uppercase, lowercase, and a number";
const passwordOk = (p: string) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);

/** Opened from the invitation email: /auth/invite/:token */
export default function AcceptInvitePage() {
    const { token = "" } = useParams();
    const navigate = useNavigate();
    const { status, session, signOut, refreshSession } = useAuth();

    const preview = useQuery({
        queryKey: ["invite-preview", token],
        queryFn: () => identityApi.getInvitePreview(token),
        retry: false,
    });

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        const errors: Record<string, string> = {};
        if (!name.trim()) errors.name = "Enter your name";
        if (!passwordOk(password)) errors.password = PASSWORD_RULE;
        setFieldErrors(errors);
        if (Object.keys(errors).length) return;

        setSubmitting(true);
        try {
            await identityApi.acceptInvite(token, { name: name.trim(), password });
            await refreshSession();
            navigate("/", { replace: true });
        } catch (err) {
            if (isApiError(err) && err.code === "VALIDATION_ERROR") setFieldErrors(err.fieldErrors);
            else setError(isApiError(err) ? err.message : "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    const invite = preview.data;

    return (
        <main className="flex min-h-screen items-center justify-center bg-layout px-4 py-10">
            <section className="card-premium w-full max-w-md bg-card/95 p-6 sm:px-8">
                {preview.isLoading && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin" /> Checking your invitation…
                    </p>
                )}

                {preview.isError && (
                    <div className="space-y-4">
                        <h1 className="font-serif text-2xl">Invitation unavailable</h1>
                        <p className="text-sm text-muted-foreground">
                            {isApiError(preview.error) ? preview.error.message : "This invitation can't be opened."}
                        </p>
                        <Button asChild variant="outline">
                            <Link to="/auth/sign-in">Go to sign in</Link>
                        </Button>
                    </div>
                )}

                {invite && (
                    <>
                        <h1 className="font-serif text-2xl tracking-[-0.02em]">Join {invite.organization.name}</h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            {invite.invitedBy ? `${invite.invitedBy.name} invited you` : "You're invited"} as{" "}
                            <strong className="text-foreground">{ROLE_LABELS[invite.role]}</strong>
                            {invite.role !== "SUPER_ADMIN" && ` in ${invite.branch.name}`}
                            {invite.team && `, on the ${invite.team.name} team`}.
                        </p>

                        {status === "authenticated" ? (
                            <div className="mt-6 space-y-3 text-sm">
                                <p>
                                    You're signed in as <strong>{session?.user.email}</strong>. Sign out to accept this
                                    invitation for {invite.email}.
                                </p>
                                <Button variant="outline" onClick={() => void signOut()}>
                                    Sign out
                                </Button>
                            </div>
                        ) : invite.accountExists ? (
                            <p className="mt-6 text-sm">
                                {invite.email} already has an account. Joining a second organization isn't supported yet.
                            </p>
                        ) : (
                            <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                                    >
                                        <CircleAlert className="mt-0.5 size-4 shrink-0" />
                                        {error}
                                    </div>
                                )}
                                <div className="grid gap-1.5">
                                    <Label htmlFor="invite-email">Email</Label>
                                    <Input id="invite-email" value={invite.email} disabled />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="invite-name">Full name</Label>
                                    <Input
                                        id="invite-name"
                                        autoComplete="name"
                                        autoFocus
                                        value={name}
                                        aria-invalid={fieldErrors.name ? true : undefined}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="invite-password">Create a password</Label>
                                    <Input
                                        id="invite-password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={password}
                                        aria-invalid={fieldErrors.password ? true : undefined}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <p className={fieldErrors.password ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                                        {fieldErrors.password ?? PASSWORD_RULE}
                                    </p>
                                </div>
                                <Button type="submit" disabled={submitting} className="h-11">
                                    {submitting ? "Joining…" : `Join ${invite.organization.name}`}
                                </Button>
                            </form>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
