import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-layout px-4">
            <div className="min-h-screen flex-1 rounded-xl bg-muted md:min-h-min" />
            <AuthForm mode="signup" />
        </main>
    );
}