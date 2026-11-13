import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-layout px-4 py-10">
            <div className="min-h-screen flex-1 rounded-xl bg-muted md:min-h-min" />
            <AuthForm mode="signin" />
        </main>
    );
}