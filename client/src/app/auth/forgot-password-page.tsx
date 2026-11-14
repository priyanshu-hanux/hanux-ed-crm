import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { CircleAlert, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as accountApi from "@/apis/account-api";
import type { AuthRedirectState } from "@/components/site/protected-route";
import { isApiError } from "@/types/app-error";

export default function ForgotPasswordPage() {
    const location = useLocation();
    const [email, setEmail] = useState((location.state as AuthRedirectState | null)?.email ?? "");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setError("Enter a valid email address");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await accountApi.forgotPassword(email.trim());
            setSent(true);
        } catch (err) {
            setError(isApiError(err) ? err.message : "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-layout px-4 py-10">
            <section className="card-premium w-full max-w-md bg-card/95 p-6 sm:px-8">
                {sent ? (
                    <div className="space-y-4">
                        <MailCheck className="size-8 text-primary" />
                        <h1 className="font-serif text-2xl">Check your email</h1>
                        <p className="text-sm text-muted-foreground">
                            If an account exists for <strong className="text-foreground">{email.trim()}</strong>, we sent a link
                            to choose a new password. It expires in 30 minutes.
                        </p>
                        <Button asChild variant="outline">
                            <Link to="/auth/sign-in">Back to sign in</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <h1 className="font-serif text-2xl tracking-[-0.02em]">Reset your password</h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Enter your account's email and we'll send you a link to choose a new password.
                        </p>
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
                                <Label htmlFor="forgot-email">Email address</Label>
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    autoComplete="email"
                                    autoFocus
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="h-11" disabled={submitting}>
                                {submitting ? "Sending…" : "Send reset link"}
                            </Button>
                            <Link to="/auth/sign-in" className="text-center text-sm text-muted-foreground hover:underline">
                                Back to sign in
                            </Link>
                        </form>
                    </>
                )}
            </section>
        </main>
    );
}
