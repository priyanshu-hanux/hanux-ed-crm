import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as accountApi from "@/apis/account-api";
import type { AuthRedirectState } from "@/components/site/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { isApiError } from "@/types/app-error";

const PASSWORD_RULE = "At least 8 characters with uppercase, lowercase, and a number";
const passwordOk = (p: string) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);

/** Opened from the reset email: /auth/reset-password/:token */
export default function ResetPasswordPage() {
    const { token = "" } = useParams();
    const navigate = useNavigate();
    const { refreshSession } = useAuth();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!passwordOk(password)) return setError(PASSWORD_RULE);
        if (password !== confirm) return setError("The passwords don't match");
        setError(null);
        setSubmitting(true);
        try {
            await accountApi.resetPassword(token, password);
            // Every session was signed out, including this browser's.
            await refreshSession();
            const state: AuthRedirectState = { notice: "Your password was changed. Sign in with your new password." };
            navigate("/auth/sign-in", { replace: true, state });
        } catch (err) {
            setError(isApiError(err) ? err.message : "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-layout px-4 py-10">
            <section className="card-premium w-full max-w-md bg-card/95 p-6 sm:px-8">
                <h1 className="font-serif text-2xl tracking-[-0.02em]">Choose a new password</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    You'll be signed out on every device, then you can sign in with the new password.
                </p>
                <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                        >
                            <CircleAlert className="mt-0.5 size-4 shrink-0" />
                            <span>
                                {error}{" "}
                                {error.includes("Request a new one") && (
                                    <Link to="/auth/forgot-password" className="underline">
                                        Request a new link
                                    </Link>
                                )}
                            </span>
                        </div>
                    )}
                    <div className="grid gap-1.5">
                        <Label htmlFor="reset-password">New password</Label>
                        <Input
                            id="reset-password"
                            type="password"
                            autoComplete="new-password"
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">{PASSWORD_RULE}</p>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="reset-confirm">Confirm new password</Label>
                        <Input
                            id="reset-confirm"
                            type="password"
                            autoComplete="new-password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="h-11" disabled={submitting}>
                        {submitting ? "Saving…" : "Change password"}
                    </Button>
                </form>
            </section>
        </main>
    );
}
